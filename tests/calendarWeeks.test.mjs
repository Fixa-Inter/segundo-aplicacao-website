import assert from 'node:assert/strict'
import test from 'node:test'
import { monthWeeks, occursOnDate, shiftDate, startOfWeek } from '../src/utils/calendar.ts'

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

test('cálculo de semanas também admite início no domingo', () => {
  assert.equal(startOfWeek('2026-10-05', 0), '2026-10-04')
  assert.equal(startOfWeek('2026-10-10', 0), '2026-10-04')
  assert.equal(startOfWeek('2026-10-11', 0), '2026-10-11')
  assert.equal(startOfWeek('2027-01-01', 0), '2026-12-27')
  assert.deepEqual(monthWeeks('2026-03', 0), [
    '2026-03-01',
    '2026-03-08',
    '2026-03-15',
    '2026-03-22',
    '2026-03-29',
  ])
  const leapDays = monthWeeks('2024-02', 0).flatMap((start) =>
    Array.from({ length: 7 }, (_, offset) => shiftDate(start, offset)),
  )
  assert.equal(leapDays.filter((date) => date.startsWith('2024-02')).length, 29)
  assert.equal(new Set(leapDays).size, leapDays.length)
})

test('eventos atravessam dias, meses e anos sem desaparecer no calendário ou incluir datas externas', () => {
  const event = { date: '2026-12-31', endDate: '2027-01-02' }
  assert.equal(occursOnDate(event, '2026-12-30'), false)
  for (const date of ['2026-12-31', '2027-01-01', '2027-01-02'])
    assert.equal(occursOnDate(event, date), true)
  assert.equal(occursOnDate(event, '2027-01-03'), false)
  assert.equal(occursOnDate({ date: '2024-02-28', endDate: '2024-03-01' }, '2024-02-29'), true)
  assert.equal(occursOnDate({ date: '2026-10-25' }, '2026-10-25'), true)
  assert.equal(occursOnDate({ date: '2026-10-25' }, '2026-10-26'), false)
})
