import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { usePreferences } from '../contexts/usePreferences'
import { listEventResponsibles, listEvents, removeEvent } from '../services/managementService'
import type { CalendarEvent, EventResponsibleOption } from '../types/management'
import { monthDays, occursOnDate, shiftDate } from '../utils/calendar'

export function useCalendarPage() {
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
  const [responsibles, setResponsibles] = useState<EventResponsibleOption[]>([])
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
    Promise.all([listEvents(), listEventResponsibles()])
      .then(([loadedEvents, loadedResponsibles]) => {
        if (active) {
          setEvents(loadedEvents)
          setResponsibles(loadedResponsibles)
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
    if (!deleting || busy) return
    setBusy(true)
    setError('')
    try {
      await removeEvent(deleting.id)
      setEvents((values) => values.filter((item) => item.id !== deleting.id))
      setDeleting(null)
      setNotice('Evento excluído com sucesso.')
      requestAnimationFrame(() =>
        calendarRef.current
          ?.querySelector<HTMLButtonElement>(`[data-date="${selectedDay}"]`)
          ?.focus(),
      )
      try {
        setEvents(await listEvents())
      } catch {
        setError('O evento foi excluído, mas não foi possível atualizar a lista.')
      }
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

  return {
    t,
    formatDate,
    month,
    setMonth,
    selectedDay,
    setSelectedDay,
    details,
    setDetails,
    events,
    setEvents,
    responsibles,
    loading,
    setLoading,
    loadError,
    setLoadError,
    setLoadAttempt,
    busy,
    error,
    notice,
    setNotice,
    formOpen,
    setFormOpen,
    editing,
    deleting,
    setDeleting,
    addButtonRef,
    calendarRef,
    changeMonth,
    openForm,
    moveDay,
    confirmDelete,
    selectedEvents,
    dates,
  }
}
