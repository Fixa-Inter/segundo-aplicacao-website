import type { Address } from '../types/management'

export function truncateText(value: string, maxLength = 36): string {
  const text = value.trim().replace(/\s+/g, ' ')
  const characters = Array.from(text)
  return characters.length > maxLength
    ? characters
        .slice(0, Math.max(0, maxLength - 3))
        .join('')
        .trimEnd() + '...'
    : text
}

export function formatShiftTime(seconds: number): string {
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  const time = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0')
  return remainder ? time + ':' + String(remainder).padStart(2, '0') : time
}

export function formatShiftLabel(shift: {
  nome: string
  horaInicio: number
  horaFim: number
}): string {
  const start = formatShiftTime(shift.horaInicio)
  const end = formatShiftTime(shift.horaFim)
  return [shift.nome, start && end ? start + ' – ' + end : ''].filter(Boolean).join(' · ')
}

export function formatAddress(value: Partial<Address>): string {
  const clean = (text?: string) => text?.trim() ?? ''
  const street = [clean(value.address), clean(value.number)].filter(Boolean).join(', ')
  const city = [clean(value.city), clean(value.state)].filter(Boolean).join(' / ')
  const postal = clean(value.postalCode).replace(/^(\d{5})(\d{3})$/, '$1-$2')
  return [street, clean(value.district), city, postal, clean(value.complement)]
    .filter(Boolean)
    .join(' · ')
}
