import { Modal } from '@mantine/core'
import { usePreferences } from '../../contexts/usePreferences'
import { FigmaIcon } from '../FigmaIcon'
import type { EventDetailsProps } from '../../types/ui'
import styles from './EventDetails.module.css'

export function EventDetails({ event, onClose }: EventDetailsProps) {
  const { t, formatDate } = usePreferences()
  return (
    <Modal.Root
      opened={Boolean(event)}
      onClose={onClose}
      centered
      size={900}
      radius={25}
      padding={0}
    >
      <Modal.Overlay backgroundOpacity={0.35} />
      <Modal.Content
        classNames={{ content: styles.content }}
        aria-label={t('Informações sobre o evento')}
      >
        <Modal.Body>
          {event && (
            <div className={styles.body}>
              <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label={t('Fechar informações do evento')}
              >
                <FigmaIcon name="close" />
              </button>
              <h2>{t('Informações sobre o evento')}</h2>
              <h3>{event.title}</h3>
              <dl className={styles.schedule}>
                <div>
                  <dt>{t('Local')}</dt>
                  <dd>{event.location || t('Não informado')}</dd>
                </div>
                <div>
                  <dt>{t('Data')}</dt>
                  <dd>{formatDate(event.date, { dateStyle: 'short' })}</dd>
                </div>
                <div>
                  <dt>{t('Horário')}</dt>
                  <dd>
                    {event.time}–{event.endTime}
                  </dd>
                </div>
              </dl>
              <dl className={styles.description}>
                <div>
                  <dt>{t('Descrição')}</dt>
                  <dd>{event.description || t('Sem descrição.')}</dd>
                </div>
                <div>
                  <dt>{t('Observação')}</dt>
                  <dd>{event.observation || t('Não informado')}</dd>
                </div>
              </dl>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
