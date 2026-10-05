import assert from 'node:assert/strict'
import test from 'node:test'
import { monthWeeks, shiftDate, startOfWeek } from '../src/utils/calendar.ts'

test('semana inclui sábado e domingo, inclusive nas viradas de mês e ano', () => {
  assert.equal(startOfWeek('2026-03-14'), '2026-03-09')
  assert.equal(startOfWeek('2026-03-15'), '2026-03-09')
  assert.equal(startOfWeek('2026-03-16'), '2026-03-16')
  assert.equal(startOfWeek('2026-01-01'), '2025-12-29')
  assert.equal(shiftDate('2026-03-09', 6), '2026-03-15')
  assert.equal(shiftDate('2025-12-29', 7), '2026-01-05')
})

test('seletor de semanas cobre todos os dias de meses curtos, longos e bissextos', () => {
  for (const month of ['2026-02', '2026-03', '2024-02', '2026-12']) {
    const weeks = monthWeeks(month)
    const dates = weeks.flatMap((start) =>
      Array.from({ length: 7 }, (_, offset) => shiftDate(start, offset)),
    )
    const last = new Date(`${month}-01T12:00:00Z`)
    last.setUTCMonth(last.getUTCMonth() + 1, 0)
    const count = last.getUTCDate()
    assert.equal(new Set(dates).size, dates.length)
    assert.equal(dates.filter((date) => date.startsWith(month)).length, count)
    assert.equal(
      weeks.every((date) => new Date(`${date}T12:00:00Z`).getUTCDay() === 1),
      true,
    )
  }
  assert.equal(monthWeeks('2026-03').length, 6)
})
