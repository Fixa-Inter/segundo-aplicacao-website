import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { FigmaIcon } from '../../components/FigmaIcon'
import { useAuth } from '../../contexts/useAuth'
import banner from '../../assets/figma/home-banner.png'
import { getHomeData } from '../../services/homeService'
import type { HomeData } from '../../types/home'
import { monthDays, occursOnDate } from '../../utils/calendar'
import { usePreferences } from '../../contexts/usePreferences'
import { truncateText } from '../../utils/presentation'
import { dashboardWidgetURL } from '../../utils/dashboardEmbed'
import styles from './Home.module.css'

export default function Home() {
  const { t, formatDate } = usePreferences()
  const { user } = useAuth()
  const dashboardUrl = dashboardWidgetURL(
    import.meta.env.VITE_DATABRICKS_DASHBOARD_URL,
    import.meta.env.VITE_DATABRICKS_HOME_WIDGET,
  )
  const [frameLoaded, setFrameLoaded] = useState(false)
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
    // Move somente a faixa de dias; o restante da página permanece na mesma posição.
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
  return (
    <div className={styles.home}>
      <section className={styles.welcome} aria-labelledby="home-title">
        <h1 id="home-title" title={user?.name}>
          {t('Bem-vinda {name}!', { name: truncateText(user?.name ?? '', 32) })}
        </h1>
        <img src={banner} width="2172" height="724" alt="" />
      </section>
      <div className={styles.grid}>
        <section className={styles.chartPanel} aria-labelledby="chart-heading">
          <div className={styles.chartHeading}>
            <h2 id="chart-heading">{t('Visão geral')}</h2>
            <Link
              to="/dashboard"
              aria-label={t('Ver dashboard completo')}
              title={t('Ver dashboard completo')}
            >
              <FigmaIcon name="arrow-up-right" />
            </Link>
          </div>
          {dashboardUrl ? (
            <>
              {!frameLoaded && (
                <p className={styles.frameStatus} role="status">
                  {t('Carregando dashboard…')}
                </p>
              )}
              <iframe
                className={styles.chartFrame}
                src={dashboardUrl}
                title={t('Resumo de manutenção')}
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => setFrameLoaded(true)}
              />
            </>
          ) : (
            <p className={styles.calendarState}>{t('O dashboard ainda não está disponível.')}</p>
          )}
        </section>
        <section className={styles.eventPanel} aria-label={t('Calendário resumido')}>
          {error ? (
            <div role="alert" className={styles.calendarState}>
              <p>{t(error)}</p>
              <button
                className={styles.retry}
                type="button"
                onClick={() => {
                  setError('')
                  setAttempt((value) => value + 1)
                }}
              >
                {t('Tentar novamente')}
              </button>
            </div>
          ) : !data ? (
            <p role="status" className={styles.calendarState}>
              {t('Carregando eventos…')}
            </p>
          ) : (
            <>
              <div className={styles.monthHeader}>
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label={t('Mês anterior')}
                >
                  <FigmaIcon name="chevron-left" />
                </button>
                <h2 aria-live="polite">
                  {formatDate(selectedDay, { month: 'long', year: 'numeric' }).replace(' de ', ' ')}
                </h2>
                <button type="button" onClick={() => changeMonth(1)} aria-label={t('Próximo mês')}>
                  <FigmaIcon name="chevron-right" />
                </button>
              </div>
              <div ref={daysRef} className={styles.days} role="group" aria-label={t('Dias do mês')}>
                {days.map((date, index) => (
                  <button
                    key={date}
                    type="button"
                    aria-label={
                      formatDate(date, { weekday: 'short' }).replace('.', '') +
                      ' ' +
                      Number(date.slice(-2)) +
                      ', ' +
                      formatDate(date, { dateStyle: 'full' })
                    }
                    aria-pressed={date === selectedDay}
                    data-date={date}
                    onKeyDown={(event) => moveDay(event, index)}
                    onClick={() => setSelectedDay(date)}
                  >
                    <span>{formatDate(date, { weekday: 'short' }).replace('.', '')} </span>
                    <strong>{Number(date.slice(-2))}</strong>
                  </button>
                ))}
              </div>
              <h3 id="events-heading">{t('Eventos')}</h3>
              <div
                className={styles.events}
                role="region"
                aria-labelledby="events-heading"
                aria-live="polite"
              >
                {events.length ? (
                  events.map((event) => (
                    <article key={event.id} className={styles.event}>
                      <time dateTime={selectedDay}>
                        {Number(selectedDay.slice(-2))}
                        <small>
                          {formatDate(selectedDay, { weekday: 'short' }).replace('.', '')}
                        </small>
                      </time>
                      <div>
                        <h4>{event.title}</h4>
                        <span>{event.time}</span>
                      </div>
                      <Link
                        className={styles.eventLink}
                        to="/calendario"
                        state={{ date: selectedDay }}
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
            </>
          )}
        </section>
      </div>
    </div>
  )
}
