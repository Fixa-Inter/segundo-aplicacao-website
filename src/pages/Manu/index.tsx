import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ArrowUp, Check, Paperclip, RotateCcw, X } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { useAuth } from '../../contexts/useAuth'
import { FigmaIcon } from '../../components/FigmaIcon'
import { ApiError } from '../../services/httpClient'
import { manuApi } from '../../services/manuApi'
import { createCloudinaryUploader, validateImageFile } from '../../services/cloudinaryService'
import type { ManuConversation, ManuHistory, ManuMessage } from '../../services/manuService'
import { manuEmotionImage } from '../../assets/manuEmotions'
import { normalizeManuEmotion } from '../../utils/manu'
import welcomeArt from '../../assets/figma/manu-chat.png'
import styles from './Manu.module.css'

const uploader = createCloudinaryUploader(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  fetch,
  import.meta.env.VITE_CLOUDINARY_FOLDER,
)
interface Attachment {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'ready' | 'error'
  url?: string
  error?: string
}
function errorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.status === 503 ||
      (error.status === 0 && error.message.startsWith('Não foi possível conectar à API.')))
  )
    return 'A Manu está temporariamente indisponível. Tente novamente mais tarde.'
  return error instanceof Error ? error.message : 'Não foi possível conectar à Manu.'
}
function historyErrorMessage(reason: unknown) {
  return reason instanceof ApiError && [0, 503].includes(reason.status)
    ? 'Não foi possível carregar as conversas.'
    : errorMessage(reason)
}
export default function Manu() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ManuConversation[]>([])
  const [current, setCurrent] = useState<ManuHistory | null>(null)
  const [messages, setMessages] = useState<ManuMessage[]>([])
  const [question, setQuestion] = useState('')
  const [search, setSearch] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(manuApi.configured)
  const [correcting, setCorrecting] = useState(false)
  const [correction, setCorrection] = useState('')
  const request = useRef<AbortController | null>(null)
  const uploads = useRef(new Map<string, { controller: AbortController; preview: string }>())
  const generation = useRef(0)
  const busyRef = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const uploading = attachments.some((item) => item.status === 'uploading')
  const busy = sending || closing || uploading
  const pendingConfirmation = current?.confirmacao === 'sim' && !current.closed
  const lastReply = messages.findLast((item) => item.author === 'manu')

  useEffect(() => {
    const controller = new AbortController()
    const activeUploads = uploads.current
    if (!manuApi.configured) return () => controller.abort()
    if (manuApi.configured)
      void manuApi
        .list(controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setConversations(data)
            setHistoryError('')
          }
        })
        .catch((reason) => {
          if (!controller.signal.aborted) setHistoryError(historyErrorMessage(reason))
        })
        .finally(() => {
          if (!controller.signal.aborted) setHistoryLoading(false)
        })
    return () => {
      controller.abort()
      request.current?.abort()
      activeUploads.forEach((item) => {
        item.controller.abort()
        URL.revokeObjectURL(item.preview)
      })
      activeUploads.clear()
    }
  }, [user?.id])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, sending, correcting])
  async function refreshConversations() {
    setHistoryLoading(true)
    try {
      setConversations(await manuApi.list())
      setHistoryError('')
    } catch (reason) {
      setConversations(manuApi.cachedList())
      setHistoryError(historyErrorMessage(reason))
    } finally {
      setHistoryLoading(false)
    }
  }
  function clearAttachments() {
    uploads.current.forEach((item) => {
      item.controller.abort()
      URL.revokeObjectURL(item.preview)
    })
    uploads.current.clear()
    setAttachments([])
  }
  function newChat() {
    if (busyRef.current || uploading) return
    generation.current++
    setCurrent(null)
    setMessages([])
    setQuestion('')
    setError('')
    setCorrecting(false)
    setCorrection('')
    clearAttachments()
  }
  async function selectConversation(id: string) {
    if (busyRef.current || uploading) return
    const expected = ++generation.current
    try {
      const data = await manuApi.history(id)
      if (expected !== generation.current) return
      setCurrent(data)
      setMessages(data.messages)
      setQuestion('')
      setError('')
      setCorrecting(false)
      setCorrection('')
      clearAttachments()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }
  async function uploadAttachment(item: Attachment) {
    const controller = new AbortController()
    uploads.current.set(item.id, { controller, preview: item.preview })
    setAttachments((values) =>
      values.map((value) =>
        value.id === item.id ? { ...value, status: 'uploading', error: undefined } : value,
      ),
    )
    try {
      const url = await uploader.upload(item.file, controller.signal)
      if (!controller.signal.aborted)
        setAttachments((values) =>
          values.map((value) =>
            value.id === item.id ? { ...value, status: 'ready', url } : value,
          ),
        )
    } catch (reason) {
      if (!controller.signal.aborted)
        setAttachments((values) =>
          values.map((value) =>
            value.id === item.id
              ? { ...value, status: 'error', error: errorMessage(reason) }
              : value,
          ),
        )
    }
  }
  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    try {
      if (attachments.length + files.length > 3) throw new ApiError('Use até 3 imagens.')
      files.forEach(validateImageFile)
      if (!uploader.configured)
        throw new ApiError('O envio de imagens está indisponível no momento.')
      const added = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading' as const,
      }))
      setAttachments((values) => [...values, ...added])
      setError('')
      added.forEach((item) => void uploadAttachment(item))
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }
  function removeAttachment(id: string) {
    const item = uploads.current.get(id)
    if (item) {
      item.controller.abort()
      URL.revokeObjectURL(item.preview)
      uploads.current.delete(id)
    }
    setAttachments((values) => values.filter((value) => value.id !== id))
  }
  async function send(
    text = question,
    mode: 'message' | 'confirmation' | 'correction' = 'message',
  ) {
    if (busyRef.current || uploading || current?.closed || !text.trim() || !manuApi.configured)
      return
    if (
      mode === 'message' &&
      (pendingConfirmation || attachments.some((item) => item.status !== 'ready'))
    )
      return
    busyRef.current = true
    setSending(true)
    setError('')
    const expected = generation.current
    const controller = new AbortController()
    request.current = controller
    const pending: ManuMessage = {
      id: crypto.randomUUID(),
      author: 'user',
      text: text.trim(),
      images: mode === 'message' ? attachments.flatMap((item) => (item.url ? [item.url] : [])) : [],
    }
    setMessages((values) => [...values, pending])
    const originalQuestion = question
    if (mode === 'message') setQuestion('')
    try {
      const data = await manuApi.send(
        pending.text,
        current?.thread_id ?? null,
        pending.images,
        controller.signal,
      )
      if (controller.signal.aborted || expected !== generation.current) return
      const reply: ManuMessage = {
        id: crypto.randomUUID(),
        author: 'manu',
        text: data.resposta,
        images: [],
        emotion: normalizeManuEmotion(data.emocao),
        confirmation: data.confirmacao === 'sim',
      }
      setMessages((values) => [...values, reply])
      setCurrent({
        thread_id: data.thread_id,
        title: current?.title ?? pending.text.slice(0, 80),
        updated_at: new Date().toISOString(),
        closed: false,
        confirmacao: data.confirmacao,
        messages: [],
      })
      setCorrecting(false)
      setCorrection('')
      if (mode === 'message') clearAttachments()
      await refreshConversations()
    } catch (reason) {
      if (controller.signal.aborted || expected !== generation.current) return
      setMessages((values) => values.filter((value) => value.id !== pending.id))
      if (mode === 'message') setQuestion(originalQuestion)
      setError(
        `${errorMessage(reason)} ${t('Não reenviamos automaticamente: o servidor pode ter recebido a mensagem.')}`,
      )
    } finally {
      if (expected === generation.current) {
        busyRef.current = false
        setSending(false)
      }
    }
  }
  async function closeConversation() {
    if (!current || busy || busyRef.current || pendingConfirmation) return
    busyRef.current = true
    setClosing(true)
    setError('')
    const controller = new AbortController()
    request.current = controller
    const expected = generation.current
    try {
      await manuApi.close(current.thread_id, controller.signal)
      if (controller.signal.aborted || expected !== generation.current) return
      setCurrent(await manuApi.history(current.thread_id))
      await refreshConversations()
    } catch (reason) {
      if (!controller.signal.aborted) setError(errorMessage(reason))
    } finally {
      busyRef.current = false
      setClosing(false)
    }
  }
  const filtered = conversations.filter((item) =>
    item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )
  return (
    <div className={`${styles.page} ${messages.length ? styles.withMessages : ''}`}>
      <aside className={styles.history}>
        <h1>{t('Manu')}</h1>
        <label className={styles.search}>
          <FigmaIcon name="chat-search" />
          <input
            type="search"
            aria-label={t('Pesquisar conversas')}
            placeholder={t('Pesquisar')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button className={styles.newChat} type="button" onClick={newChat} disabled={busy}>
          <FigmaIcon name="edit" />
          {t('Novo chat')}
        </button>
        <div className={styles.historyTitle}>
          <h2>{t('Conversas')}</h2>
        </div>
        {historyLoading && (
          <p className={styles.sessionNote} role="status">
            {t('Carregando conversas…')}
          </p>
        )}
        {historyError && (
          <div className={styles.historyError} role="alert">
            <p>{t(historyError)}</p>
            <button
              type="button"
              onClick={() => void refreshConversations()}
              disabled={historyLoading}
            >
              {t('Tentar novamente')}
            </button>
          </div>
        )}
        {!historyLoading && !historyError && !filtered.length && (
          <p className={styles.emptyHistory}>
            {t(search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa encontrada.')}
          </p>
        )}
        <nav aria-label={t('Conversas recentes')}>
          {filtered.map((item) => (
            <button
              key={item.thread_id}
              type="button"
              className={styles.conversation}
              aria-current={current?.thread_id === item.thread_id ? 'page' : undefined}
              disabled={busy}
              onClick={() => void selectConversation(item.thread_id)}
              title={item.title}
            >
              {item.closed && <Check size={13} aria-label={t('Encerrada')} />} {item.title}
            </button>
          ))}
        </nav>
      </aside>
      <section className={styles.chat} aria-label={t('Manu')}>
        {!messages.length ? (
          <div className={styles.welcome}>
            <img src={welcomeArt} alt="" width="240" height="240" />
            <h2>
              {t('Olá {name}, como posso te ajudar hoje?', {
                name: user?.name.split(' ')[0] ?? '',
              })}
            </h2>
          </div>
        ) : (
          <div className={styles.chatHeading}>
            <h2>{current?.title ?? t('Nova conversa')}</h2>
            {current && (
              <button
                type="button"
                className={styles.closeChat}
                disabled={busy || current.closed || pendingConfirmation}
                onClick={() => void closeConversation()}
              >
                {t(
                  current.closed
                    ? 'Conversa finalizada'
                    : closing
                      ? 'Finalizando…'
                      : 'Finalizar conversa',
                )}
              </button>
            )}
          </div>
        )}
        {(messages.length > 0 || sending) && (
          <div
            className={styles.messages}
            role="log"
            aria-label={t('Mensagens da conversa')}
            aria-live="polite"
            aria-busy={sending}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${message.author === 'user' ? styles.userRow : ''}`}
              >
                {message.author === 'manu' && (
                  <img
                    className={styles.emotionAvatar}
                    src={manuEmotionImage(message.emotion)}
                    data-emotion={message.emotion ?? 'NEUTRO'}
                    alt={t('Manu')}
                    width="72"
                    height="72"
                  />
                )}
                <article
                  className={`${styles.bubble} ${message.author === 'user' ? styles.user : styles.assistant} ${message.confirmation ? styles.proposal : ''}`}
                >
                  <strong>
                    {t(
                      message.author === 'user'
                        ? 'Você'
                        : message.confirmation
                          ? 'Confirme as informações'
                          : 'Manu',
                    )}
                  </strong>
                  <p>{message.text}</p>
                  {!!message.images.length && (
                    <div className={styles.sentImages}>
                      {message.images.map((url, index) => (
                        <a key={url + index} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={t('Imagem {number}', { number: index + 1 })}
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {message.id === lastReply?.id && pendingConfirmation && (
                    <div className={styles.proposalActions}>
                      <p>{t('Você confirma as informações acima?')}</p>
                      <div className={styles.decisionButtons}>
                        <button
                          type="button"
                          disabled={busy}
                          aria-expanded={correcting}
                          onClick={() => setCorrecting(true)}
                        >
                          {t('Não')}
                        </button>
                        <button
                          type="button"
                          className={styles.acceptProposal}
                          disabled={busy || correcting}
                          onClick={() => void send('sim', 'confirmation')}
                        >
                          {t('Sim')}
                        </button>
                      </div>
                      {correcting && (
                        <form
                          className={styles.correction}
                          onSubmit={(event) => {
                            event.preventDefault()
                            if (correction.trim())
                              void send(
                                `Antes de confirmar, corrija as seguintes informações: ${correction.trim()}`,
                                'correction',
                              )
                          }}
                        >
                          <label htmlFor="manu-correction">
                            {t('O que precisa ser corrigido?')}
                          </label>
                          <textarea
                            id="manu-correction"
                            value={correction}
                            maxLength={3900}
                            disabled={busy}
                            onChange={(event) => setCorrection(event.target.value)}
                            placeholder={t('Indique a informação incorreta e como ela deve ficar.')}
                          />
                          <div className={styles.decisionButtons}>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setCorrecting(false)
                                setCorrection('')
                              }}
                            >
                              {t('Voltar à proposta')}
                            </button>
                            <button
                              type="submit"
                              className={styles.acceptProposal}
                              disabled={busy || !correction.trim()}
                            >
                              {t('Enviar correção')}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              </div>
            ))}
            {sending && (
              <div className={styles.messageRow} role="status">
                <img
                  className={styles.emotionAvatar}
                  src={manuEmotionImage('AGUARDANDO')}
                  alt=""
                  width="72"
                  height="72"
                />
                <p>{t('A Manu está preparando uma resposta…')}</p>
              </div>
            )}
            <div ref={end} />
          </div>
        )}
        {error && (
          <p className={styles.chatError} role="alert">
            {t(error)}
          </p>
        )}
        {!manuApi.configured && (
          <p className={styles.chatError} role="status">
            {t('O serviço da Manu ainda não foi configurado.')}
          </p>
        )}
        {!pendingConfirmation && (
          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <label htmlFor="manu-question" className={styles.srOnly}>
              {t('Mensagem para a Manu')}
            </label>
            <textarea
              id="manu-question"
              maxLength={4000}
              disabled={busy || current?.closed || pendingConfirmation || !manuApi.configured}
              placeholder={t(
                current?.closed
                  ? 'Inicie uma nova conversa para continuar.'
                  : pendingConfirmation
                    ? 'Revise a proposta acima para continuar.'
                    : 'Como posso te ajudar hoje?',
              )}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void send()
                }
              }}
            />
            {!!attachments.length && (
              <ul className={styles.filePreviews}>
                {attachments.map((item) => (
                  <li key={item.id}>
                    <img src={item.preview} alt="" width="64" height="64" />
                    <div>
                      <span>{item.file.name}</span>
                      <small role={item.status === 'error' ? 'alert' : 'status'}>
                        {t(
                          item.status === 'uploading'
                            ? 'Enviando imagem…'
                            : item.status === 'ready'
                              ? 'Imagem pronta'
                              : (item.error ?? 'Falha no envio'),
                        )}
                      </small>
                    </div>
                    {item.status === 'error' && (
                      <button
                        type="button"
                        aria-label={t('Tentar novamente')}
                        disabled={sending || closing}
                        onClick={() => void uploadAttachment(item)}
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t('Remover imagem {number}', {
                        number: attachments.indexOf(item) + 1,
                      })}
                      disabled={sending || closing}
                      onClick={() => removeAttachment(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.composerActions}>
              <input
                ref={fileInput}
                className={styles.fileInput}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={selectFiles}
              />
              <button
                type="button"
                aria-label={t('Anexar imagens')}
                disabled={
                  busy ||
                  current?.closed ||
                  pendingConfirmation ||
                  attachments.length >= 3 ||
                  !manuApi.configured
                }
                onClick={() => {
                  if (!uploader.configured)
                    setError(t('O envio de imagens está indisponível no momento.'))
                  else fileInput.current?.click()
                }}
              >
                <Paperclip size={21} />
              </button>
              <small>{question.length}/4000</small>
              <button
                type="submit"
                className={styles.send}
                aria-label={t('Enviar mensagem')}
                disabled={
                  busy ||
                  !question.trim() ||
                  current?.closed ||
                  pendingConfirmation ||
                  attachments.some((item) => item.status !== 'ready') ||
                  !manuApi.configured
                }
              >
                <ArrowUp size={22} />
              </button>
            </div>
          </form>
        )}
        {!pendingConfirmation && (
          <p className={styles.note}>
            {t('Enter para enviar; Shift + Enter para uma nova linha.')}
          </p>
        )}
      </section>
    </div>
  )
}
