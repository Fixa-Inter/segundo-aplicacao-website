import { Modal } from '@mantine/core'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import type { EventDetailsProps } from '../../types/ui'
import { FigmaIcon } from '../FigmaIcon'
import styles from './EventDetails.module.css'

export function EventDetails({ event, onClose }: EventDetailsProps) {
  const { t, formatDate } = usePreferences()
  return (
    <Modal.Root
      opened={Boolean(event)}
      onClose={onClose}
      centered
      size={760}
      radius={28}
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
              <header className={styles.heading}>
                <h2>{t('Informações sobre o evento')}</h2>
                <h3>{event.title}</h3>
              </header>
              <dl className={styles.schedule}>
                <div>
                  <dt>
                    <MapPin size={18} aria-hidden="true" />
                    {t('Local')}
                  </dt>
                  <dd>{event.location || t('Não informado')}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays size={18} aria-hidden="true" />
                    {t('Data')}
                  </dt>
                  <dd>
                    {formatDate(event.date, { dateStyle: 'short' })}
                    {event.endDate && event.endDate !== event.date
                      ? ` – ${formatDate(event.endDate, { dateStyle: 'short' })}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Clock3 size={18} aria-hidden="true" />
                    {t('Horário')}
                  </dt>
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
                {event.observation.trim() && (
                  <div>
                    <dt>{t('Observação')}</dt>
                    <dd>{event.observation}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
