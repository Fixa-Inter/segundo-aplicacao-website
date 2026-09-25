import type { CalendarEventInput, ManagerProfile, TechnicianInput } from '../types/management'

export function validateTechnician(
  input: TechnicianInput,
): Partial<Record<keyof TechnicianInput, string>> {
  const errors: Partial<Record<keyof TechnicianInput, string>> = {}
  if (input.name.trim().length < 2) errors.name = 'Informe um nome com pelo menos 2 caracteres.'
  if (input.name.length > 80) errors.name = 'O nome deve ter no máximo 80 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    errors.email = 'Informe um e-mail válido.'
  if (input.email.length > 120) errors.email = 'O e-mail deve ter no máximo 120 caracteres.'
  if (!/^\+?[\d\s()-]{10,20}$/.test(input.phone.trim()))
    errors.phone = 'Informe um telefone com DDD.'
  if (!input.specialty.trim()) errors.specialty = 'Informe a especialidade.'
  if (input.specialty.length > 60)
    errors.specialty = 'A especialidade deve ter no máximo 60 caracteres.'
  if (!/^\d{2}:\d{2} - \d{2}:\d{2}$/.test(input.shift))
    errors.shift = 'Informe o turno no formato 08:00 - 16:00.'
  return errors
}

export function validateEvent(
  input: CalendarEventInput,
): Partial<Record<keyof CalendarEventInput, string>> {
  const errors: Partial<Record<keyof CalendarEventInput, string>> = {}
  if (!input.title.trim()) errors.title = 'Informe o título do evento.'
  if (input.title.length > 100) errors.title = 'O título deve ter no máximo 100 caracteres.'
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    Number.isNaN(new Date(`${input.date}T12:00:00Z`).getTime()) ||
    new Date(`${input.date}T12:00:00Z`).toISOString().slice(0, 10) !== input.date
  )
    errors.date = 'Selecione uma data válida.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) errors.time = 'Selecione um horário.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime) || input.endTime <= input.time)
    errors.endTime = 'O término deve ser após o início.'
  if (input.location.length > 100) errors.location = 'O local deve ter no máximo 100 caracteres.'
  if (input.description.length > 300)
    errors.description = 'A descrição deve ter no máximo 300 caracteres.'
  if (input.observation.length > 300)
    errors.observation = 'A observação deve ter no máximo 300 caracteres.'
  return errors
}

export function validateProfile(
  input: ManagerProfile,
): Partial<Record<keyof ManagerProfile, string>> {
  const errors: Partial<Record<keyof ManagerProfile, string>> = {}
  if (input.name.trim().length < 2 || input.name.length > 80)
    errors.name = 'Informe um nome entre 2 e 80 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.length > 120)
    errors.email = 'Informe um e-mail válido.'
  if (!input.company.trim() || input.company.length > 100)
    errors.company = 'Informe uma empresa com até 100 caracteres.'
  if (!/^\+?[\d\s()-]{10,20}$/.test(input.phone.trim()))
    errors.phone = 'Informe um telefone com DDD.'
  if (
    input.birthDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) ||
      Number.isNaN(new Date(`${input.birthDate}T12:00:00Z`).getTime()) ||
      new Date(`${input.birthDate}T12:00:00Z`).toISOString().slice(0, 10) !== input.birthDate)
  )
    errors.birthDate = 'Informe uma data de nascimento válida.'
  if (input.postalCode && !/^\d{5}-?\d{3}$/.test(input.postalCode))
    errors.postalCode = 'Informe um CEP válido.'
  if (!input.address.trim() || input.address.length > 100)
    errors.address = 'Informe um logradouro com até 100 caracteres.'
  if (!input.city.trim() || input.city.length > 60)
    errors.city = 'Informe uma cidade com até 60 caracteres.'
  if (!/^[A-Z]{2}$/.test(input.state)) errors.state = 'Informe a sigla do estado.'
  return errors
}
