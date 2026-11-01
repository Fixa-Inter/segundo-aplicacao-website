import type { CompetencyId, CompetencyInput, TechnicianCompetency } from '../../types/competency'
import type {
  CalendarEvent,
  CalendarEventInput,
  DashboardRecord,
  ManagerProfile,
  PerformancePeriod,
  PerformancePoint,
  Technician,
  TechnicianInput,
} from '../../types/management'
import {
  competencyCategories,
  getCompetencyPresentation,
  validateCompetency,
} from '../../utils/competencies.ts'
import {
  validateEvent,
  validateProfile,
  validateTechnician,
} from '../../utils/managementValidation.ts'
import {
  dashboardByTechnician,
  dashboardRecords,
  initialEvents,
  initialProfile,
  initialTechnicians,
} from '../management.ts'
import { performanceByTechnician } from '../performance.ts'

let technicians = initialTechnicians.map((item) => ({ ...item }))
let events = initialEvents.map((item) => ({ ...item }))
let profile = { ...initialProfile }
let sessionVersion = 0
let competencies: Record<string, Partial<Record<CompetencyId, number>>> = {}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 180))

export function clearDemoManagement(): void {
  sessionVersion += 1
  technicians = initialTechnicians.map((item) => ({ ...item }))
  events = initialEvents.map((item) => ({ ...item }))
  profile = { ...initialProfile }
  competencies = {}
}

function assertActiveSession(version: number): void {
  if (version !== sessionVersion) throw new Error('A sessão de demonstração foi encerrada.')
}

export async function listTechnicians(): Promise<Technician[]> {
  await pause()
  return technicians.map(withAssessedSpecialty)
}

function withAssessedSpecialty(technician: Technician): Technician {
  const items = competencyCategories.map((item) => ({
    ...item,
    rating: competencies[technician.id]?.[item.id] ?? null,
  }))
  return {
    ...technician,
    assessedSpecialty: getCompetencyPresentation(items).highlights[0]?.name ?? null,
  }
}

export async function saveTechnician(
  input: TechnicianInput,
  id?: string,
  ratings: CompetencyInput[] = [],
): Promise<Technician> {
  const version = sessionVersion
  await pause()
  assertActiveSession(version)
  const validationErrors = Object.values(validateTechnician(input))
  if (validationErrors.length) throw new Error(validationErrors[0])
  if (
    technicians.some(
      (item) => item.email.toLowerCase() === input.email.trim().toLowerCase() && item.id !== id,
    )
  )
    throw new Error('Já existe um técnico com este e-mail.')
  if (id && !technicians.some((item) => item.id === id)) throw new Error('Técnico não encontrado.')

  for (const rating of ratings) {
    const error = validateCompetency(rating)
    if (error) throw new Error(error)
  }

  const result: Technician = {
    id: id ?? crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    birthDate: input.birthDate,
    specialty: input.specialty.trim(),
    assessedSpecialty: null,
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
  const nextRatings = { ...competencies[result.id] }
  for (const { competencyId, rating } of ratings) {
    if (rating === null) delete nextRatings[competencyId]
    else nextRatings[competencyId] = rating
  }
  technicians = id
    ? technicians.map((item) => (item.id === id ? result : item))
    : [...technicians, result]
  competencies = { ...competencies, [result.id]: nextRatings }
  return withAssessedSpecialty(result)
}

export async function removeTechnician(id: string): Promise<void> {
  const version = sessionVersion
  await pause()
  assertActiveSession(version)
  if (events.some((event) => event.technicianId === id))
    throw new Error(
      'Este técnico possui eventos vinculados. Reatribua ou exclua os eventos primeiro.',
    )
  technicians = technicians.filter((item) => item.id !== id)
  const { [id]: removed, ...remaining } = competencies
  void removed
  competencies = remaining
}

function competencyPause(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Operação cancelada.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, 180)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function listTechnicianCompetencies(
  technicianId: string,
  signal?: AbortSignal,
): Promise<TechnicianCompetency[]> {
  const version = sessionVersion
  await competencyPause(signal)
  assertActiveSession(version)
  if (!technicians.some((item) => item.id === technicianId))
    throw new Error('Técnico não encontrado.')
  return competencyCategories.map((item) => ({
    ...item,
    rating: competencies[technicianId]?.[item.id] ?? null,
  }))
}

export async function saveTechnicianCompetency(
  technicianId: string,
  input: CompetencyInput,
  signal?: AbortSignal,
): Promise<TechnicianCompetency> {
  const version = sessionVersion
  await competencyPause(signal)
  assertActiveSession(version)
  if (!technicians.some((item) => item.id === technicianId))
    throw new Error('Técnico não encontrado.')
  const error = validateCompetency(input)
  if (error) throw new Error(error)
  const category = competencyCategories.find((item) => item.id === input.competencyId)
  if (!category) throw new Error('Competência inválida.')
  const next = { ...competencies[technicianId] }
  if (input.rating === null) delete next[input.competencyId]
  else next[input.competencyId] = input.rating
  competencies = { ...competencies, [technicianId]: next }
  return { ...category, rating: input.rating }
}

export async function listEvents(): Promise<CalendarEvent[]> {
  await pause()
  return events.map((item) => ({ ...item }))
}

export async function saveEvent(input: CalendarEventInput, id?: string): Promise<CalendarEvent> {
  const version = sessionVersion
  await pause()
  assertActiveSession(version)
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
  const version = sessionVersion
  await pause()
  assertActiveSession(version)
  events = events.filter((item) => item.id !== id)
}

export async function getProfile(): Promise<ManagerProfile> {
  await pause()
  return { ...profile }
}

export async function saveProfile(input: ManagerProfile): Promise<ManagerProfile> {
  const version = sessionVersion
  await pause()
  assertActiveSession(version)
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

export async function getDashboard(technicianId = ''): Promise<DashboardRecord[]> {
  await pause()
  if (technicianId && !technicians.some((item) => item.id === technicianId))
    throw new Error('Técnico não encontrado.')
  const records = technicianId ? (dashboardByTechnician[technicianId] ?? []) : dashboardRecords
  return records.map((item) => ({ ...item, hours: [...item.hours] }))
}

export async function getTechnicianPerformance(
  id: string,
  period: PerformancePeriod,
): Promise<PerformancePoint[]> {
  await pause()
  if (!technicians.some((item) => item.id === id)) throw new Error('Técnico não encontrado.')
  return (performanceByTechnician[id]?.[period] ?? []).map((point) => ({ ...point }))
}
