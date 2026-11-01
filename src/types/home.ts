import type { StatCardProps } from './ui'

export interface MonthlyTaskCount {
  month: string
  value: number
}
export interface CalendarPreviewEvent {
  endDate?: string
  id: string
  date: string
  title: string
  time: string
}

export interface HomeData {
  taskSummary: StatCardProps[]
  monthlyTasks: MonthlyTaskCount[]
  events: CalendarPreviewEvent[]
  weekStart: string
  selectedDay: string
}
