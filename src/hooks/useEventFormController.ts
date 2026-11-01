import { useRef, useState, type FormEvent } from 'react'
import { useUnsavedForm } from '../contexts/useUnsavedChanges'
import { useAuth } from '../contexts/useAuth'
import { useEventLocations } from './useManagementOptions'
import { hasFormChanges } from '../utils/formChanges'
import { formatDate, parseDateInput } from '../utils/calendar'
import { validateEvent } from '../utils/apiValidation'
import type { CalendarEventInput } from '../types/management'
import type { EventFormProps } from '../types/ui'
import type { EventFormController } from '../types/eventForm'
export function useEventFormController({
  event,
  selectedDay,
  responsibles,
  onSubmit,
  onSaved,
  onCancel,
}: EventFormProps): EventFormController {
  const {
    items: locations,
    error: locationError,
    loading: locationsLoading,
    retry: retryLocations,
  } = useEventLocations()
  const { user } = useAuth()
  const [form, setForm] = useState<CalendarEventInput>({
    locationId: event?.locationId ?? '',
    endDate: event?.endDate ?? event?.date ?? selectedDay,
    title: event?.title ?? '',
    location: event?.location ?? '',
    description: event?.description ?? '',
    observation: event?.observation ?? '',
    date: event?.date ?? selectedDay,
    time: event?.time ?? '09:00',
    endTime: event?.endTime ?? '10:00',
    technicianId:
      event?.technicianId ?? (responsibles.some((item) => item.id === user?.id) ? user!.id : ''),
  })
  const [date, setDate] = useState(formatDate(form.date, { dateStyle: 'short' }))
  const [endDate, setEndDate] = useState(
    formatDate(form.endDate ?? form.date, { dateStyle: 'short' }),
  )
  const [initial] = useState(() => ({ ...form, dateText: date, endDateText: endDate }))
  const [errors, setErrors] = useState<Partial<Record<keyof CalendarEventInput, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState<CalendarEventInput | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isDirty = hasFormChanges({ ...form, dateText: date, endDateText: endDate }, initial)
  const requestExit = useUnsavedForm(isDirty, busy)
  const cancel = () => requestExit(onCancel)
  function update<K extends keyof CalendarEventInput>(key: K, value: CalendarEventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }
  async function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    if (busy) return
    const input = { ...form, date: parseDateInput(date), endDate: parseDateInput(endDate) }
    const validation = validateEvent(input)
    if (!/^\d+$/.test(form.technicianId)) validation.technicianId = 'Selecione um responsável.'
    setErrors(validation)
    setError('')
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    setPending(input)
  }
  async function confirmSave() {
    if (!pending || busy) return
    const input = pending
    setBusy(true)
    try {
      onSaved(await onSubmit(input))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o evento.')
    } finally {
      setPending(null)
      setBusy(false)
    }
  }
  return {
    form,
    date,
    endDate,
    errors,
    error,
    pending,
    busy,
    formRef,
    locations,
    locationError,
    locationsLoading,
    retryLocations,
    update,
    submit,
    confirmSave,
    cancel,
    closeConfirmation: () => setPending(null),
    updateDate: (value) => {
      setDate(value)
      setErrors((current) => ({ ...current, date: undefined }))
    },
    updateEndDate: (value) => {
      setEndDate(value)
      setErrors((current) => ({ ...current, endDate: undefined }))
    },
  }
}
