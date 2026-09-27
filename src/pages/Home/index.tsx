import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatCard } from '../../components/StatCard'
import { useAuth } from '../../contexts/useAuth'
import banner from '../../assets/figma/home-banner.png'
import { getHomeData } from '../../services/homeService'
import type { HomeData } from '../../types/home'
import { formatDate, shiftDate } from '../../utils/calendar'
import styles from './Home.module.css'

export default function Home() {
  const { user } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [weekStart, setWeekStart] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  useEffect(() => {
    let active = true
    getHomeData()
      .then((result) => {
        if (!active) return
        setData(result)
        setWeekStart(result.weekStart)
        setSelectedDay(result.selectedDay)
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
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError('')
            setAttempt((value) => value + 1)
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }
  if (!data) return <p role="status">Carregando resumo…</p>
  const { taskSummary, monthlyTasks } = data
  const days = Array.from({ length: 5 }, (_, offset) => shiftDate(weekStart, offset))
  const events = data.events.filter((event) => event.date === selectedDay)
  function changeWeek(offset: number) {
    setWeekStart((current) => shiftDate(current, offset))
    setSelectedDay((current) => shiftDate(current, offset))
  }

  return (
    <div className={styles.home}>
      <section className={styles.welcome} aria-labelledby="home-title">
        <h1 id="home-title">Bem-vinda {user?.name ?? 'Rapha'}!</h1>
        <span className={styles.demo}>Dados demonstrativos</span>
        <img src={banner} width="2172" height="724" alt="" />
      </section>
      <section className={styles.stats} aria-label="Resumo de tarefas">
        {taskSummary.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>
      <div className={styles.grid}>
        <section className={styles.chartPanel} aria-labelledby="chart-heading">
          <h2 id="chart-heading">Tarefas registradas</h2>
          <div
            className={styles.chart}
            role="img"
            aria-label={`Tarefas por mês. ${monthlyTasks.map((item) => `${item.month}: ${item.value}`).join('; ')}.`}
          >
            <div className={styles.axis} aria-hidden="true">
              {[40, 30, 20, 10, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className={styles.plot} aria-hidden="true">
              {monthlyTasks.map((item) => (
                <div key={item.month} className={styles.barColumn}>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.bar} ${item.month === 'Mar' ? styles.highlight : ''}`}
                      style={{ height: `${(item.value / 40) * 100}%` }}
                    />
                  </div>
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.eventPanel} aria-label="Calendário resumido">
          <div className={styles.month}>
            <button type="button" onClick={() => changeWeek(-7)} aria-label="Semana anterior">
              <ChevronLeft />
            </button>
            <h2 aria-live="polite">
              {formatDate(selectedDay, { month: 'long', year: 'numeric' }).replace(' de ', ' ')}
            </h2>
            <button type="button" onClick={() => changeWeek(7)} aria-label="Próxima semana">
              <ChevronRight />
            </button>
          </div>
          <div className={styles.days} aria-label="Dias da semana">
            {days.map((date) => (
              <button
                key={date}
                type="button"
                aria-label={formatDate(date, { dateStyle: 'full' })}
                aria-pressed={date === selectedDay}
                onClick={() => setSelectedDay(date)}
              >
                <span>{formatDate(date, { weekday: 'short' }).replace('.', '')}</span>
                <strong>{formatDate(date, { day: 'numeric' })}</strong>
              </button>
            ))}
          </div>
          <h3 id="events-heading">Eventos</h3>
          <div className={styles.events} aria-labelledby="events-heading" aria-live="polite">
            {events.length ? (
              events.map((event) => (
                <article key={event.id} className={styles.event}>
                  <time dateTime={event.date}>
                    {formatDate(event.date, { day: 'numeric' })}
                    <small>{formatDate(event.date, { weekday: 'short' }).replace('.', '')}</small>
                  </time>
                  <div>
                    <h4>{event.title}</h4>
                    <span>{event.time}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className={styles.empty}>Nenhum evento neste dia.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
