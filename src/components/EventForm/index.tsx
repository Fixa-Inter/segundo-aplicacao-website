import { ConfirmDialog } from '../ConfirmDialog'
import { FigmaIcon } from '../FigmaIcon'
import { AuthField } from '../AuthField'
import { usePreferences } from '../../contexts/usePreferences'
import { useEventFormController } from '../../hooks/useEventFormController'
import type { EventFormProps } from '../../types/ui'
import { truncateText } from '../../utils/presentation'
import styles from './EventForm.module.css'
export function EventForm(props: EventFormProps) {
  const { t } = usePreferences()
  const { event, responsibles } = props
  const {
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
    updateDate,
    updateEndDate,
    submit,
    confirmSave,
    closeConfirmation,
    cancel,
  } = useEventFormController(props)
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
      <h1 className={styles.title} title={event?.title}>
        <span>{t(event ? 'Edite' : 'Agende')}</span>{' '}
        {event ? truncateText(event.title, 48) : t('um evento')}
      </h1>
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy} className={styles.form}>
        <fieldset disabled={busy} className={styles.grid}>
          <legend className={styles.srOnly}>{t('Dados do evento')}</legend>
          <AuthField
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
              disabled={locationsLoading}
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
            {locationsLoading && <p role="status">{t('Carregando locais…')}</p>}
            {locationError && (
              <div role="alert">
                <p>{locationError}</p>
                <button type="button" onClick={retryLocations}>
                  {t('Tentar novamente')}
                </button>
              </div>
            )}
            {!locationsLoading && !locations.length && !locationError && (
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
          <div className={styles.schedule}>
            <AuthField
              id="event-date"
              label={t('Data *')}
              value={date}
              placeholder={t('DD/MM/AAAA')}
              inputMode="numeric"
              maxLength={10}
              required
              error={errors.date}
              onChange={(e) => updateDate(e.currentTarget.value)}
            />
            <AuthField
              id="event-end-date"
              label={t('Data de término *')}
              value={endDate}
              placeholder={t('DD/MM/AAAA')}
              inputMode="numeric"
              maxLength={10}
              required
              error={errors.endDate}
              onChange={(e) => updateEndDate(e.currentTarget.value)}
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
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="event-technician">{t('Responsável pelo evento')}</label>
            <select
              disabled={Boolean(event)}
              required
              aria-invalid={Boolean(errors.technicianId)}
              aria-describedby={errors.technicianId ? 'event-technician-error' : undefined}
              id="event-technician"
              value={form.technicianId}
              onChange={(e) => update('technicianId', e.currentTarget.value)}
            >
              <option value="" disabled>
                {t('Selecione um responsável')}
              </option>
              {event && !responsibles.some((item) => item.id === event.technicianId) && (
                <option value={event.technicianId}>
                  {t('Responsável')} #{event.technicianId}
                </option>
              )}
              {responsibles
                .filter((item) => item.status === 'Ativo' || item.id === form.technicianId)
                .map((item) => (
                  <option key={item.id} value={item.id} title={item.name}>
                    {truncateText(item.name, 48)}
                  </option>
                ))}
            </select>
            {errors.technicianId && (
              <p id="event-technician-error" className={styles.error} role="alert">
                {t(errors.technicianId)}
              </p>
            )}
          </div>
        </fieldset>
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
        onClose={closeConfirmation}
        onConfirm={confirmSave}
      />
    </div>
  )
}
