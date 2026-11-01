export function occursOnDate(event: { date: string; endDate?: string }, date: string): boolean {
  return event.date <= date && date <= (event.endDate || event.date)
}

export function shiftDate(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}
export function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions,
  language = 'pt-BR',
): string {
  return new Intl.DateTimeFormat(language, { ...options, timeZone: 'UTC' }).format(
    new Date(`${isoDate}T12:00:00Z`),
  )
}

export function startOfWeek(isoDate: string, firstDay: 0 | 1 = 1): string {
  const weekday = new Date(`${isoDate}T12:00:00Z`).getUTCDay()
  return shiftDate(isoDate, -((weekday - firstDay + 7) % 7))
}

export function monthWeeks(isoMonth: string, firstDay: 0 | 1 = 1): string[] {
  const first = `${isoMonth}-01`
  const last = new Date(`${first}T12:00:00Z`)
  last.setUTCMonth(last.getUTCMonth() + 1, 0)
  const lastDate = last.toISOString().slice(0, 10)
  const weeks: string[] = []
  for (let date = startOfWeek(first, firstDay); date <= lastDate; date = shiftDate(date, 7)) {
    weeks.push(date)
  }
  return weeks
}
export function parseDateInput(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

export function monthDays(isoMonth: string): string[] {
  const first = new Date(`${isoMonth}-01T12:00:00Z`)
  const offset = first.getUTCDay()
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate()
  const start = shiftDate(`${isoMonth}-01`, -offset)
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, index) => shiftDate(start, index))
}
