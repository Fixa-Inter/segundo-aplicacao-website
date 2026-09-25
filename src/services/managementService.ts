import {
  dashboardRecords,
  initialEvents,
  initialProfile,
  initialTechnicians,
} from '../mocks/management'
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
  if (
    technicians.some(
      (item) => item.email.toLowerCase() === input.email.toLowerCase() && item.id !== id,
    )
  )
    throw new Error('Já existe um técnico com este e-mail.')
  if (id && !technicians.some((item) => item.id === id)) throw new Error('Técnico não encontrado.')
  const result = { ...input, id: id ?? crypto.randomUUID() }
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
  if (input.technicianId && !technicians.some((item) => item.id === input.technicianId))
    throw new Error('Selecione um técnico válido.')
  if (id && !events.some((item) => item.id === id)) throw new Error('Evento não encontrado.')
  const result = { ...input, id: id ?? crypto.randomUUID() }
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
  profile = { ...input }
  return { ...profile }
}

export async function getDashboard(): Promise<DashboardRecord[]> {
  await pause()
  return dashboardRecords.map((item) => ({ ...item, hours: [...item.hours] }))
}
