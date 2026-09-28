import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Modal } from '@mantine/core'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { EventForm } from '../../components/EventForm'
import { DemoBadge } from '../../components/DemoBadge'
import { PageHeader } from '../../components/PageHeader'
import {
  listEvents,
  listTechnicians,
  removeEvent,
  saveEvent,
} from '../../services/managementService'
import type { CalendarEvent, Technician } from '../../types/management'
import { formatDate, monthDays, shiftDate } from '../../utils/calendar'
import common from '../management.module.css'
import styles from './Calendar.module.css'

export default function Calendar() {
  const [month, setMonth] = useState('2026-03')
  const [selectedDay, setSelectedDay] = useState('2026-03-11')
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
      setNotice('Evento excluído nesta sessão de demonstração.')
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
    .filter((item) => item.date === selectedDay)
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
          setNotice(
            editing
              ? 'Evento atualizado nesta sessão de demonstração.'
              : 'Evento criado nesta sessão de demonstração.',
          )
          setFormOpen(false)
        }}
      />
    )
  }

  return (
    <div className={common.page}>
      <PageHeader
        title="Calendário"
        action={
          <button
            ref={addButtonRef}
            className={common.primary}
            type="button"
            onClick={() => openForm()}
            disabled={loading || Boolean(loadError)}
          >
            Adicionar evento
          </button>
        }
      />
      <DemoBadge>Dados demonstrativos · alterações nesta sessão</DemoBadge>
      {notice && (
        <p role="status" className={common.status}>
          {notice}
        </p>
      )}
      {error && !formOpen && (
        <p role="alert" className={common.error}>
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando calendário…</p>
      ) : loadError ? (
        <div role="alert" className={common.error}>
          <p>{loadError}</p>
          <button
            className={common.secondary}
            type="button"
            onClick={() => {
              setLoadError('')
              setLoading(true)
              setLoadAttempt((current) => current + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className={styles.calendarLayout}>
          <section
            className={`${common.panel} ${styles.calendarPanel}`}
            aria-label="Calendário mensal"
          >
            <div className={styles.monthHeader}>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
                <ChevronLeft size={19} />
              </button>
              <h2 aria-live="polite">
                {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}
              </h2>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês">
                <ChevronRight size={19} />
              </button>
            </div>
            <div ref={calendarRef} className={styles.calendarGrid} aria-label="Dias do mês">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <span className={styles.weekday} key={day}>
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
                  aria-label={`${formatDate(date, { dateStyle: 'full' })}${events.some((item) => item.date === date) ? ', com evento' : ''}`}
                  aria-pressed={date === selectedDay}
                  onClick={() => {
                    setSelectedDay(date)
                    if (date.slice(0, 7) !== month) setMonth(date.slice(0, 7))
                  }}
                >
                  <span className={styles.dayNumber}>
                    {Number(date.slice(-2))}
                    {events.some((item) => item.date === date) && <i aria-hidden="true" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className={styles.eventsPanel} aria-labelledby="day-events">
            <h2 id="day-events">
              Eventos do dia · {formatDate(selectedDay, { dateStyle: 'long' })}
            </h2>
            {selectedEvents.length ? (
              <div className={styles.eventList}>
                {selectedEvents.map((item) => (
                  <article className={styles.event} key={item.id}>
                    <div className={styles.eventDate} aria-hidden="true">
                      <strong>{Number(item.date.slice(-2))}</strong>
                      <span>{formatDate(item.date, { weekday: 'short' }).replace('.', '')}</span>
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <time dateTime={`${item.date}T${item.time}`}>
                        {item.time}–{item.endTime}
                      </time>
                      <details className={styles.details}>
                        <summary>Ver detalhes</summary>
                        {item.location && <p>Local: {item.location}</p>}
                        <p>{item.description || 'Sem descrição.'}</p>
                        {item.observation && <p>Observação: {item.observation}</p>}
                        <p className={common.muted}>
                          Técnico:{' '}
                          {technicians.find((tech) => tech.id === item.technicianId)?.name ??
                            'Não atribuído'}
                        </p>
                      </details>
                    </div>
                    <div className={common.actions}>
                      <button
                        className={styles.iconButton}
                        aria-label={`Editar evento ${item.title}`}
                        type="button"
                        onClick={() => openForm(item)}
                      >
                        <Pencil size={24} aria-hidden="true" />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.delete}`}
                        aria-label={`Excluir evento ${item.title}`}
                        type="button"
                        onClick={() => setDeleting(item)}
                      >
                        <Trash2 size={24} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={common.empty}>Nenhum evento neste dia.</p>
            )}
          </section>
        </div>
      )}
      <Modal
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir evento?"
        closeButtonProps={{ 'aria-label': 'Fechar confirmação de exclusão do evento' }}
        centered
      >
        <p>Excluir {deleting?.title} desta sessão de demonstração?</p>
        <div className={common.formActions}>
          <button className={common.secondary} type="button" onClick={() => setDeleting(null)}>
            Cancelar
          </button>
          <button className={common.danger} type="button" onClick={confirmDelete} disabled={busy}>
            {busy ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
