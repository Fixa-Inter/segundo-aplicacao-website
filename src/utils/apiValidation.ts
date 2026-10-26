import type { CalendarEventInput, ManagerProfile, TechnicianInput } from '../types/management'
import { validateEmail } from './validation.ts'
export function validatePassword(value: string): string | undefined {
  return value.length < 8 || value.length > 100 ? 'Use uma senha de 8 a 100 caracteres.' : undefined
}
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
function personal(input: { name: string; email: string; birthDate: string }) {
  const errors: Partial<Record<'name' | 'email' | 'birthDate', string>> = {}
  if (input.name.trim().length < 3 || input.name.length > 100)
    errors.name = 'Informe um nome entre 3 e 100 caracteres.'
  const emailError = validateEmail(input.email)
  if (emailError || input.email.length > 100)
    errors.email = emailError ?? 'O e-mail deve ter no máximo 100 caracteres.'
  const today = new Date().toLocaleDateString('sv-SE')
  if (!validDate(input.birthDate) || input.birthDate >= today)
    errors.birthDate = 'Informe uma data de nascimento no passado.'
  return errors
}
export function validateTechnician(
  input: TechnicianInput,
): Partial<Record<keyof TechnicianInput, string>> {
  const errors: Partial<Record<keyof TechnicianInput, string>> = personal(input)
  if (!input.jobTitle || input.jobTitle.trim().length < 2 || input.jobTitle.length > 100)
    errors.jobTitle = 'Informe uma função entre 2 e 100 caracteres.'
  const selectedShifts = input.shiftIds ?? (input.shiftId ? [input.shiftId] : [])
  if (selectedShifts.length > 1) errors.shiftId = 'Selecione apenas um turno.'
  else if (
    !input.shiftId ||
    !/^\d+$/.test(input.shiftId) ||
    selectedShifts.length !== 1 ||
    selectedShifts[0] !== input.shiftId
  )
    errors.shiftId = 'Selecione um turno cadastrado.'
  if (!['Ativo', 'Inativo'].includes(input.status)) errors.status = 'Selecione uma situação válida.'
  return errors
}
export function validateProfile(
  input: ManagerProfile,
): Partial<Record<keyof ManagerProfile, string>> {
  const errors = personal(input)
  if (!input.birthDate) delete errors.birthDate
  return errors
}
export function validateEvent(
  input: CalendarEventInput,
): Partial<Record<keyof CalendarEventInput, string>> {
  const errors: Partial<Record<keyof CalendarEventInput, string>> = {}
  if (!input.title.trim() || input.title.length > 100)
    errors.title = 'Informe um título com até 100 caracteres.'
  if (!input.description.trim() || input.description.length > 255)
    errors.description = 'Informe uma descrição com até 255 caracteres.'
  if (!input.location.trim() || input.location.length > 255)
    errors.location = 'Informe a descrição do local com até 255 caracteres.'
  if (!input.locationId || !/^\d+$/.test(input.locationId))
    errors.locationId = 'Selecione um local cadastrado.'
  if (input.observation.length > 255)
    errors.observation = 'A observação deve ter no máximo 255 caracteres.'
  if (!validDate(input.date)) errors.date = 'Selecione uma data válida.'
  if (!validDate(input.endDate ?? input.date))
    errors.endDate = 'Selecione uma data de término válida.'
  const time = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!time.test(input.time)) errors.time = 'Selecione um horário válido.'
  if (
    !time.test(input.endTime) ||
    `${input.endDate ?? input.date}T${input.endTime}` <= `${input.date}T${input.time}`
  )
    errors.endTime = 'O término deve ser após o início.'
  return errors
}
