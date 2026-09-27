import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getProfile,
  getTechnicianPerformance,
  listTechnicians,
  listEvents,
  removeEvent,
  removeTechnician,
  saveProfile,
  saveTechnician,
  saveEvent,
} from '../src/services/managementService.ts'

const technician = {
  name: 'Técnico de teste',
  birthDate: '1995-04-18',
  email: 'teste@fixa.test',
  phone: '(11) 99999-1234',
  specialty: 'Elétrica',
  shift: '08:00 - 16:00',
  status: 'Ativo',
}

test('cadastro impõe tipo técnico, herda endereço e descarta campos indevidos', async () => {
  const manager = await getProfile()
  await saveProfile({ ...manager, address: 'Rua do gestor de teste', number: '42' })
  const saved = await saveTechnician({
    ...technician,
    accessType: 'ADMINISTRADOR',
    address: 'Endereço indevido',
    password: 'Exemplo!',
  })
  assert.equal(saved.accessType, 'TÉCNICO')
  assert.equal(saved.address, 'Rua do gestor de teste')
  assert.equal(saved.number, '42')
  assert.equal(saved.city, manager.city)
  assert.equal('password' in saved, false)
  assert.deepEqual(await getTechnicianPerformance(saved.id, 'week'), [])

  saved.address = 'Alteração na cópia retornada'
  const stored = (await listTechnicians()).find((item) => item.id === saved.id)
  assert.equal(stored.address, 'Rua do gestor de teste')
  assert.equal('password' in stored, false)
  await removeTechnician(saved.id)
})

test('desempenho demonstrativo permite filtrar período sem modificar a fixture', async () => {
  const week = await getTechnicianPerformance('t-1', 'week')
  const month = await getTechnicianPerformance('t-1', 'month')
  assert.equal(week.length, 7)
  assert.equal(month.length, 4)
  week[0].completed = 9999
  assert.notEqual((await getTechnicianPerformance('t-1', 'week'))[0].completed, 9999)
  await assert.rejects(getTechnicianPerformance('inexistente', 'week'), /não encontrado/)
})

test('eventos validam horários no service e preservam cópias independentes', async () => {
  const event = {
    title: ' Evento de teste ',
    date: '2026-03-11',
    time: '09:00',
    endTime: '10:00',
    location: 'Sala de teste',
    description: '',
    observation: '',
    technicianId: '',
  }
  await assert.rejects(saveEvent({ ...event, endTime: '08:00' }), /término deve ser após/)
  await assert.rejects(saveEvent({ ...event, technicianId: 'inexistente' }), /técnico válido/)
  const saved = await saveEvent({ ...event, password: 'Não armazenar' })
  assert.equal(saved.title, 'Evento de teste')
  assert.equal('password' in saved, false)
  saved.title = 'Cópia alterada'
  assert.equal((await listEvents()).find((item) => item.id === saved.id).title, 'Evento de teste')
  await removeEvent(saved.id)
})

test('perfil rejeita dados inválidos e descarta propriedades fora do contrato demonstrativo', async () => {
  const manager = await getProfile()
  await assert.rejects(saveProfile({ ...manager, phone: '123' }), /telefone com DDD/)
  const saved = await saveProfile({
    ...manager,
    accessType: 'ADMINISTRADOR',
    password: 'Não armazenar',
  })
  assert.equal('password' in saved, false)
  assert.equal('accessType' in saved, false)
})

test('service rejeita cadastro inválido, e-mail duplicado e exclusão com evento vinculado', async () => {
  await assert.rejects(saveTechnician({ ...technician, phone: '----------' }), /telefone com DDD/)
  await assert.rejects(saveTechnician({ ...technician, email: 'ana@fixa.test' }), /Já existe/)
  await assert.rejects(saveTechnician({ ...technician, email: ' ANA@fixa.test ' }), /Já existe/)
  await assert.rejects(removeTechnician('t-1'), /eventos vinculados/)
})
