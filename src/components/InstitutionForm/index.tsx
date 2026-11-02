import { useRef, useState, type FormEvent } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import type { InstitutionFormProps, InstitutionInput } from '../../types/institution'
import { locationTypes, shiftSeconds, validateInstitution } from '../../utils/institution'
import { ConfirmDialog } from '../ConfirmDialog'
import { FigmaIcon } from '../FigmaIcon'
import styles from './InstitutionForm.module.css'

export function InstitutionForm({
  kind,
  entry,
  units,
  readOnly,
  onEdit,
  onCancel,
  onSubmit,
}: InstitutionFormProps) {
  const { t } = usePreferences()
  const local = kind === 'locations'
  const [form, setForm] = useState<InstitutionInput>({
    unitId: entry?.unitId ?? (units.length === 1 ? units[0].id : ''),
    name: entry?.name ?? '',
    locationType: entry?.locationType ?? '',
    description: entry?.description ?? '',
    startTime: entry?.startTime ?? '',
    endTime: entry?.endTime ?? '',
  })
  const [initial] = useState(() => JSON.stringify(form))
  const [errors, setErrors] = useState<Partial<Record<keyof InstitutionInput, string>>>({})
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const requestExit = useUnsavedForm(!readOnly && JSON.stringify(form) !== initial, busy)
  const cancel = () => requestExit(onCancel)
  const title = readOnly
    ? local
      ? 'Detalhes do local'
      : 'Detalhes do turno'
    : entry
      ? local
        ? 'Editar local'
        : 'Editar turno'
      : local
        ? 'Adicionar local'
        : 'Adicionar turno'
  function update(key: keyof InstitutionInput, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || readOnly) return
    const validation = validateInstitution(form, kind)
    setErrors(validation)
    setError('')
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    setConfirming(true)
  }
  async function save() {
    if (busy) return
    setBusy(true)
    try {
      await onSubmit(form)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o registro.')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }
  function fieldError(key: keyof InstitutionInput) {
    return (
      errors[key] && (
        <p id={'institution-' + key + '-error'} className={styles.error} role="alert">
          {t(errors[key]!)}
        </p>
      )
    )
  }
  function input(key: 'name' | 'startTime' | 'endTime', label: string, maxLength: number) {
    return (
      <div className={styles.field}>
        <label htmlFor={'institution-' + key}>{t(label)} *</label>
        <input
          id={'institution-' + key}
          value={form[key]}
          onChange={(event) => update(key, event.target.value)}
          readOnly={readOnly}
          required
          maxLength={maxLength}
          autoFocus={key === 'name'}
          placeholder={key === 'name' ? undefined : 'HH:MM'}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? 'institution-' + key + '-error' : undefined}
        />
        {fieldError(key)}
      </div>
    )
  }
  return (
    <div className={styles.page}>
      <button
        className={styles.back}
        type="button"
        onClick={cancel}
        disabled={busy}
        aria-label={t('Voltar para instituição')}
      >
        <FigmaIcon name="back" />
      </button>
      <h1 className={styles.title}>{t(title)}</h1>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className="sr-only">{t(title)}</legend>
          <div className={styles.grid}>
            {input('name', 'Nome', 100)}
            <div className={styles.field}>
              <label htmlFor="institution-unitId">{t('Unidade de trabalho')} *</label>
              <select
                id="institution-unitId"
                value={form.unitId}
                disabled={readOnly || units.length === 1 || Boolean(entry)}
                required
                onChange={(event) => update('unitId', event.target.value)}
                aria-invalid={Boolean(errors.unitId)}
                aria-describedby={errors.unitId ? 'institution-unitId-error' : undefined}
              >
                <option value="">{t('Selecione uma unidade de trabalho')}</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id} disabled={!unit.active}>
                    {unit.name || t('Minha unidade')}
                  </option>
                ))}
              </select>
              {fieldError('unitId')}
            </div>
            {local ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="institution-locationType">{t('Tipo de local')} *</label>
                  <select
                    id="institution-locationType"
                    value={form.locationType}
                    disabled={readOnly}
                    onChange={(event) => update('locationType', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.locationType)}
                    aria-describedby={
                      errors.locationType ? 'institution-locationType-error' : undefined
                    }
                  >
                    <option value="">{t('Selecione um tipo de local')}</option>
                    {locationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t(type.label)}
                      </option>
                    ))}
                  </select>
                  {fieldError('locationType')}
                </div>
                <div className={`${styles.field} ${styles.description}`}>
                  <label htmlFor="institution-description">{t('Descrição')} *</label>
                  <textarea
                    id="institution-description"
                    value={form.description}
                    onChange={(event) => update('description', event.target.value)}
                    readOnly={readOnly}
                    required
                    maxLength={255}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                      errors.description ? 'institution-description-error' : undefined
                    }
                  />
                  {fieldError('description')}
                </div>
              </>
            ) : (
              <>
                {input('startTime', 'Horário de início', 8)}
                {input('endTime', 'Horário de término', 8)}
                {shiftSeconds(form.endTime) < shiftSeconds(form.startTime) && (
                  <p className={styles.overnight}>{t('Término no dia seguinte')}</p>
                )}
              </>
            )}
          </div>
        </fieldset>
        {error && (
          <p className={styles.error} role="alert">
            {t(error)}
          </p>
        )}
        <div className={styles.formActions}>
          <button className={styles.secondary} type="button" onClick={cancel} disabled={busy}>
            {t(readOnly ? 'Voltar' : 'Cancelar')}
          </button>
          {readOnly ? (
            <button className={styles.primary} type="button" onClick={onEdit}>
              {t(local ? 'Editar local' : 'Editar turno')}
            </button>
          ) : (
            <button className={styles.primary} type="submit" disabled={busy}>
              {t(busy ? 'Salvando…' : 'Salvar')}
            </button>
          )}
        </div>
      </form>
      <ConfirmDialog
        opened={confirming}
        variant="save"
        confirmLabel="Salvar"
        onClose={() => setConfirming(false)}
        onConfirm={() => void save()}
        busy={busy}
      />
    </div>
  )
}
