import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Check, Link2, RefreshCw, X } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { useAuth } from '../../contexts/useAuth'
import { FigmaIcon } from '../../components/FigmaIcon'
import { ApiError } from '../../services/httpClient'
import { manuApi } from '../../services/manuApi'
import {
  validateImageLinks,
  type ManuConversation,
  type ManuHistory,
  type ManuMessage,
} from '../../services/manuService'
import manu from '../../assets/figma/manu-chat.png'
import styles from './Manu.module.css'

function errorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.status === 503 ||
      (error.status === 0 && error.message.startsWith('Não foi possível conectar à API.')))
  )
    return 'A Manu está temporariamente indisponível. Tente novamente mais tarde.'
  return error instanceof Error ? error.message : 'Não foi possível conectar à Manu.'
}

export default function Manu() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ManuConversation[]>([])
  const [current, setCurrent] = useState<ManuHistory | null>(null)
  const [messages, setMessages] = useState<ManuMessage[]>([])
  const [question, setQuestion] = useState('')
  const [search, setSearch] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageLink, setImageLink] = useState('')
  const [addingImage, setAddingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const request = useRef<AbortController | null>(null)
  const historyRequest = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const busy = sending || closing
  const busyRef = useRef(false)
  const end = useRef<HTMLDivElement>(null)

  async function refreshHistory(signal?: AbortSignal) {
    if (!manuApi.configured) return
    try {
      const data = await manuApi.list(signal)
      if (!signal?.aborted) {
        setHistoryError('')
        setConversations(data)
      }
    } catch (reason) {
      if (!signal?.aborted) setHistoryError(errorMessage(reason))
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    if (manuApi.configured)
      void manuApi
        .list(controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setHistoryError('')
            setConversations(data)
          }
        })
        .catch((reason) => {
          if (!controller.signal.aborted) setHistoryError(errorMessage(reason))
        })
    return () => {
      controller.abort()
      request.current?.abort()
      historyRequest.current?.abort()
    }
  }, [user?.id])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, sending])

  function newChat() {
    if (busyRef.current) return
    generation.current++
    historyRequest.current?.abort()
    setCurrent(null)
    setMessages([])
    setQuestion('')
    setImages([])
    setAddingImage(false)
    setImageLink('')
    setError('')
    setLoading(false)
  }

  async function selectConversation(threadId: string) {
    if (busyRef.current) return
    const expected = ++generation.current
    historyRequest.current?.abort()
    const controller = new AbortController()
    historyRequest.current = controller
    setLoading(true)
    setError('')
    try {
      const data = await manuApi.history(threadId, controller.signal)
      if (controller.signal.aborted || expected !== generation.current) return
      setCurrent(data)
      setMessages(data.messages)
      setQuestion('')
      setImages([])
      setImageLink('')
      setAddingImage(false)
    } catch (reason) {
      if (!controller.signal.aborted && expected === generation.current)
        setError(errorMessage(reason))
    } finally {
      if (expected === generation.current) setLoading(false)
    }
  }

  async function send(text = question) {
    if (busyRef.current || loading || current?.closed || !text.trim() || !manuApi.configured) return
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
      images: [...images],
    }
    setMessages((previous) => [...previous, pending])
    const originalQuestion = question
    const originalImages = [...images]
    setQuestion('')
    setImages([])
    setAddingImage(false)
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
      }
      setMessages((previous) => [...previous, reply])
      setCurrent({
        thread_id: data.thread_id,
        title: current?.title ?? pending.text.slice(0, 80),
        updated_at: new Date().toISOString(),
        closed: false,
        confirmacao: data.confirmacao,
        messages: [],
      })
      await refreshHistory(controller.signal)
    } catch (reason) {
      if (controller.signal.aborted || expected !== generation.current) return
      setMessages((previous) => previous.filter((message) => message.id !== pending.id))
      setQuestion(originalQuestion || pending.text)
      setImages(originalImages)
      setError(
        `${errorMessage(reason)} ${t('Confira o histórico antes de reenviar: o servidor pode ter recebido a mensagem.')}`,
      )
      await refreshHistory(controller.signal)
    } finally {
      if (expected === generation.current) {
        busyRef.current = false
        setSending(false)
      }
    }
  }

  async function closeConversation() {
    if (!current || busyRef.current || loading) return
    busyRef.current = true
    setClosing(true)
    setError('')
    const expected = generation.current
    const controller = new AbortController()
    request.current = controller
    try {
      const result = await manuApi.close(current.thread_id, controller.signal)
      if (result.status !== 'ENCERRADA')
        throw new Error('Não foi possível confirmar o encerramento da conversa.')
      if (controller.signal.aborted || expected !== generation.current) return
      setCurrent((previous) =>
        previous ? { ...previous, closed: true, confirmacao: 'nao' } : previous,
      )
      await refreshHistory(controller.signal)
    } catch (reason) {
      if (!controller.signal.aborted && expected === generation.current)
        setError(errorMessage(reason))
    } finally {
      if (expected === generation.current) {
        busyRef.current = false
        setClosing(false)
      }
    }
  }

  function attachImage(event: FormEvent) {
    event.preventDefault()
    try {
      setImages(validateImageLinks([...images, imageLink]))
      setImageLink('')
      setAddingImage(false)
      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  const filtered = conversations.filter((item) =>
    item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )
  return (
    <div className={styles.page}>
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
          <h2>{t('Recentes')}</h2>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('Atualizar conversas')}
            disabled={busy}
            onClick={() => void refreshHistory()}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        {historyError && (
          <p className={styles.historyError} role="alert">
            {t(historyError)}
          </p>
        )}
        {!historyError && !filtered.length && (
          <p className={styles.emptyHistory}>
            {t(search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa disponível.')}
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
        <div className={`${styles.welcome} ${messages.length ? styles.welcomeCompact : ''}`}>
          <img src={manu} alt="" width="240" height="240" />
          <h2>
            {t('Olá {name}, como posso te ajudar hoje?', { name: user?.name.split(' ')[0] ?? '' })}
          </h2>
          {current && (
            <button
              type="button"
              className={styles.closeChat}
              disabled={busy || loading || current.closed}
              onClick={() => void closeConversation()}
            >
              {t(
                current.closed
                  ? 'Conversa encerrada'
                  : closing
                    ? 'Encerrando…'
                    : 'Encerrar conversa',
              )}
            </button>
          )}
        </div>
        {(messages.length > 0 || loading) && (
          <div
            className={styles.messages}
            role="log"
            aria-label={t('Mensagens da conversa')}
            aria-live="polite"
            aria-busy={loading || sending}
          >
            {loading ? (
              <p role="status">{t('Carregando conversa…')}</p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`${styles.bubble} ${message.author === 'user' ? styles.user : styles.assistant}`}
                >
                  <strong>{t(message.author === 'user' ? 'Você' : 'Manu')}</strong>
                  <p>{message.text}</p>
                  {message.images.map((url, index) => (
                    <a
                      key={url + index}
                      className={styles.attachmentName}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('Imagem')} {index + 1}
                    </a>
                  ))}
                </article>
              ))
            )}
            {sending && <p role="status">{t('A Manu está preparando uma resposta…')}</p>}
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
        {current?.confirmacao === 'sim' && !current.closed && (
          <div
            className={styles.confirmation}
            role="group"
            aria-label={t('Confirmação da ação proposta')}
          >
            <p>{t('Revise a proposta acima antes de confirmar.')}</p>
            <button type="button" disabled={busy || loading} onClick={() => void send('cancelar')}>
              {t('Cancelar ação')}
            </button>
            <button type="button" disabled={busy || loading} onClick={() => void send('sim')}>
              {t('Confirmar')}
            </button>
          </div>
        )}
        {addingImage && (
          <form className={styles.imageLink} onSubmit={attachImage}>
            <label htmlFor="manu-image-link">{t('Link da imagem')}</label>
            <input
              id="manu-image-link"
              type="url"
              required
              placeholder="https://"
              value={imageLink}
              onChange={(event) => setImageLink(event.target.value)}
            />
            <button type="submit">{t('Adicionar')}</button>
            <button type="button" aria-label={t('Cancelar')} onClick={() => setAddingImage(false)}>
              <X size={18} />
            </button>
          </form>
        )}
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
            disabled={busy || loading || current?.closed || !manuApi.configured}
            placeholder={t(
              current?.closed
                ? 'Inicie uma nova conversa para continuar.'
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
          {images.length > 0 && (
            <ul className={styles.attachments}>
              {images.map((url, index) => (
                <li key={url + index}>
                  <span>
                    {t('Imagem')} {index + 1}: {new URL(url).hostname}
                  </span>
                  <button
                    type="button"
                    aria-label={t('Remover imagem {number}', { number: index + 1 })}
                    disabled={busy}
                    onClick={() => setImages((values) => values.filter((_, i) => i !== index))}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.composerActions}>
            <button
              type="button"
              aria-label={t('Adicionar link de imagem')}
              disabled={
                busy || loading || current?.closed || images.length >= 3 || !manuApi.configured
              }
              onClick={() => setAddingImage((value) => !value)}
            >
              <Link2 size={21} />
            </button>
            <small>{question.length}/4000</small>
            <button
              type="submit"
              className={styles.send}
              aria-label={t('Enviar mensagem')}
              disabled={
                busy || loading || !question.trim() || current?.closed || !manuApi.configured
              }
            >
              <ArrowUp size={22} />
            </button>
          </div>
        </form>
        <p className={styles.note}>{t('Enter para enviar; Shift + Enter para uma nova linha.')}</p>
      </section>
    </div>
  )
}
