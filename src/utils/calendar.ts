export function shiftDate(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}
export function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(
    new Date(`${isoDate}T12:00:00Z`),
  )
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
