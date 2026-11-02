import { manuEmotionImage } from '../../assets/manuEmotions'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { LoadingState } from '../../components/LoadingState'
import styles from '../../components/Manu/Manu.module.css'
import { ManuComposer } from '../../components/Manu/ManuComposer'
import { ManuHistoryPanel } from '../../components/Manu/ManuHistoryPanel'
import { ManuMessages } from '../../components/Manu/ManuMessages'
import { useManuChat } from '../../hooks/useManuChat'

export default function Manu() {
  const chat = useManuChat()
  const {
    t,
    user,
    current,
    messages,
    loadingConversation,
    removing,
    deleting,
    setDeleting,
    deleteError,
    setDeleteError,
    error,
    busyRef,
    deleteConversation,
    configured,
  } = chat
  return (
    <div className={`${styles.page} ${messages.length ? styles.withMessages : ''}`}>
      <ManuHistoryPanel chat={chat} />
      <section className={styles.chat} aria-label={t('Manu')}>
        {loadingConversation && <LoadingState compact label="Carregando conversa…" />}
        {!messages.length ? (
          <div className={styles.greeting}>
            <img src={manuEmotionImage('EMPATICO')} alt={t('Manu')} width="72" height="72" />
            <h2>
              {t('Olá {name}, como posso te ajudar hoje?', {
                name: user?.name.split(' ')[0] ?? '',
              })}
            </h2>
          </div>
        ) : (
          <div className={styles.chatHeading}>
            <h2>{current?.title ?? t('Nova conversa')}</h2>
            {current?.closed && (
              <span className={styles.closedChat}>{t('Conversa salva no histórico')}</span>
            )}
          </div>
        )}
        <ManuMessages chat={chat} />
        {error && (
          <p className={styles.chatError} role="alert">
            {t(error)}
          </p>
        )}
        {!configured && (
          <p className={styles.chatError} role="status">
            {t('O serviço da Manu ainda não foi configurado.')}
          </p>
        )}
        <ManuComposer chat={chat} />
      </section>
      <ConfirmDialog
        opened={Boolean(deleting)}
        variant="deleteConversation"
        subject={deleting?.title}
        confirmLabel="Excluir"
        busy={removing}
        error={deleteError}
        onClose={() => {
          if (!busyRef.current) {
            setDeleting(null)
            setDeleteError('')
          }
        }}
        onConfirm={() => void deleteConversation()}
      />
    </div>
  )
}
