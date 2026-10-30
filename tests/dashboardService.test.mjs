import assert from 'node:assert/strict'
import test from 'node:test'
import { initialTechnicians } from '../src/mocks/management.ts'
import { getDashboard, saveTechnician } from '../src/mocks/services/managementService.ts'

test('parcelas sintéticas por técnico preservam totais, amostras e cópias', async () => {
  const total = await getDashboard()
  const parts = await Promise.all(initialTechnicians.map((item) => getDashboard(item.id)))
  total.forEach((record, index) => {
    assert.equal(
      parts.reduce((sum, part) => sum + part[index].opened, 0),
      record.opened,
    )
    assert.equal(
      parts.reduce((sum, part) => sum + part[index].completed, 0),
      record.completed,
    )
    assert.deepEqual(
      parts.flatMap((part) => part[index].hours).sort((a, b) => a - b),
      [...record.hours].sort((a, b) => a - b),
    )
    assert.ok(parts.every((part) => part[index].completed <= part[index].opened))
  })
  parts[0][0].hours.push(999)
  assert.equal((await getDashboard(initialTechnicians[0].id))[0].hours.includes(999), false)
  await assert.rejects(getDashboard('inexistente'), /não encontrado/)
})

test('técnico novo tem indicadores vazios em vez de métricas inventadas', async () => {
  const technician = await saveTechnician({
    name: 'Novo técnico BI',
    email: 'novo-bi@fixa.test',
    birthDate: '1995-04-18',
    phone: '(11) 99999-2222',
    specialty: 'Elétrica',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  })
  assert.deepEqual(await getDashboard(technician.id), [])
})
