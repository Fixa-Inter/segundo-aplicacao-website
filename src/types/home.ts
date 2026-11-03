export interface CalendarPreviewEvent {
  endDate?: string
  id: string
  date: string
  title: string
  time: string
}

export interface HomeData {
  events: CalendarPreviewEvent[]
  selectedDay: string
}
