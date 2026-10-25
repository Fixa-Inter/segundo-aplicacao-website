import { Eye } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { FigmaIcon } from '../../components/FigmaIcon'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EventDetails } from '../../components/EventDetails'
import { EventForm } from '../../components/EventForm'
import { PageHeader } from '../../components/PageHeader'
import {
  listEvents,
  listTechnicians,
  removeEvent,
  saveEvent,
} from '../../services/managementService'
import type { CalendarEvent, Technician } from '../../types/management'
import { monthDays, occursOnDate, shiftDate } from '../../utils/calendar'
import common from '../management.module.css'
import styles from './Calendar.module.css'

export default function Calendar() {
  const { t, formatDate } = usePreferences()

  const { state } = useLocation()
  const linkedDate =
    typeof state?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(state.date)
      ? state.date
      : new Date().toLocaleDateString('sv-SE')
  const [month, setMonth] = useState(linkedDate.slice(0, 7))
  const [selectedDay, setSelectedDay] = useState(linkedDate)
  const [details, setDetails] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const wasFormOpen = useRef(false)

  useEffect(() => {
    if (wasFormOpen.current && !formOpen) addButtonRef.current?.focus()
    wasFormOpen.current = formOpen
  }, [formOpen])

  useEffect(() => {
    let active = true
    Promise.all([listEvents(), listTechnicians()])
      .then(([loadedEvents, loadedTechnicians]) => {
        if (active) {
          setEvents(loadedEvents)
          setTechnicians(loadedTechnicians)
        }
      })
      .catch(() => {
        if (active) setLoadError('Não foi possível carregar o calendário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadAttempt])

  function changeMonth(offset: number) {
    const date = new Date(`${month}-01T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    const next = date.toISOString().slice(0, 7)
    setMonth(next)
    setSelectedDay(`${next}-01`)
  }
  function openForm(item?: CalendarEvent) {
    setEditing(item ?? null)
    setError('')
    setFormOpen(true)
  }
  function moveDay(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    }
    if (!(event.key in offsets)) return
    event.preventDefault()
    const next = shiftDate(date, offsets[event.key])
    setSelectedDay(next)
    setMonth(next.slice(0, 7))
    requestAnimationFrame(() =>
      calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
    )
  }
  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError('')
    try {
      await removeEvent(deleting.id)
      setEvents(await listEvents())
      setDeleting(null)
      setNotice('Evento excluído com sucesso.')
      requestAnimationFrame(() =>
        calendarRef.current
          ?.querySelector<HTMLButtonElement>(`[data-date="${selectedDay}"]`)
          ?.focus(),
      )
    } catch {
      setError('Não foi possível excluir o evento.')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }
  const selectedEvents = events
    .filter((item) => occursOnDate(item, selectedDay))
    .sort((a, b) => a.time.localeCompare(b.time))
  const dates = monthDays(month)

  if (formOpen) {
    return (
      <EventForm
        event={editing}
        selectedDay={selectedDay}
        technicians={technicians}
        onSubmit={(input) => saveEvent(input, editing?.id)}
        onCancel={() => setFormOpen(false)}
        onSaved={(saved) => {
          setEvents((current) =>
            editing
              ? current.map((item) => (item.id === saved.id ? saved : item))
              : [...current, saved],
          )
          setSelectedDay(saved.date)
          setMonth(saved.date.slice(0, 7))
          setNotice(editing ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.')
          setFormOpen(false)
        }}
      />
    )
  }

  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader
        title={t('Calendário')}
        action={
          <button
            ref={addButtonRef}
            className={`${common.primary} ${common.addButton}`}
            type="button"
            onClick={() => openForm()}
            disabled={loading || Boolean(loadError)}
          >
            <FigmaIcon name="plus" />
            {t('Adicionar evento')}
          </button>
        }
      />
      {notice && (
        <p role="status" className={common.status}>
          {t(notice)}
        </p>
      )}
      {error && !formOpen && (
        <p role="alert" className={common.error}>
          {t(error)}
        </p>
      )}
      {loading ? (
        <p role="status">{t('Carregando calendário…')}</p>
      ) : loadError ? (
        <div role="alert" className={common.error}>
          <p>{t(loadError)}</p>
          <button
            className={common.secondary}
            type="button"
            onClick={() => {
              setLoadError('')
              setLoading(true)
              setLoadAttempt((current) => current + 1)
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      ) : (
        <div className={styles.calendarLayout}>
          <section
            className={`${common.panel} ${styles.calendarPanel}`}
            aria-label={t('Calendário mensal')}
          >
            <div className={styles.monthHeader}>
              <button type="button" onClick={() => changeMonth(-1)} aria-label={t('Mês anterior')}>
                <FigmaIcon name="chevron-left" />
              </button>
              <h2 aria-live="polite">
                {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}
              </h2>
              <button type="button" onClick={() => changeMonth(1)} aria-label={t('Próximo mês')}>
                <FigmaIcon name="chevron-right" />
              </button>
            </div>
            <div ref={calendarRef} className={styles.calendarGrid} aria-label={t('Dias do mês')}>
              {Array.from({ length: 7 }, (_, index) =>
                formatDate(shiftDate('2026-03-01', index), { weekday: 'narrow' }),
              ).map((day, index) => (
                <span className={styles.weekday} key={index}>
                  {day}
                </span>
              ))}
              {dates.map((date) => (
                <button
                  type="button"
                  key={date}
                  data-date={date}
                  tabIndex={date === selectedDay ? 0 : -1}
                  onKeyDown={(event) => moveDay(event, date)}
                  className={`${styles.day} ${date.slice(0, 7) !== month ? styles.outside : ''}`}
                  aria-label={`${formatDate(date, { dateStyle: 'full' })}${events.some((item) => occursOnDate(item, date)) ? t(', com evento') : ''}`}
                  aria-pressed={date === selectedDay}
                  onClick={() => {
                    setSelectedDay(date)
                    if (date.slice(0, 7) !== month) setMonth(date.slice(0, 7))
                  }}
                >
                  <span className={styles.dayNumber}>
                    {Number(date.slice(-2))}
                    {events.some((item) => occursOnDate(item, date)) && <i aria-hidden="true" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className={styles.eventsPanel} aria-labelledby="day-events">
            <h2 id="day-events">
              {t('Eventos do dia')}
              <span className={styles.srOnly}>
                {' '}
                · {formatDate(selectedDay, { dateStyle: 'long' })}
              </span>
            </h2>
            {selectedEvents.length ? (
              <div className={styles.eventList}>
                {selectedEvents.map((item) => (
                  <article className={styles.event} key={item.id}>
                    <div className={styles.eventSummary}>
                      <span className={styles.eventDate} aria-hidden="true">
                        <strong>{Number(selectedDay.slice(-2))}</strong>
                        <span>
                          {formatDate(selectedDay, { weekday: 'short' }).replace('.', '')}
                        </span>
                      </span>
                      <span>
                        <span className={styles.eventTitle}>{item.title}</span>
                        <time dateTime={`${item.date}T${item.time}`}>
                          {item.time}–{item.endTime}
                        </time>
                      </span>
                    </div>
                    <div className={common.actions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={t('Ver evento {name}', { name: item.title })}
                        onClick={() => setDetails(item)}
                      >
                        <Eye aria-hidden="true" />
                      </button>
                      <button
                        className={styles.iconButton}
                        aria-label={t('Editar evento {name}', { name: item.title })}
                        type="button"
                        onClick={() => openForm(item)}
                      >
                        <FigmaIcon name="edit" />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.delete}`}
                        aria-label={t('Excluir evento {name}', { name: item.title })}
                        type="button"
                        onClick={() => setDeleting(item)}
                      >
                        <FigmaIcon name="trash" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={common.empty}>{t('Nenhum evento neste dia.')}</p>
            )}
          </section>
        </div>
      )}
      <EventDetails event={details} onClose={() => setDetails(null)} />
      <ConfirmDialog
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        variant="delete"
        subject={deleting?.title}
        confirmLabel="Excluir"
        busy={busy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
