export interface Address {
  postalCode: string
  address: string
  district: string
  city: string
  state: string
  number: string
  complement: string
}

export interface ShiftOption {
  id: string
  name: string
}
export interface EventResponsibleOption {
  id: string
  name: string
  status: 'Ativo' | 'Inativo'
}

export interface LocationOption {
  id: string
  name: string
}

export interface Technician extends Address {
  unitId?: string
  jobTitle?: string
  shiftId?: string
  shiftIds?: string[]
  password?: string
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  accessType: 'TÉCNICO'
  specialty: string
  assessedSpecialty: string | null
  shift: string
  status: 'Ativo' | 'Inativo'
}

export interface TeamMember extends Omit<Technician, 'accessType'> {
  accessType: 'GESTOR' | 'TÉCNICO'
  unitName?: string
}

export type TechnicianInput = Omit<
  Technician,
  'id' | 'accessType' | 'assessedSpecialty' | keyof Address
>

export interface CalendarEvent {
  locationId?: string
  endDate?: string
  id: string
  title: string
  date: string
  time: string
  endTime: string
  location: string
  description: string
  observation: string
  technicianId: string
}

export type CalendarEventInput = Omit<CalendarEvent, 'id'>

export interface ManagerProfile extends Address {
  name: string
  email: string
  company: string
  phone: string
  birthDate: string
}

export interface DashboardRecord {
  month: string
  opened: number
  completed: number
  hours: number[]
}

export type PerformancePeriod = 'week' | 'month'
export interface PerformancePoint {
  label: string
  completed: number
  active: number
  late: number
}
