import { lazy, Suspense } from 'react'
import { manuEmotionImage } from '../../../assets/manuEmotions'
import type { ManuViewProps } from '../../../types/manuComponents'
import { LoadingState } from '../../LoadingState'
import { ManuThinking } from '../../ManuThinking'
import styles from '../Manu.module.css'
import { ManuProposal } from '../ManuProposal'

const ManuChart = lazy(() =>
  import('../../ManuChart').then((module) => ({ default: module.ManuChart })),
)
export function ManuMessages({ chat }: ManuViewProps) {
  const { t, messages, sending, loadingConversation, end, pendingConfirmation, lastReply } = chat
  return (
    <>
      {(messages.length > 0 || sending) && (
        <div
          className={styles.messages}
          role="log"
          aria-label={t('Mensagens da conversa')}
          aria-live="polite"
          aria-busy={loadingConversation}
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
                {message.visualization && (
                  <Suspense fallback={<LoadingState compact label="Carregando gráfico…" />}>
                    <ManuChart visualization={message.visualization} />
                  </Suspense>
                )}
                {message.visualizationError && (
                  <p role="status">{t('Não foi possível exibir o gráfico desta mensagem.')}</p>
                )}
                {!!message.images.length && (
                  <div className={styles.sentImages}>
                    {[...new Set(message.images)].map((url, index) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
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
                  <ManuProposal chat={chat} />
                )}
              </article>
            </div>
          ))}
          {sending && <ManuThinking />}
          <div ref={end} />
        </div>
      )}
    </>
  )
}
