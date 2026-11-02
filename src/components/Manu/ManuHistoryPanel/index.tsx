import { useId } from 'react'
import { PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react'
import { FigmaIcon } from '../../FigmaIcon'
import { LoadingState } from '../../LoadingState'
import type { ManuHistoryPanelProps } from '../../../types/manuComponents'
import styles from '../Manu.module.css'

export function ManuHistoryPanel({ chat, collapsed, onToggle }: ManuHistoryPanelProps) {
  const panelId = useId()
  const {
    t,
    current,
    search,
    setSearch,
    closing,
    setDeleting,
    setDeleteError,
    historyError,
    historyLoading,
    newChatButton,
    busy,
    refreshConversations,
    selectConversation,
    newChat,
    filtered,
  } = chat
  return (
    <>
      <aside className={styles.history} data-history-collapsed={collapsed}>
        <div className={styles.historyHeader}>
          <h1>{t('Manu')}</h1>
          <button
            type="button"
            className={styles.historyToggle}
            aria-label={t(collapsed ? 'Expandir histórico' : 'Recolher histórico')}
            title={t(collapsed ? 'Expandir histórico' : 'Recolher histórico')}
            aria-expanded={!collapsed}
            aria-controls={panelId}
            onClick={onToggle}
          >
            {collapsed ? (
              <PanelLeftOpen size={20} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        <div id={panelId} className={styles.historyBody} hidden={collapsed}>
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
          <button
            ref={newChatButton}
            className={styles.newChat}
            aria-label={t(closing ? 'Finalizando…' : 'Novo chat')}
            title={t(closing ? 'Finalizando…' : 'Novo chat')}
            type="button"
            onClick={() => void newChat()}
            disabled={busy}
          >
            <Plus size={22} aria-hidden="true" />
            <span>{t(closing ? 'Finalizando…' : 'Novo chat')}</span>
          </button>
          <div className={styles.historyTitle}>
            <h2>{t('Conversas')}</h2>
          </div>
          {historyLoading && <LoadingState compact label="Carregando conversas…" />}
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
            <p className={styles.emptyHistory}>{t('Nenhuma conversa encontrada.')}</p>
          )}
          <nav aria-label={t('Conversas recentes')}>
            {filtered.map((item) => (
              <div
                key={item.thread_id}
                className={styles.conversationRow}
                data-active={current?.thread_id === item.thread_id}
              >
                <button
                  type="button"
                  className={styles.conversation}
                  aria-current={current?.thread_id === item.thread_id ? 'page' : undefined}
                  disabled={busy}
                  onClick={() => void selectConversation(item.thread_id)}
                  title={item.title}
                >
                  {!item.closed && current?.thread_id === item.thread_id && (
                    <span
                      className={styles.newConversationDot}
                      role="img"
                      aria-label={t('Conversa em andamento')}
                    />
                  )}
                  {item.title}
                </button>
                <button
                  type="button"
                  className={styles.deleteConversation}
                  disabled={busy}
                  aria-label={t('Excluir conversa: {title}', { title: item.title })}
                  title={t('Excluir conversa')}
                  onClick={() => {
                    setDeleteError('')
                    setDeleting(item)
                  }}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
