export interface Technician {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  shift: string
  status: 'Ativo' | 'Inativo'
}

export type TechnicianInput = Omit<Technician, 'id'>

export interface CalendarEvent {
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

export interface ManagerProfile {
  name: string
  email: string
  company: string
  phone: string
  birthDate: string
  postalCode: string
  address: string
  district: string
  city: string
  state: string
  number: string
  complement: string
}

export interface DashboardRecord {
  month: string
  opened: number
  completed: number
  hours: number[]
}
