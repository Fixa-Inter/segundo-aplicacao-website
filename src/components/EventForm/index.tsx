import { ConfirmDialog } from '../ConfirmDialog'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import { hasFormChanges } from '../../utils/formChanges'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AuthField } from '../AuthField'
import { listLocations } from '../../services/managementService'
import { useAuth } from '../../contexts/useAuth'
import type { LocationOption } from '../../types/management'
import type { CalendarEventInput } from '../../types/management'
import type { EventFormProps } from '../../types/ui'
import { formatDate, parseDateInput } from '../../utils/calendar'
import { validateEvent } from '../../utils/apiValidation'
import styles from './EventForm.module.css'

export function EventForm({
  event,
  selectedDay,
  technicians,
  onSubmit,
  onSaved,
  onCancel,
}: EventFormProps) {
  const { t } = usePreferences()
  const { user } = useAuth()
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationError, setLocationError] = useState('')
  const [locationAttempt, setLocationAttempt] = useState(0)
  useEffect(() => {
    let active = true
    listLocations()
      .then((items) => {
        if (active) {
          setLocations(items)
          setLocationError('')
        }
      })
      .catch((reason) => {
        if (active)
          setLocationError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar os locais.',
          )
      })
    return () => {
      active = false
    }
  }, [locationAttempt])

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
    technicianId: event?.technicianId ?? '',
  })
  const [date, setDate] = useState(formatDate(form.date, { dateStyle: 'short' }))
  const [initial] = useState(() => ({ ...form, dateText: date }))
  const [errors, setErrors] = useState<Partial<Record<keyof CalendarEventInput, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState<CalendarEventInput | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isDirty = hasFormChanges({ ...form, dateText: date }, initial)
  const requestExit = useUnsavedForm(isDirty, busy)
  const cancel = () => requestExit(onCancel)

  function update<K extends keyof CalendarEventInput>(key: K, value: CalendarEventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    if (busy) return
    const input = { ...form, date: parseDateInput(date) }
    const validation = validateEvent(input)
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

  return (
    <div className={styles.page}>
      <button
        className={styles.back}
        type="button"
        onClick={cancel}
        disabled={busy}
        aria-label={t('Voltar para calendário')}
      >
        <FigmaIcon name="back" />
      </button>
      <h1 className={styles.title}>
        <span>{t(event ? 'Edite' : 'Agende')}</span> {event ? event.title : t('um evento')}
      </h1>
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy} className={styles.form}>
        <fieldset disabled={busy} className={styles.grid}>
          <legend className={styles.srOnly}>{t('Dados do evento')}</legend>
          <AuthField
            className={styles.name}
            id="event-title"
            label={t('Nome do evento *')}
            value={form.title}
            placeholder={t('Digite o nome')}
            maxLength={100}
            required
            autoFocus
            error={errors.title}
            onChange={(e) => update('title', e.currentTarget.value)}
          />
          <div className={styles.field}>
            <label htmlFor="event-location-id">{t('Local cadastrado')} *</label>
            <select
              id="event-location-id"
              value={form.locationId ?? ''}
              aria-invalid={Boolean(errors.locationId)}
              onChange={(e) => update('locationId', e.currentTarget.value)}
            >
              <option value="">{t('Selecione um local')}</option>
              {event?.locationId && !locations.some((item) => item.id === event.locationId) && (
                <option value={event.locationId}>{event.location}</option>
              )}
              {locations.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p role="alert" className={styles.error}>
                {t(errors.locationId)}
              </p>
            )}
            {locationError && (
              <div role="alert">
                <p>{locationError}</p>
                <button type="button" onClick={() => setLocationAttempt((value) => value + 1)}>
                  {t('Tentar novamente')}
                </button>
              </div>
            )}
            {!locations.length && !locationError && (
              <p>{t('Nenhum local ativo cadastrado na unidade.')}</p>
            )}
          </div>
          <AuthField
            id="event-location"
            label={t('Descrição do local *')}
            value={form.location}
            placeholder={t('Informe o local')}
            maxLength={100}
            error={errors.location}
            onChange={(e) => update('location', e.currentTarget.value)}
          />
          {(['description', 'observation'] as const).map((key) => (
            <div className={`${styles.field} ${styles.full}`} key={key}>
              <label htmlFor={`event-${key}`}>
                {t(key === 'description' ? 'Descrição' : 'Observação')}
              </label>
              <textarea
                id={`event-${key}`}
                value={form[key]}
                maxLength={255}
                placeholder={t('Adicione uma breve descrição…')}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? `event-${key}-error` : undefined}
                onChange={(e) => update(key, e.currentTarget.value)}
              />
              {errors[key] && (
                <span id={`event-${key}-error`} className={styles.error} role="alert">
                  {t(errors[key] ?? '')}
                </span>
              )}
            </div>
          ))}
          <AuthField
            id="event-date"
            label={t('Data *')}
            value={date}
            placeholder={t('DD/MM/AAAA')}
            inputMode="numeric"
            maxLength={10}
            required
            error={errors.date}
            onChange={(e) => {
              setDate(e.currentTarget.value)
              setErrors((current) => ({ ...current, date: undefined }))
            }}
          />
          <AuthField
            id="event-start"
            label={t('Horário de início *')}
            value={form.time}
            placeholder={t('09:00')}
            inputMode="numeric"
            maxLength={5}
            required
            error={errors.time}
            onChange={(e) => update('time', e.currentTarget.value)}
          />
          <AuthField
            id="event-end-date"
            label={t('Data de término *')}
            type="date"
            value={form.endDate ?? form.date}
            required
            error={errors.endDate}
            onChange={(e) => update('endDate', e.currentTarget.value)}
          />
          <AuthField
            id="event-end"
            label={t('Horário de término *')}
            value={form.endTime}
            placeholder={t('10:00')}
            inputMode="numeric"
            maxLength={5}
            required
            error={errors.endTime}
            onChange={(e) => update('endTime', e.currentTarget.value)}
          />
          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="event-technician">{t('Técnico responsável')}</label>
            <select
              disabled={Boolean(event)}
              id="event-technician"
              value={form.technicianId}
              onChange={(e) => update('technicianId', e.currentTarget.value)}
            >
              <option value="">{t('Meu usuário')}</option>
              <option value={user?.id ?? ''}>{user?.name}</option>
              {event &&
                event.technicianId !== user?.id &&
                !technicians.some((item) => item.id === event.technicianId) && (
                  <option value={event.technicianId}>
                    {t('Responsável')} #{event.technicianId}
                  </option>
                )}
              {technicians
                .filter(
                  (technician) =>
                    technician.status === 'Ativo' || technician.id === form.technicianId,
                )
                .map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
            </select>
          </div>
        </fieldset>
        <p className={styles.note}>
          {t(
            'Campos com * são obrigatórios. Selecione um local da unidade. O responsável de um evento existente não pode ser alterado.',
          )}
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {t(error)}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={cancel} disabled={busy}>
            {t('Cancelar')}
          </button>
          <button className={styles.save} type="submit" disabled={busy}>
            {t(busy ? 'Salvando…' : 'Salvar')}
          </button>
        </div>
      </form>
      <ConfirmDialog
        opened={Boolean(pending)}
        variant="save"
        subject={form.title}
        confirmLabel="Salvar"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmSave}
      />
    </div>
  )
}
