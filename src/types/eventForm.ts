import type { FormEvent, RefObject } from 'react'
import type { CalendarEventInput, LocationOption } from './management'

export type EventFormErrors = Partial<Record<keyof CalendarEventInput, string>>
export interface EventFormController {
  form: CalendarEventInput
  date: string
  endDate: string
  errors: EventFormErrors
  error: string
  pending: CalendarEventInput | null
  busy: boolean
  formRef: RefObject<HTMLFormElement | null>
  locations: LocationOption[]
  locationError: string
  locationsLoading: boolean
  retryLocations: () => void
  update: <K extends keyof CalendarEventInput>(key: K, value: CalendarEventInput[K]) => void
  updateDate: (value: string) => void
  updateEndDate: (value: string) => void
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  confirmSave: () => Promise<void>
  closeConfirmation: () => void
  cancel: () => void
}
