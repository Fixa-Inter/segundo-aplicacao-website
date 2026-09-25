import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@mantine/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  listEvents,
  listTechnicians,
  removeEvent,
  saveEvent,
} from '../../services/managementService'
import type { CalendarEvent, CalendarEventInput, Technician } from '../../types/management'
import { formatDate, shiftDate } from '../../utils/calendar'
import { validateEvent } from '../../utils/managementValidation'
import common from '../management.module.css'
import styles from './Calendar.module.css'

function monthDays(isoMonth: string): string[] {
  const first = new Date(`${isoMonth}-01T12:00:00Z`)
  const offset = first.getUTCDay()
  const start = shiftDate(`${isoMonth}-01`, -offset)
  return Array.from({ length: 42 }, (_, index) => shiftDate(start, index))
}

const emptyEvent: CalendarEventInput = {
  title: '',
  date: '2026-03-11',
  time: '09:00',
  endTime: '10:00',
  location: '',
  description: '',
  observation: '',
  technicianId: '',
}

export default function Calendar() {
  const [month, setMonth] = useState('2026-03')
  const [selectedDay, setSelectedDay] = useState('2026-03-11')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState<CalendarEventInput>(emptyEvent)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CalendarEventInput, string>>>(
    {},
  )

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
        if (active) setError('Não foi possível carregar o calendário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function changeMonth(offset: number) {
    const date = new Date(`${month}-01T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    const next = date.toISOString().slice(0, 7)
    setMonth(next)
    setSelectedDay(`${next}-01`)
  }
  function openForm(item?: CalendarEvent) {
    setEditing(item ?? null)
    setForm(
      item
        ? {
            title: item.title,
            date: item.date,
            time: item.time,
            endTime: item.endTime,
            location: item.location,
            description: item.description,
            observation: item.observation,
            technicianId: item.technicianId,
          }
        : { ...emptyEvent, date: selectedDay },
    )
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }
  function update<K extends keyof CalendarEventInput>(key: K, value: CalendarEventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateEvent(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError('')
    try {
      await saveEvent(
        {
          ...form,
          title: form.title.trim(),
          location: form.location.trim(),
          description: form.description.trim(),
          observation: form.observation.trim(),
        },
        editing?.id,
      )
      setEvents(await listEvents())
      setSelectedDay(form.date)
      setMonth(form.date.slice(0, 7))
      setNotice(
        editing
          ? 'Evento atualizado nesta sessão de demonstração.'
          : 'Evento criado nesta sessão de demonstração.',
      )
      setFormOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o evento.')
    } finally {
      setBusy(false)
    }
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

  return (
    <div className={common.page}>
      <div className={common.heading}>
        <div>
          <h1>Calendário</h1>
          <p>Planeje os eventos da equipe.</p>
        </div>
        <button className={common.primary} type="button" onClick={() => openForm()}>
          Adicionar evento
        </button>
      </div>
      <span className={common.demo}>Dados demonstrativos · alterações até recarregar</span>
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
            <div className={styles.calendarGrid}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <span className={styles.weekday} key={day}>
                  {day}
                </span>
              ))}
              {dates.map((date) => (
                <button
                  type="button"
                  key={date}
                  className={`${styles.day} ${date.slice(0, 7) !== month ? styles.outside : ''}`}
                  aria-label={`${formatDate(date, { dateStyle: 'full' })}${events.some((item) => item.date === date) ? ', com evento' : ''}`}
                  aria-pressed={date === selectedDay}
                  onClick={() => {
                    setSelectedDay(date)
                    if (date.slice(0, 7) !== month) setMonth(date.slice(0, 7))
                  }}
                >
                  <span>{Number(date.slice(-2))}</span>
                  {events.some((item) => item.date === date) && <i aria-hidden="true" />}
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
                    <div>
                      <time dateTime={`${item.date}T${item.time}`}>
                        {item.time}–{item.endTime}
                      </time>
                      <h3>{item.title}</h3>
                      {item.location && <p>Local: {item.location}</p>}
                      <p>{item.description || 'Sem descrição.'}</p>
                      {item.observation && <p>Observação: {item.observation}</p>}
                      <p className={common.muted}>
                        Técnico:{' '}
                        {technicians.find((tech) => tech.id === item.technicianId)?.name ??
                          'Não atribuído'}
                      </p>
                    </div>
                    <div className={common.actions}>
                      <button
                        className={common.secondary}
                        type="button"
                        onClick={() => openForm(item)}
                      >
                        Editar
                      </button>
                      <button
                        className={common.danger}
                        type="button"
                        onClick={() => setDeleting(item)}
                      >
                        Excluir
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
        opened={formOpen}
        onClose={() => {
          if (!busy) setFormOpen(false)
        }}
        title={editing ? 'Editar evento' : 'Adicionar evento'}
        centered
        size="lg"
      >
        <form onSubmit={submit} noValidate aria-busy={busy}>
          <div className={common.formGrid}>
            <label className={`${common.field} ${common.full}`}>
              Título
              <input
                value={form.title}
                maxLength={101}
                aria-invalid={Boolean(fieldErrors.title)}
                onChange={(event) => update('title', event.target.value)}
              />
              {fieldErrors.title && (
                <span role="alert" className={common.error}>
                  {fieldErrors.title}
                </span>
              )}
            </label>
            <label className={common.field}>
              Data
              <input
                type="date"
                value={form.date}
                aria-invalid={Boolean(fieldErrors.date)}
                onChange={(event) => update('date', event.target.value)}
              />
              {fieldErrors.date && (
                <span role="alert" className={common.error}>
                  {fieldErrors.date}
                </span>
              )}
            </label>
            <label className={common.field}>
              Início
              <input
                type="time"
                value={form.time}
                aria-invalid={Boolean(fieldErrors.time)}
                onChange={(event) => update('time', event.target.value)}
              />
              {fieldErrors.time && (
                <span role="alert" className={common.error}>
                  {fieldErrors.time}
                </span>
              )}
            </label>
            <label className={common.field}>
              Término
              <input
                type="time"
                value={form.endTime}
                aria-invalid={Boolean(fieldErrors.endTime)}
                onChange={(event) => update('endTime', event.target.value)}
              />
              {fieldErrors.endTime && (
                <span role="alert" className={common.error}>
                  {fieldErrors.endTime}
                </span>
              )}
            </label>
            <label className={common.field}>
              Local
              <input
                value={form.location}
                maxLength={101}
                aria-invalid={Boolean(fieldErrors.location)}
                onChange={(event) => update('location', event.target.value)}
              />
              {fieldErrors.location && (
                <span role="alert" className={common.error}>
                  {fieldErrors.location}
                </span>
              )}
            </label>
            <label className={`${common.field} ${common.full}`}>
              Técnico
              <select
                value={form.technicianId}
                onChange={(event) => update('technicianId', event.target.value)}
              >
                <option value="">Não atribuído</option>
                {technicians
                  .filter((item) => item.status === 'Ativo' || item.id === form.technicianId)
                  .map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className={`${common.field} ${common.full}`}>
              Descrição
              <textarea
                value={form.description}
                maxLength={301}
                aria-invalid={Boolean(fieldErrors.description)}
                onChange={(event) => update('description', event.target.value)}
              />
              {fieldErrors.description && (
                <span role="alert" className={common.error}>
                  {fieldErrors.description}
                </span>
              )}
            </label>
            <label className={`${common.field} ${common.full}`}>
              Observação
              <textarea
                value={form.observation}
                maxLength={301}
                aria-invalid={Boolean(fieldErrors.observation)}
                onChange={(event) => update('observation', event.target.value)}
              />
              {fieldErrors.observation && (
                <span role="alert" className={common.error}>
                  {fieldErrors.observation}
                </span>
              )}
            </label>
          </div>
          {error && (
            <p role="alert" className={common.error}>
              {error}
            </p>
          )}
          <div className={common.formActions}>
            <button
              className={common.secondary}
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button className={common.primary} type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir evento?"
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
