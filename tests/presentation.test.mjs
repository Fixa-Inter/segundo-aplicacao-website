import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatShiftTime,
  formatShiftLabel,
  formatAddress,
  truncateText,
} from '../src/utils/presentation.ts'
test('turnos convertem segundos desde meia-noite em horários legíveis', () => {
  for (const [value, expected] of [
    [0, '00:00'],
    [28800, '08:00'],
    [43200, '12:00'],
    [46800, '13:00'],
    [64800, '18:00'],
    [86400, '24:00'],
    [28830, '08:00:30'],
  ])
    assert.equal(formatShiftTime(value), expected)
  for (const value of [-1, 86401, NaN, Infinity, 1.5]) assert.equal(formatShiftTime(value), '')
  assert.equal(
    formatShiftLabel({ nome: 'Manhã', horaInicio: 28800, horaFim: 43200 }),
    'Manhã · 08:00 – 12:00',
  )
  assert.equal(
    formatShiftLabel({ nome: 'Noturno', horaInicio: 79200, horaFim: 21600 }),
    'Noturno · 22:00 – 06:00',
  )
})
test('endereço vazio não produz separadores ou CEP fictício e campos parciais são legíveis', () => {
  assert.equal(formatAddress({}), '')
  assert.equal(formatAddress({ address: ' ', postalCode: '' }), '')
  assert.equal(formatAddress({ city: 'São Paulo', state: 'SP' }), 'São Paulo / SP')
  assert.equal(
    formatAddress({
      address: 'Rua Exemplo',
      number: '12',
      postalCode: '01234567',
      complement: 'Sala 2',
    }),
    'Rua Exemplo, 12 · 01234-567 · Sala 2',
  )
})
test('nomes longos ficam limitados sem alterar o valor original ou cortar caracteres Unicode', () => {
  const full = 'Otávia Cardoso Silva Dos Santos Pinto Silva Cardoso Feliz'
  assert.equal(truncateText(full).length, 36)
  assert.ok(truncateText(full).endsWith('...'))
  assert.equal(full, 'Otávia Cardoso Silva Dos Santos Pinto Silva Cardoso Feliz')
  assert.equal(truncateText('  Ana   Costa  '), 'Ana Costa')
  assert.equal(truncateText('😀😀😀😀😀😀', 5), '😀😀...')
})
