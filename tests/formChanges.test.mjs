import assert from 'node:assert/strict'
import test from 'node:test'
import { hasFormChanges } from '../src/utils/formChanges.ts'

test('restaurar os valores originais limpa a edição, mesmo após mudanças em vários campos', () => {
  const initial = { name: 'Ana Costa', status: 'Ativo', specialty: 'Elétrica' }
  assert.equal(hasFormChanges({ ...initial }, initial), false)
  assert.equal(hasFormChanges({ ...initial, name: 'Ana', status: 'Inativo' }, initial), true)
  assert.equal(hasFormChanges({ ...initial, status: 'Inativo' }, initial), true)
  assert.equal(hasFormChanges({ ...initial }, initial), false)
})

test('datas digitadas ainda inválidas e texto com espaços também são alterações não salvas', () => {
  const initial = { date: '2026-03-11', dateText: '11/03/2026', observation: '' }
  assert.equal(hasFormChanges({ ...initial, dateText: '11/03/' }, initial), true)
  assert.equal(hasFormChanges({ ...initial, observation: ' ' }, initial), true)
  assert.equal(hasFormChanges({ ...initial, dateText: '' }, initial), true)
  assert.equal(hasFormChanges({ ...initial }, initial), false)
})

test('cadastros vazios ficam limpos e uma nova referência salva passa a ser a base da comparação', () => {
  const empty = { name: '', password: '' }
  assert.equal(hasFormChanges({ ...empty }, empty), false)
  assert.equal(hasFormChanges({ ...empty, password: 'fictícia' }, empty), true)
  const saved = { name: 'Nome novo', password: '' }
  assert.equal(hasFormChanges({ ...saved }, saved), false)
  assert.equal(hasFormChanges({ ...saved, name: 'Nome anterior' }, saved), true)
})

test('situação e unidade restauradas ficam limpas e a ordem dos turnos não altera o cadastro', () => {
  const initial = { unitId: '5', active: true, shiftIds: ['50', '51'] }
  assert.equal(hasFormChanges({ ...initial, unitId: '6' }, initial), true)
  assert.equal(hasFormChanges({ ...initial, active: false }, initial), true)
  assert.equal(hasFormChanges({ ...initial, shiftIds: ['50'] }, initial), true)
  assert.equal(hasFormChanges({ ...initial, shiftIds: ['51', '50'] }, initial), false)
  assert.equal(hasFormChanges({ ...initial, shiftIds: ['50', '50'] }, initial), true)
  assert.equal(hasFormChanges({ ...initial }, initial), false)
  assert.deepEqual(initial.shiftIds, ['50', '51'])
})
