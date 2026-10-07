import { useEffect, useState } from 'react'
import { StatCard } from '../../components/StatCard'
import { Link } from 'react-router-dom'
import { FigmaIcon } from '../../components/FigmaIcon'
import { useAuth } from '../../contexts/useAuth'
import banner from '../../assets/figma/home-banner.png'
import { getHomeData } from '../../services/homeService'
import type { HomeData } from '../../types/home'
import { shiftDate, startOfWeek } from '../../utils/calendar'
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
  useEffect(() => {
    let active = true
    getHomeData()
      .then((result) => {
        if (!active) return
        setData(result)
        setWeekStart(startOfWeek(result.selectedDay, 1))
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
  const events = data.events.filter((event) => event.date === selectedDay)

  function changeMonth(offset: number) {
    const date = new Date(`${selectedDay.slice(0, 7)}-01T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    const firstDay = date.toISOString().slice(0, 10)
    const monday = startOfWeek(firstDay, 1)
    const next = monday < firstDay ? shiftDate(monday, 7) : monday
    setSelectedDay(next)
    setWeekStart(next)
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
          <div className={styles.chartHeading}>
            <h2 id="chart-heading">{t('Tarefas registradas')}</h2>
            <Link to="/dashboard" aria-label={t('Abrir Dashboard')}>
              <FigmaIcon name="arrow-up-right" />
            </Link>
          </div>
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
          <div className={styles.monthHeader}>
            <button type="button" onClick={() => changeMonth(-1)} aria-label={t('Mês anterior')}>
              <FigmaIcon name="chevron-left" />
            </button>
            <h2 aria-live="polite">
              {formatDate(selectedDay, { month: 'long', year: 'numeric' }).replace(' de ', ' ')}
            </h2>
            <button type="button" onClick={() => changeMonth(1)} aria-label={t('Próximo mês')}>
              <FigmaIcon name="chevron-right" />
            </button>
          </div>
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
                  <Link
                    className={styles.eventLink}
                    to="/calendario"
                    state={{ date: event.date }}
                    aria-label={t('Ver evento {name}', { name: event.title })}
                  >
                    <FigmaIcon name="more" />
                  </Link>
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
