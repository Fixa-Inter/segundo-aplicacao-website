import { Eye } from 'lucide-react'
import { AddRecordButton } from '../../components/AddRecordButton'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EventDetails } from '../../components/EventDetails'
import { EventForm } from '../../components/EventForm'
import { FigmaIcon } from '../../components/FigmaIcon'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { useCalendarPage } from '../../hooks/useCalendarPage'
import { saveEvent } from '../../services/managementService'
import { occursOnDate, shiftDate } from '../../utils/calendar'
import common from '../management.module.css'
import styles from './Calendar.module.css'

export default function Calendar() {
  const {
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
  } = useCalendarPage()
  if (formOpen) {
    return (
      <EventForm
        event={editing}
        selectedDay={selectedDay}
        responsibles={responsibles}
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
          <AddRecordButton
            ref={addButtonRef}
            label={t('Adicionar evento')}
            onClick={() => openForm()}
            disabled={loading || Boolean(loadError)}
          />
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
        <LoadingState label="Carregando calendário…" />
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
            <div
              ref={calendarRef}
              className={styles.calendarGrid}
              role="group"
              aria-label={t('Dias do mês')}
            >
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
