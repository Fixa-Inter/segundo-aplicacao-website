import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatCard } from '../../components/StatCard'
import { useAuth } from '../../contexts/useAuth'
import banner from '../../assets/figma/home-banner.png'
import { getHomeData } from '../../services/homeService'
import type { HomeData } from '../../types/home'
import { monthWeeks, shiftDate } from '../../utils/calendar'
import { usePreferences } from '../../contexts/usePreferences'
import styles from './Home.module.css'

export default function Home() {
  const { t, formatDate } = usePreferences()
  const { user } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [weekStart, setWeekStart] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [month, setMonth] = useState('')
  useEffect(() => {
    let active = true
    getHomeData()
      .then((result) => {
        if (!active) return
        setData(result)
        setWeekStart(result.weekStart)
        setSelectedDay(result.selectedDay)
        setMonth(result.selectedDay.slice(0, 7))
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o resumo da Home.')
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (error) {
    return (
      <div role="alert">
        <p>{t(error)}</p>
        <button
          type="button"
          onClick={() => {
            setError('')
            setAttempt((value) => value + 1)
          }}
        >
          {t('Tentar novamente')}
        </button>
      </div>
    )
  }
  if (!data) return <p role="status">{t('Carregando resumo…')}</p>
  const { taskSummary, monthlyTasks } = data
  const days = Array.from({ length: 7 }, (_, offset) => shiftDate(weekStart, offset))
  const weeks = monthWeeks(month)
  const months = Array.from({ length: 36 }, (_, index) =>
    new Date(Date.UTC(Number(month.slice(0, 4)) - 1, index, 1)).toISOString().slice(0, 7),
  )
  const events = data.events.filter((event) => event.date === selectedDay)
  function changeWeek(offset: number) {
    const next = shiftDate(weekStart, offset)
    setWeekStart(next)
    setSelectedDay(shiftDate(selectedDay, offset))
    setMonth(shiftDate(next, 3).slice(0, 7))
  }
  function selectWeek(start: string) {
    const offset = days.indexOf(selectedDay)
    setWeekStart(start)
    setSelectedDay(shiftDate(start, Math.max(0, offset)))
  }
  function selectMonth(next: string) {
    if (!/^\d{4}-\d{2}$/.test(next)) return
    setMonth(next)
    const firstWeek = monthWeeks(next)[0]
    setWeekStart(firstWeek)
    setSelectedDay(`${next}-01`)
  }

  return (
    <div className={styles.home}>
      <section className={styles.welcome} aria-labelledby="home-title">
        <h1 id="home-title">{t('Bem-vinda {name}!', { name: user?.name ?? 'Rapha' })}</h1>
        <img src={banner} width="2172" height="724" alt="" />
      </section>
      <section className={styles.stats} aria-label={t('Resumo de tarefas')}>
        {taskSummary.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>
      <div className={styles.grid}>
        <section className={styles.chartPanel} aria-labelledby="chart-heading">
          <h2 id="chart-heading">{t('Tarefas registradas')}</h2>
          <div
            className={styles.chart}
            role="img"
            aria-label={t('Tarefas por mês. {name}.', {
              name: monthlyTasks.map((item) => `${t(item.month)}: ${item.value}`).join('; '),
            })}
          >
            <div className={styles.axis} aria-hidden="true">
              {[40, 30, 20, 10, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className={styles.plot} aria-hidden="true">
              {monthlyTasks.map((item) => (
                <div key={t(item.month)} className={styles.barColumn}>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.bar} ${item.month === 'Mar' ? styles.highlight : ''}`}
                      style={{ height: `${(item.value / 40) * 100}%` }}
                    />
                  </div>
                  <span>{t(item.month)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.eventPanel} aria-label={t('Calendário resumido')}>
          <div className={styles.month}>
            <button type="button" onClick={() => changeWeek(-7)} aria-label={t('Semana anterior')}>
              <ChevronLeft />
            </button>
            <select
              aria-label={t('Mês do calendário resumido')}
              value={month}
              onChange={(event) => selectMonth(event.target.value)}
            >
              {months.map((value) => (
                <option key={value} value={value}>
                  {formatDate(`${value}-01`, { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => changeWeek(7)} aria-label={t('Próxima semana')}>
              <ChevronRight />
            </button>
          </div>
          <label className={styles.weekPicker}>
            <span>{t('Semana')}</span>
            <select
              aria-label={t('Semana do mês')}
              value={weekStart}
              onChange={(event) => selectWeek(event.target.value)}
            >
              {weeks.map((start, index) => (
                <option key={start} value={start}>
                  {t('Semana {number}', { number: index + 1 })} ·{' '}
                  {formatDate(start, { day: 'numeric', month: 'numeric' })}–
                  {formatDate(shiftDate(start, 6), { day: 'numeric', month: 'numeric' })}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.days} aria-label={t('Dias da semana')}>
            {days.map((date) => (
              <button
                key={date}
                type="button"
                aria-label={formatDate(date, { dateStyle: 'full' })}
                aria-pressed={date === selectedDay}
                onClick={() => setSelectedDay(date)}
              >
                <span>{formatDate(date, { weekday: 'short' }).replace('.', '')}</span>
                <strong>{Number(date.slice(-2))}</strong>
              </button>
            ))}
          </div>
          <h3 id="events-heading">{t('Eventos')}</h3>
          <div className={styles.events} aria-labelledby="events-heading" aria-live="polite">
            {events.length ? (
              events.map((event) => (
                <article key={event.id} className={styles.event}>
                  <time dateTime={event.date}>
                    {Number(event.date.slice(-2))}
                    <small>{formatDate(event.date, { weekday: 'short' }).replace('.', '')}</small>
                  </time>
                  <div>
                    <h4>{event.title}</h4>
                    <span>{event.time}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className={styles.empty}>{t('Nenhum evento neste dia.')}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
