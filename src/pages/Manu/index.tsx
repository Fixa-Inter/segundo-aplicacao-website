import { useState, type FormEvent } from 'react'
import { Plus, Send } from 'lucide-react'
import { DemoBadge } from '../../components/DemoBadge'
import { useAuth } from '../../contexts/useAuth'
import { getDemoReply } from '../../services/manuService'
import type { ChatConversation, ChatMessage } from '../../types/manu'
import manu from '../../assets/figma/manu-chat.png'
import common from '../management.module.css'
import styles from './Manu.module.css'

export default function Manu() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = conversations.find((item) => item.id === activeId)
  const filtered = conversations.filter((item) =>
    item.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
  )

  function newChat() {
    setActiveId(null)
    setMessage('')
    setError('')
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
    const userMessage: ChatMessage = { id: crypto.randomUUID(), author: 'user', text }
    setConversations((current) =>
      activeId
        ? current.map((conversation) =>
            conversation.id === id
              ? { ...conversation, messages: [...conversation.messages, userMessage] }
              : conversation,
          )
        : [{ id, title: text.slice(0, 38), messages: [userMessage] }, ...current],
    )
    setActiveId(id)
    setMessage('')
    setError('')
    setBusy(true)
    try {
      const reply = await getDemoReply(text)
      const response: ChatMessage = { id: crypto.randomUUID(), author: 'manu', text: reply }
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id
            ? { ...conversation, messages: [...conversation.messages, response] }
            : conversation,
        ),
      )
    } catch {
      setError('Não foi possível gerar a resposta demonstrativa. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.history} aria-label="Conversas da Manu">
        <h1>Manu</h1>
        <label className={common.field}>
          Pesquisar conversas
          <input
            type="search"
            value={query}
            maxLength={50}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button className={common.secondary} type="button" onClick={newChat}>
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
                onClick={() => setActiveId(item.id)}
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
        <DemoBadge>Respostas guiadas · sem IA conectada · conversas não salvas</DemoBadge>
        {active?.messages.length ? (
          <div
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
              </div>
            ))}
            {busy && <p role="status">Manu está preparando uma resposta demonstrativa…</p>}
          </div>
        ) : (
          <div className={styles.welcome}>
            <img src={manu} alt="Manu, assistente do FIXA" width="180" height="180" />
            <h2>Olá {user?.name ?? 'gestor'}, como posso te ajudar hoje?</h2>
            <p>Posso orientar sobre equipe, calendário, solicitações e indicadores.</p>
          </div>
        )}
        {error && (
          <p role="alert" className={common.error}>
            {error}
          </p>
        )}
        <form className={styles.composer} onSubmit={send}>
          <label htmlFor="manu-message">Mensagem para Manu</label>
          <div>
            <textarea
              id="manu-message"
              value={message}
              maxLength={500}
              placeholder="Como posso te ajudar hoje?"
              onChange={(event) => setMessage(event.target.value)}
            />
            <button
              className={common.primary}
              type="submit"
              disabled={busy || !message.trim()}
              aria-label="Enviar mensagem"
            >
              <Send size={20} />
            </button>
          </div>
          <small>{message.length}/500 caracteres</small>
        </form>
      </section>
    </div>
  )
}
