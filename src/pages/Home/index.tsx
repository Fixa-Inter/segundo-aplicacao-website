import { Link } from 'react-router-dom'
import banner from '../../assets/figma/home-banner.png'
import { AuthenticatedDashboard } from '../../components/AuthenticatedDashboard'
import { FigmaIcon } from '../../components/FigmaIcon'
import { LoadingState } from '../../components/LoadingState'
import { useHomePage } from '../../hooks/useHomePage'
import { truncateText } from '../../utils/presentation'
import styles from './Home.module.css'

export default function Home() {
  const {
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
    days,
    events,
    changeMonth,
    moveDay,
  } = useHomePage()
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
          <AuthenticatedDashboard
            title={t('Resumo de manutenção')}
            widget={import.meta.env.VITE_DATABRICKS_HOME_WIDGET}
          />
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
            <LoadingState label="Carregando eventos…" />
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
                tabIndex={0}
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
