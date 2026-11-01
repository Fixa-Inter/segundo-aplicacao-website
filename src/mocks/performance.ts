import type { PerformancePeriod, PerformancePoint } from '../types/management'
import { initialTechnicians } from './management.ts'

const week: PerformancePoint[] = [
  { label: 'Dom', completed: 29, active: 6, late: 5 },
  { label: 'Seg', completed: 33, active: 5, late: 6 },
  { label: 'Ter', completed: 20, active: 5, late: 4 },
  { label: 'Qua', completed: 24, active: 8, late: 6 },
  { label: 'Qui', completed: 7, active: 8, late: 5 },
  { label: 'Sex', completed: 12, active: 9, late: 8 },
  { label: 'Sáb', completed: 21, active: 12, late: 6 },
]
const month: PerformancePoint[] = [
  { label: 'Semana 1', completed: 110, active: 24, late: 8 },
  { label: 'Semana 2', completed: 124, active: 30, late: 11 },
  { label: 'Semana 3', completed: 98, active: 18, late: 7 },
  { label: 'Semana 4', completed: 132, active: 22, late: 9 },
]

export const performanceByTechnician: Record<
  string,
  Record<PerformancePeriod, PerformancePoint[]>
> = Object.fromEntries(initialTechnicians.map((technician) => [technician.id, { week, month }]))
