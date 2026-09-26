import {
  dashboardRecords,
  initialEvents,
  initialProfile,
  initialTechnicians,
} from '../mocks/management.ts'
import {
  validateEvent,
  validateProfile,
  validateTechnician,
} from '../utils/managementValidation.ts'
import type {
  CalendarEvent,
  CalendarEventInput,
  DashboardRecord,
  ManagerProfile,
  Technician,
  TechnicianInput,
} from '../types/management'

// Repositório em memória da demonstração. Um recarregamento restaura os exemplos.
let technicians = initialTechnicians.map((item) => ({ ...item }))
let events = initialEvents.map((item) => ({ ...item }))
let profile = { ...initialProfile }

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 180))

export async function listTechnicians(): Promise<Technician[]> {
  await pause()
  return technicians.map((item) => ({ ...item }))
}

export async function saveTechnician(input: TechnicianInput, id?: string): Promise<Technician> {
  await pause()
  const validationErrors = Object.values(validateTechnician(input))
  if (validationErrors.length) throw new Error(validationErrors[0])
  if (
    technicians.some(
      (item) => item.email.toLowerCase() === input.email.trim().toLowerCase() && item.id !== id,
    )
  )
    throw new Error('Já existe um técnico com este e-mail.')
  if (id && !technicians.some((item) => item.id === id)) throw new Error('Técnico não encontrado.')
  // Tipo e endereço são definidos pelo serviço, nunca por campos editáveis do cadastro.
  const result: Technician = {
    id: id ?? crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    birthDate: input.birthDate,
    specialty: input.specialty.trim(),
    shift: input.shift,
    status: input.status,
    accessType: 'TÉCNICO',
    postalCode: profile.postalCode,
    address: profile.address,
    district: profile.district,
    city: profile.city,
    state: profile.state,
    number: profile.number,
    complement: profile.complement,
  }
  technicians = id
    ? technicians.map((item) => (item.id === id ? result : item))
    : [...technicians, result]
  return { ...result }
}

export async function removeTechnician(id: string): Promise<void> {
  await pause()
  if (events.some((event) => event.technicianId === id))
    throw new Error(
      'Este técnico possui eventos vinculados. Reatribua ou exclua os eventos primeiro.',
    )
  technicians = technicians.filter((item) => item.id !== id)
}

export async function listEvents(): Promise<CalendarEvent[]> {
  await pause()
  return events.map((item) => ({ ...item }))
}

export async function saveEvent(input: CalendarEventInput, id?: string): Promise<CalendarEvent> {
  await pause()
  const validationErrors = Object.values(validateEvent(input))
  if (validationErrors.length) throw new Error(validationErrors[0])
  if (input.technicianId && !technicians.some((item) => item.id === input.technicianId))
    throw new Error('Selecione um técnico válido.')
  if (id && !events.some((item) => item.id === id)) throw new Error('Evento não encontrado.')
  const result: CalendarEvent = {
    id: id ?? crypto.randomUUID(),
    title: input.title.trim(),
    date: input.date,
    time: input.time,
    endTime: input.endTime,
    location: input.location.trim(),
    description: input.description.trim(),
    observation: input.observation.trim(),
    technicianId: input.technicianId,
  }
  events = id ? events.map((item) => (item.id === id ? result : item)) : [...events, result]
  return { ...result }
}

export async function removeEvent(id: string): Promise<void> {
  await pause()
  events = events.filter((item) => item.id !== id)
}

export async function getProfile(): Promise<ManagerProfile> {
  await pause()
  return { ...profile }
}

export async function saveProfile(input: ManagerProfile): Promise<ManagerProfile> {
  await pause()
  const validationErrors = Object.values(validateProfile(input))
  if (validationErrors.length) throw new Error(validationErrors[0])
  profile = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    company: input.company.trim(),
    birthDate: input.birthDate,
    postalCode: input.postalCode.trim(),
    address: input.address.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state,
    number: input.number.trim(),
    complement: input.complement.trim(),
  }
  return { ...profile }
}

export async function getDashboard(): Promise<DashboardRecord[]> {
  await pause()
  return dashboardRecords.map((item) => ({ ...item, hours: [...item.hours] }))
}
