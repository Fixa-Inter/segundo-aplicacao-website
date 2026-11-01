import type { CalendarEventInput, ManagerProfile, TechnicianInput } from '../types/management'

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isValidPhone(value: string): boolean {
  return /^[\d\s()+-]+$/.test(value) && /^\d{10,11}$/.test(value.replace(/\D/g, ''))
}

// Regra provisória informada pelo grupo; confirmar com o contrato de autenticação.
export function validateDemoPassword(password: string): string | undefined {
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/\p{Lu}/u.test(password) ||
    !/\p{Ll}/u.test(password) ||
    !/[^\p{L}\p{N}\s]/u.test(password)
  )
    return 'Use de 8 a 128 caracteres, com maiúscula, minúscula e símbolo especial.'
  return undefined
}

export function validateTechnician(
  input: TechnicianInput,
): Partial<Record<keyof TechnicianInput, string>> {
  const errors: Partial<Record<keyof TechnicianInput, string>> = {}
  if (input.name.trim().length < 2) errors.name = 'Informe um nome com pelo menos 2 caracteres.'
  if (input.name.length > 80) errors.name = 'O nome deve ter no máximo 80 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    errors.email = 'Informe um e-mail válido.'
  if (input.email.length > 120) errors.email = 'O e-mail deve ter no máximo 120 caracteres.'
  if (!isValidPhone(input.phone.trim())) errors.phone = 'Informe um telefone com DDD.'
  if (!isValidDate(input.birthDate) || input.birthDate > new Date().toISOString().slice(0, 10))
    errors.birthDate = 'Informe uma data de nascimento válida, sem data futura.'
  if (input.specialty.length > 60)
    errors.specialty = 'A especialidade deve ter no máximo 60 caracteres.'
  if (!/^([01]\d|2[0-3]):[0-5]\d - ([01]\d|2[0-3]):[0-5]\d$/.test(input.shift))
    errors.shift = 'Informe o turno no formato 08:00 - 16:00.'
  if (input.status !== 'Ativo' && input.status !== 'Inativo')
    errors.status = 'Selecione uma situação válida.'
  return errors
}

export function validateEvent(
  input: CalendarEventInput,
): Partial<Record<keyof CalendarEventInput, string>> {
  const errors: Partial<Record<keyof CalendarEventInput, string>> = {}
  if (!input.title.trim()) errors.title = 'Informe o título do evento.'
  if (input.title.length > 100) errors.title = 'O título deve ter no máximo 100 caracteres.'
  if (!isValidDate(input.date)) errors.date = 'Selecione uma data válida.'
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
  if (!isValidPhone(input.phone.trim())) errors.phone = 'Informe um telefone com DDD.'
  if (
    input.birthDate &&
    (!isValidDate(input.birthDate) || input.birthDate > new Date().toISOString().slice(0, 10))
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
