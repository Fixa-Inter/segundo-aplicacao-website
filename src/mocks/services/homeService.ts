import { monthlyTasks, previewWeekStart, taskSummary } from '../home.ts'
import { listEvents } from './managementService.ts'
import type { HomeData } from '../../types/home'

export async function getHomeData(): Promise<HomeData> {
  const events = await listEvents()
  return {
    taskSummary: taskSummary.map((item) => ({ ...item })),
    monthlyTasks: monthlyTasks.map((item) => ({ ...item })),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: `${event.time}–${event.endTime}h`,
    })),
    // A semana do protótipo permite demonstrar os eventos da fixture inicial.
    weekStart: previewWeekStart,
    selectedDay: '2026-03-11',
  }
}
