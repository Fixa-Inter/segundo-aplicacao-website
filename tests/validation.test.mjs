import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validateEvent,
  validateDemoPassword,
  validateProfile,
  validateTechnician,
} from '../src/utils/managementValidation.ts'
import { monthDays, parseDateInput, shiftDate } from '../src/utils/calendar.ts'

test('valida técnico antes do cadastro demonstrativo', () => {
  const valid = {
    name: 'Ana Costa',
    email: 'ana@fixa.test',
    phone: '(11) 99999-1234',
    birthDate: '1995-04-18',
    specialty: 'Elétrica',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  }
  assert.deepEqual(validateTechnician(valid), {})
  assert.deepEqual(validateTechnician({ ...valid, specialty: '' }), {})
  assert.equal(
    validateTechnician({ ...valid, email: 'inválido' }).email,
    'Informe um e-mail válido.',
  )
  assert.equal(
    validateTechnician({ ...valid, shift: 'noite' }).shift,
    'Informe o turno no formato 08:00 - 16:00.',
  )
  assert.ok(validateTechnician({ ...valid, phone: '----------' }).phone)
  assert.ok(validateTechnician({ ...valid, birthDate: '2026-02-31' }).birthDate)
  assert.ok(validateTechnician({ ...valid, birthDate: '2999-01-01' }).birthDate)
  assert.ok(validateTechnician({ ...valid, shift: '99:00 - 16:00' }).shift)
})

test('aplica a regra provisória da senha de demonstração', () => {
  assert.equal(validateDemoPassword('Exemplo!'), undefined)
  for (const invalid of ['Ab!', 'exemplo!', 'EXEMPLO!', 'Exemplo1', 'Exemplo ']) {
    assert.ok(validateDemoPassword(invalid))
  }
})

test('valida evento e perfil antes de salvar', () => {
  const event = {
    title: 'Inspeção',
    date: '2026-03-11',
    time: '09:30',
    endTime: '10:30',
    location: '',
    description: '',
    observation: '',
    technicianId: '',
  }
  assert.deepEqual(validateEvent(event), {})
  assert.equal(validateEvent({ ...event, title: '' }).title, 'Informe o título do evento.')
  assert.equal(validateEvent({ ...event, date: '2026-02-31' }).date, 'Selecione uma data válida.')
  assert.equal(validateEvent({ ...event, time: '25:30' }).time, 'Selecione um horário.')
  assert.equal(
    validateEvent({ ...event, endTime: '09:00' }).endTime,
    'O término deve ser após o início.',
  )
  const profile = {
    name: 'Rapha',
    email: 'demo@fixa.test',
    company: 'FIXA',
    phone: '(11) 99999-0100',
    birthDate: '2000-03-11',
    postalCode: '01310-100',
    address: 'Avenida Exemplo',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    number: '100',
    complement: '',
  }
  assert.deepEqual(validateProfile(profile), {})
  assert.ok(validateProfile({ ...profile, phone: '123' }).phone)
})

test('calendário atravessa mês e ano sem deslocamento local', () => {
  assert.equal(parseDateInput('15/06/1998'), '1998-06-15')
  assert.equal(parseDateInput('1998-06-15'), '')
  assert.equal(parseDateInput('15/06/98'), '')
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01')
  assert.equal(monthDays('2026-02').length, 28)
  assert.ok(monthDays('2024-02').includes('2024-02-29'))
  assert.equal(monthDays('2026-03').length, 35)
})
