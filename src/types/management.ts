export interface Address {
  postalCode: string
  address: string
  district: string
  city: string
  state: string
  number: string
  complement: string
}

export interface Technician extends Address {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  accessType: 'TÉCNICO'
  specialty: string
  shift: string
  status: 'Ativo' | 'Inativo'
}

export type TechnicianInput = Omit<Technician, 'id' | 'accessType' | keyof Address>

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
