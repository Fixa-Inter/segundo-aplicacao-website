export interface MonthlyTaskCount {
  month: string
  value: number
}
export interface CalendarPreviewEvent {
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
import type { StatCardProps } from './ui'
