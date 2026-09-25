import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validateEvent,
  validateProfile,
  validateTechnician,
} from '../src/utils/managementValidation.ts'
import { shiftDate } from '../src/utils/calendar.ts'

test('valida técnico antes do cadastro demonstrativo', () => {
  const valid = {
    name: 'Ana Costa',
    email: 'ana@fixa.test',
    phone: '(11) 99999-1234',
    specialty: 'Elétrica',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  }
  assert.deepEqual(validateTechnician(valid), {})
  assert.equal(
    validateTechnician({ ...valid, email: 'inválido' }).email,
    'Informe um e-mail válido.',
  )
  assert.equal(
    validateTechnician({ ...valid, shift: 'noite' }).shift,
    'Informe o turno no formato 08:00 - 16:00.',
  )
})

test('valida evento e perfil antes de salvar', () => {
  const event = {
    title: 'Inspeção',
    date: '2026-03-11',
    time: '09:30',
    description: '',
    technicianId: '',
  }
  assert.deepEqual(validateEvent(event), {})
  assert.equal(validateEvent({ ...event, title: '' }).title, 'Informe o título do evento.')
  assert.equal(validateEvent({ ...event, date: '2026-02-31' }).date, 'Selecione uma data válida.')
  assert.equal(validateEvent({ ...event, time: '25:30' }).time, 'Selecione um horário.')
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
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01')
})
