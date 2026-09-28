import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Paperclip, Plus, Search, X } from 'lucide-react'
import { DemoBadge } from '../../components/DemoBadge'
import { useAuth } from '../../contexts/useAuth'
import {
  beginDemoMessage,
  completeDemoMessage,
  listDemoConversations,
  subscribeDemoConversations,
} from '../../services/manuService'
import type { ChatAttachment } from '../../types/manu'
import manu from '../../assets/figma/manu-chat.png'
import common from '../management.module.css'
import styles from './Manu.module.css'

export default function Manu() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState(listDemoConversations)
  const [activeId, setActiveId] = useState<string | null>(
    () => listDemoConversations()[0]?.id ?? null,
  )
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLButtonElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const active = conversations.find((item) => item.id === activeId)
  useEffect(() => subscribeDemoConversations(() => setConversations(listDemoConversations())), [])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'instant' })
  }, [active?.messages.length, activeId, busy])
  const filtered = conversations.filter((item) =>
    item.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
  )

  function newChat() {
    setActiveId(null)
    setMessage('')
    setError('')
    setAttachments([])
    messageRef.current?.focus()
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text || busy) return
    if (text.length > 500) {
      setError('A mensagem deve ter no máximo 500 caracteres.')
      return
    }
    const id = activeId ?? crypto.randomUUID()
    setError('')
    setBusy(true)
    try {
      setConversations(beginDemoMessage(id, text, attachments))
      setActiveId(id)
      setMessage('')
      setAttachments([])
      setConversations(await completeDemoMessage(id, text, attachments.length > 0))
    } catch {
      setError('Não foi possível gerar a resposta demonstrativa. Tente novamente.')
    } finally {
      setBusy(false)
      messageRef.current?.focus()
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.history} aria-label="Conversas da Manu">
        <h1>Manu</h1>
        <label htmlFor="manu-search" className={styles.search}>
          <span className={styles.srOnly}>Pesquisar conversas</span>
          <Search size={14} aria-hidden="true" />
          <input
            id="manu-search"
            type="search"
            placeholder="Pesquisar"
            value={query}
            maxLength={50}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          className={styles.newChat}
          type="button"
          onClick={newChat}
          disabled={busy || !activeId}
        >
          <Plus size={17} aria-hidden="true" /> Novo chat
        </button>
        <h2>Recentes</h2>
        {filtered.length ? (
          <nav aria-label="Conversas recentes">
            {filtered.map((item) => (
              <button
                className={styles.conversation}
                type="button"
                key={item.id}
                aria-current={item.id === activeId ? 'page' : undefined}
                disabled={busy}
                onClick={() => {
                  setActiveId(item.id)
                  messageRef.current?.focus()
                }}
              >
                {item.title}
              </button>
            ))}
          </nav>
        ) : (
          <p className={common.muted}>
            {query ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa nesta sessão.'}
          </p>
        )}
      </aside>
      <section className={styles.chat} aria-label="Conversa com Manu">
        <DemoBadge>Respostas guiadas · sem IA conectada · histórico só nesta sessão</DemoBadge>
        <div
          className={`${styles.welcome} ${active?.messages.length ? styles.welcomeCompact : ''}`}
        >
          <img src={manu} alt="Manu, assistente do FIXA" width="240" height="240" />
          <h2>Olá {user?.name ?? 'gestor'}, como posso te ajudar hoje?</h2>
        </div>
        {active?.messages.length ? (
          <div
            ref={logRef}
            className={styles.messages}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {active.messages.map((item) => (
              <div
                key={item.id}
                className={`${styles.bubble} ${item.author === 'user' ? styles.user : styles.assistant}`}
              >
                <strong>{item.author === 'user' ? 'Você' : 'Manu'}</strong>
                <p>{item.text}</p>
                {item.attachments?.map((attachment) => (
                  <small className={styles.attachmentName} key={attachment.id}>
                    <Paperclip size={14} aria-hidden="true" /> {attachment.name} · somente nome e
                    tamanho
                  </small>
                ))}
              </div>
            ))}
            {busy && <p role="status">Manu está preparando uma resposta demonstrativa…</p>}
          </div>
        ) : null}
        {error && (
          <p role="alert" className={common.error}>
            {error}
          </p>
        )}
        <form
          className={styles.composer}
          onSubmit={send}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && suggestionsOpen) {
              event.preventDefault()
              setSuggestionsOpen(false)
              suggestionsRef.current?.focus()
            }
          }}
        >
          <label className={styles.srOnly} htmlFor="manu-message">
            Mensagem para Manu
          </label>
          <textarea
            ref={messageRef}
            id="manu-message"
            value={message}
            maxLength={500}
            placeholder="Como posso te ajudar hoje?"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          {attachments.length > 0 && (
            <ul className={styles.attachments}>
              {attachments.map((attachment) => (
                <li key={attachment.id}>
                  <span>
                    {attachment.name} ({Math.ceil(attachment.size / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    aria-label={`Remover anexo ${attachment.name}`}
                    onClick={() =>
                      setAttachments((items) => items.filter((item) => item.id !== attachment.id))
                    }
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.composerActions}>
            <button
              ref={suggestionsRef}
              type="button"
              aria-label="Sugestões de perguntas"
              aria-expanded={suggestionsOpen}
              aria-controls="manu-suggestions"
              onClick={() => setSuggestionsOpen((current) => !current)}
            >
              <Plus size={24} />
            </button>
            <button
              type="button"
              aria-label="Adicionar anexo demonstrativo"
              disabled={attachments.length >= 3 || busy}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={22} />
            </button>
            <input
              id="manu-file"
              ref={fileRef}
              className={styles.srOnly}
              type="file"
              tabIndex={-1}
              aria-label="Arquivo demonstrativo"
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (!file) return
                if (
                  file.size > 5 * 1024 * 1024 ||
                  ![
                    'image/png',
                    'image/jpeg',
                    'image/webp',
                    'application/pdf',
                    'text/plain',
                  ].includes(file.type)
                ) {
                  setError('Escolha PNG, JPEG, WebP, PDF ou texto com até 5 MB.')
                  return
                }
                setError('')
                setAttachments((items) =>
                  [...items, { id: crypto.randomUUID(), name: file.name, size: file.size }].slice(
                    0,
                    3,
                  ),
                )
              }}
            />
            <label htmlFor="manu-file" className={styles.srOnly}>
              Arquivo demonstrativo
            </label>
            <small>{message.length}/500</small>
            <button
              className={styles.send}
              type="submit"
              disabled={busy || !message.trim()}
              aria-label="Enviar mensagem"
            >
              <ArrowUp size={20} />
            </button>
          </div>
          {suggestionsOpen && (
            <div className={styles.suggestions} id="manu-suggestions">
              {[
                'Como cadastrar um técnico?',
                'Como agendar um evento?',
                'Como consultar indicadores?',
              ].map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setMessage(text)
                    setSuggestionsOpen(false)
                    messageRef.current?.focus()
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </form>
        <p className={styles.note}>
          Ctrl + Enter para enviar. Anexos: até 3 arquivos de 5 MB; somente nome e tamanho ficam na
          sessão. Nenhum conteúdo é lido, enviado ou analisado.
        </p>
      </section>
    </div>
  )
}
