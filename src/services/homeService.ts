import type { HomeData } from '../types/home'
import { listEvents } from './managementService.ts'

export async function getHomeData(): Promise<HomeData> {
  const events = await listEvents()
  const today = new Date().toLocaleDateString('sv-SE')
  return {
    taskSummary: [],
    monthlyTasks: [],
    events: events.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      endDate: item.endDate,
      time: `${item.time}–${item.endTime}h`,
    })),
    weekStart: today,
    selectedDay: today,
  }
}
