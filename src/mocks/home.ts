import type { MonthlyTaskCount } from '../types/home'
import type { StatCardProps } from '../types/ui'

export const taskSummary: StatCardProps[] = [
  { label: 'A fazer', value: 20, tone: 'blue' },
  { label: 'Pendentes', value: 10, tone: 'yellow' },
  { label: 'Concluídas', value: 8, tone: 'green' },
  { label: 'Atrasadas', value: 2, tone: 'red' },
]
export const monthlyTasks: MonthlyTaskCount[] = [
  { month: 'Jan', value: 18 },
  { month: 'Fev', value: 27 },
  { month: 'Mar', value: 40 },
  { month: 'Abr', value: 26 },
  { month: 'Mai', value: 12 },
  { month: 'Jun', value: 24 },
  { month: 'Jul', value: 18 },
]
export const previewWeekStart = '2026-03-08'
