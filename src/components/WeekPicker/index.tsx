import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Popover } from '@mantine/core'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { monthWeeks, shiftDate, startOfWeek } from '../../utils/calendar'
import type { WeekPickerProps } from '../../types/ui'
import styles from './WeekPicker.module.css'

export function WeekPicker({ value, onChange }: WeekPickerProps) {
  const { t, formatDate } = usePreferences()
  const [opened, setOpened] = useState(false)
  const [month, setMonth] = useState(value.slice(0, 7))
  const [focusedDay, setFocusedDay] = useState(value)
  const calendarRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const selectedWeek = startOfWeek(value)
  const weeks = monthWeeks(month)
  const months = Array.from({ length: 36 }, (_, index) =>
    new Date(Date.UTC(Number(month.slice(0, 4)) - 1, index, 1)).toISOString().slice(0, 7),
  )

  function openCalendar() {
    if (!opened) {
      setMonth(value.slice(0, 7))
      setFocusedDay(value)
    }
    setOpened(!opened)
  }

  function selectMonth(next: string) {
    setMonth(next)
    setFocusedDay(`${next}-01`)
  }

  function changeMonth(offset: number) {
    const date = new Date(`${month}-01T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + offset)
    selectMonth(date.toISOString().slice(0, 7))
  }

  function moveDay(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
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
    setFocusedDay(next)
    setMonth(next.slice(0, 7))
    requestAnimationFrame(() =>
      calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
    )
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width={340}
      offset={8}
      trapFocus
      returnFocus
      withinPortal
      classNames={{ dropdown: styles.dropdown }}
    >
      <Popover.Target>
        <button type="button" className={styles.trigger} onClick={openCalendar}>
          <span className={styles.label}>{t('Seletor semanal')}</span>
          <CalendarDays size={22} aria-hidden="true" />
          <span className={styles.value}>
            {t('Semana de {date}', {
              date: formatDate(selectedWeek, { day: '2-digit', month: 'long' }),
            })}
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </Popover.Target>
      <Popover.Dropdown aria-label={t('Selecionar semana')}>
        <div className={styles.header}>
          <select
            aria-label={t('Mês do calendário resumido')}
            value={month}
            onChange={(event) => selectMonth(event.target.value)}
          >
            {months.map((date) => (
              <option key={date} value={date}>
                {formatDate(`${date}-01`, { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => changeMonth(-1)} aria-label={t('Mês anterior')}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label={t('Próximo mês')}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.weekdays} aria-hidden="true">
          {Array.from({ length: 7 }, (_, offset) => (
            <span key={offset}>
              {formatDate(shiftDate('2026-03-09', offset), { weekday: 'short' }).replace('.', '')}
            </span>
          ))}
        </div>
        <div ref={calendarRef} aria-labelledby={labelId}>
          <span id={labelId} className={styles.srOnly}>
            {t('Escolha um dia para mostrar sua semana.')}
          </span>
          {weeks.map((start) => (
            <div
              key={start}
              className={`${styles.week} ${start === selectedWeek ? styles.selectedWeek : ''}`}
            >
              {Array.from({ length: 7 }, (_, offset) => {
                const date = shiftDate(start, offset)
                return (
                  <button
                    key={date}
                    type="button"
                    data-date={date}
                    data-autofocus={date === focusedDay || undefined}
                    tabIndex={date === focusedDay ? 0 : -1}
                    className={date.slice(0, 7) !== month ? styles.outside : undefined}
                    aria-label={`${formatDate(date, { dateStyle: 'full' })}${start === selectedWeek ? t(', semana selecionada') : ''}`}
                    aria-pressed={date === value}
                    onKeyDown={(event) => moveDay(event, date)}
                    onClick={() => {
                      onChange(date)
                      setOpened(false)
                    }}
                  >
                    {Number(date.slice(-2))}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Popover.Dropdown>
    </Popover>
  )
}
