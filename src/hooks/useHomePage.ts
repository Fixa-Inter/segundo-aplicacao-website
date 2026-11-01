import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import { getHomeData } from '../services/homeService'
import type { HomeData } from '../types/home'
import { monthDays, occursOnDate } from '../utils/calendar'

export function useHomePage() {
  const { t, formatDate } = usePreferences()
  const { user } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const daysRef = useRef<HTMLDivElement>(null)
  const [selectedDay, setSelectedDay] = useState(() => new Date().toLocaleDateString('sv-SE'))
  useEffect(() => {
    let active = true
    getHomeData()
      .then((result) => {
        if (!active) return
        setData(result)
        setSelectedDay(result.selectedDay)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os eventos.')
      })
    return () => {
      active = false
    }
  }, [attempt])
  useEffect(() => {
    const rail = daysRef.current
    if (!rail) return

    const centerSelection = () => {
      const selected = rail.querySelector<HTMLButtonElement>("[aria-pressed='true']")
      if (selected)
        rail.scrollTo({ left: selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2 })
    }
    centerSelection()
    const observer = new ResizeObserver(centerSelection)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [selectedDay, data])
  const month = selectedDay.slice(0, 7)
  const days = monthDays(month).filter((date) => date.startsWith(month))
  const events = (data?.events ?? []).filter((event) => occursOnDate(event, selectedDay))

  function changeMonth(offset: number) {
    const date = new Date(`${selectedDay.slice(0, 7)}-01T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    setSelectedDay(date.toISOString().slice(0, 10))
  }
  function moveDay(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = {
      ArrowLeft: Math.max(0, index - 1),
      ArrowRight: Math.min(days.length - 1, index + 1),
      Home: 0,
      End: days.length - 1,
    }[event.key]
    if (nextIndex === undefined) return
    event.preventDefault()
    setSelectedDay(days[nextIndex])
    daysRef.current?.querySelector<HTMLButtonElement>(`[data-date="${days[nextIndex]}"]`)?.focus()
  }

  return {
    t,
    formatDate,
    user,
    data,
    error,
    setError,
    setAttempt,
    daysRef,
    selectedDay,
    setSelectedDay,
    month,
    days,
    events,
    changeMonth,
    moveDay,
  }
}
