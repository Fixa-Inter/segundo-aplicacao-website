import { ConfirmDialog } from '../ConfirmDialog'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import { hasFormChanges } from '../../utils/formChanges'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { listShifts, PartialSaveError } from '../../services/managementService'
import type { ShiftOption } from '../../types/management'
import type { Address, TechnicianInput } from '../../types/management'
import type {
  TechnicianFormFieldsProps,
  TechnicianFormProps,
  TechnicianSubmission,
} from '../../types/ui'
import type { CompetencyInput } from '../../types/competency'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import { getCompetencyPresentation, parseCompetencyRating } from '../../utils/competencies'
import { validatePassword, validateTechnician } from '../../utils/apiValidation'
import { formatDate, parseDateInput } from '../../utils/calendar'
import { truncateText } from '../../utils/presentation'
import styles from './TechnicianForm.module.css'

const fields: {
  key: Exclude<keyof TechnicianInput, 'status'>
  label: string
  type?: 'text' | 'email' | 'tel'
  maxLength?: number
}[] = [
  { key: 'name', label: 'Nome completo', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 100 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
  { key: 'jobTitle', label: 'Função', maxLength: 100 },
  { key: 'specialty', label: 'Especialidade', maxLength: 60 },
  { key: 'shift', label: 'Turno', maxLength: 13 },
]

const addressFields: { key: keyof Address; label: string }[] = [
  { key: 'postalCode', label: 'CEP' },
  { key: 'address', label: 'Logradouro' },
  { key: 'district', label: 'Bairro' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'number', label: 'Número' },
  { key: 'complement', label: 'Complemento' },
]

export function TechnicianForm(props: TechnicianFormProps) {
  const { t } = usePreferences()
  const { items, loading, error, retry } = useTechnicianCompetencies(props.technician?.id)
  if (loading || error)
    return (
      <div className={styles.page}>
        <button
          className={styles.back}
          type="button"
          onClick={props.onCancel}
          aria-label={t('Voltar para equipe')}
        >
          <FigmaIcon name="back" />
        </button>
        <h1 className={styles.title}>{t('Competências')}</h1>
        {loading ? (
          <p role="status">{t('Carregando competências…')}</p>
        ) : (
          <div role="alert">
            <p>{t(error)}</p>
            <button className={styles.retry} type="button" onClick={retry}>
              {t('Tentar novamente')}
            </button>
          </div>
        )}
      </div>
    )
  // O formulário só é montado após a leitura, preservando a base real do isDirty.
  return <TechnicianFormFields {...props} initialCompetencies={items} />
}

function TechnicianFormFields({
  technician,
  manager,
  onSubmit,
  onSaved,
  onCancel,
  initialCompetencies,
}: TechnicianFormFieldsProps) {
  const { t } = usePreferences()

  const linkedShiftIds = [
    ...new Set(technician?.shiftIds ?? (technician?.shiftId ? [technician.shiftId] : [])),
  ]
  const selectedShiftId = linkedShiftIds.length === 1 ? linkedShiftIds[0] : ''
  const [form, setForm] = useState<TechnicianInput>({
    name: technician?.name ?? '',
    birthDate: technician?.birthDate ?? '',
    email: technician?.email ?? '',
    phone: '',
    jobTitle: technician?.jobTitle ?? 'Técnico de manutenção',
    shiftId: selectedShiftId,
    shiftIds: linkedShiftIds,
    specialty: technician?.specialty ?? '',
    shift: technician?.shift ?? '08:00 - 16:00',
    status: technician?.status ?? 'Ativo',
  })
  const addressSource = technician ?? manager
  const [persistedId, setPersistedId] = useState<string | undefined>(technician?.id)
  const [shifts, setShifts] = useState<ShiftOption[]>([])
  const [shiftError, setShiftError] = useState('')
  const [shiftAttempt, setShiftAttempt] = useState(0)
  useEffect(() => {
    let active = true
    listShifts(technician?.unitId)
      .then((items) => {
        if (active) {
          setShifts(items)
          setShiftError('')
        }
      })
      .catch((reason) => {
        if (active)
          setShiftError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar os turnos.',
          )
      })
    return () => {
      active = false
    }
  }, [shiftAttempt, technician?.unitId])
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState(
    technician ? formatDate(technician.birthDate, { dateStyle: 'short' }) : '',
  )
  const [ratings, setRatings] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialCompetencies.map((item) => [item.id, item.rating === null ? '' : String(item.rating)]),
    ),
  )
  const [initialRatings] = useState(() => ({ ...ratings }))
  const draftSpecialty =
    getCompetencyPresentation(
      initialCompetencies.map((item) => ({
        ...item,
        rating: parseCompetencyRating(ratings[item.id]) ?? null,
      })),
    ).highlights[0]?.name ?? ''
  const [ratingErrors, setRatingErrors] = useState<Record<string, string>>({})
  const [initial] = useState(() => ({
    form: JSON.stringify(form),
    birthDateText: birthDate,
    password,
  }))
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [errors, setErrors] = useState<Partial<Record<keyof TechnicianInput, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState<TechnicianSubmission | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isDirty =
    hasFormChanges({ form: JSON.stringify(form), birthDateText: birthDate, password }, initial) ||
    hasFormChanges(ratings, initialRatings)
  const requestExit = useUnsavedForm(isDirty, busy)
  const cancel = () => requestExit(onCancel)

  function renderField(field: (typeof fields)[number]) {
    const id = `technician-${field.key}`
    return (
      <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
        <label htmlFor={id}>{t(field.label)} *</label>
        <input
          id={id}
          type={field.type ?? 'text'}
          value={field.key === 'birthDate' ? birthDate : String(form[field.key] ?? '')}
          autoComplete="off"
          autoFocus={field.key === 'name'}
          required
          maxLength={field.maxLength}
          inputMode={field.key === 'birthDate' ? 'numeric' : undefined}
          placeholder={
            field.key === 'birthDate'
              ? t('DD/MM/AAAA')
              : field.key === 'shift'
                ? '08:00 - 16:00'
                : undefined
          }
          aria-invalid={Boolean(errors[field.key])}
          aria-describedby={errors[field.key] ? `${id}-error` : undefined}
          onChange={(event) => {
            const value = event.currentTarget.value
            if (field.key === 'birthDate') setBirthDate(value)
            else setForm((current) => ({ ...current, [field.key]: value }))
            setErrors((current) => ({ ...current, [field.key]: undefined }))
          }}
        />
        {errors[field.key] && (
          <span id={`${id}-error`} className={styles.error} role="alert">
            {t(errors[field.key] ?? '')}
          </span>
        )}
      </div>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const input = {
      ...form,
      specialty: draftSpecialty,
      birthDate: parseDateInput(birthDate),
      password: persistedId ? undefined : password,
    }
    const validation = validateTechnician(input)
    const invalidPassword = persistedId ? undefined : validatePassword(password)
    const competencies: CompetencyInput[] = []
    const invalidRatings: Record<string, string> = {}
    for (const item of initialCompetencies) {
      const rating = parseCompetencyRating(ratings[item.id])
      if (rating === undefined)
        invalidRatings[item.id] = 'Informe uma nota de 0 a 10, com até duas casas decimais.'
      else competencies.push({ competencyId: item.id, rating })
    }
    setRatingErrors(invalidRatings)
    setErrors(validation)
    setPasswordError(invalidPassword)
    setError('')
    if (Object.keys(validation).length || invalidPassword || Object.keys(invalidRatings).length) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }
    setPending({ input, competencies })
  }

  async function confirmSave() {
    if (!pending || busy) return
    const { input, competencies } = pending
    setBusy(true)
    try {
      const saved = await onSubmit(input, competencies, persistedId)
      setPassword('')
      onSaved(saved)
    } catch (reason) {
      if (reason instanceof PartialSaveError) {
        setPersistedId(reason.resourceId)
        setPassword('')
      }
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o técnico.')
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
        aria-label={t('Voltar para equipe')}
      >
        <FigmaIcon name="back" />
      </button>
      <h1 className={styles.title} title={technician?.name}>
        <span>{t(technician ? 'Edite' : 'Adicione um novo')}</span>{' '}
        {technician ? truncateText(technician.name) : t('funcionário')}
      </h1>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className={styles.srOnly}>{t('Informações do técnico')}</legend>
          <div className={styles.grid}>
            {fields.slice(0, 3).map(renderField)}
            {renderField(fields[3])}
            <div className={`${styles.field} ${styles.access}`}>
              <label htmlFor="technician-access">{t('Cargo')}</label>
              <input id="technician-access" value={t('Técnico')} readOnly />
            </div>
            <div className={`${styles.field} ${styles.specialty}`}>
              <label htmlFor="technician-specialty">{t('Especialidade')}</label>
              <input id="technician-specialty" value={t(draftSpecialty || 'Sem notas')} readOnly />
            </div>
            <div className={`${styles.field} ${styles.shift}`}>
              <label htmlFor="technician-shift">{t('Turno')} *</label>
              <select
                id="technician-shift"
                value={form.shiftId ?? ''}
                required
                disabled={busy || !shifts.length}
                aria-invalid={Boolean(errors.shiftId)}
                aria-describedby={errors.shiftId ? 'technician-shift-error' : undefined}
                onChange={(event) => {
                  const shiftId = event.currentTarget.value
                  setForm((current) => ({
                    ...current,
                    shiftId,
                    shiftIds: shiftId ? [shiftId] : [],
                  }))
                  setErrors((current) => ({ ...current, shiftId: undefined }))
                }}
              >
                <option value="" disabled>
                  {t('Selecione um turno')}
                </option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
              {!shifts.length && !shiftError && (
                <p>{t('Nenhum turno ativo cadastrado na unidade.')}</p>
              )}
              {shiftError && (
                <div role="alert">
                  <p>{t(shiftError)}</p>
                  <button type="button" onClick={() => setShiftAttempt((value) => value + 1)}>
                    {t('Tentar novamente')}
                  </button>
                </div>
              )}
              {errors.shiftId && (
                <p id="technician-shift-error" role="alert" className={styles.error}>
                  {t(errors.shiftId)}
                </p>
              )}
            </div>
            <div className={`${styles.field} ${styles.status}`}>
              <label htmlFor="technician-status">{t('Situação')}</label>
              <select
                id="technician-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as TechnicianInput['status'],
                  }))
                }
              >
                <option value="Ativo">{t('Ativo')}</option>
                <option value="Inativo">{t('Inativo')}</option>
              </select>
            </div>
            {!technician && (
              <div className={`${styles.field} ${styles.password}`}>
                <label htmlFor="technician-password">{t('Senha inicial *')}</label>
                <span className={styles.passwordField}>
                  <input
                    id="technician-password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    autoComplete="off"
                    maxLength={100}
                    required
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby="technician-password-rule technician-password-error"
                    onChange={(event) => {
                      setPassword(event.currentTarget.value)
                      setPasswordError(undefined)
                    }}
                  />
                  <button
                    type="button"
                    aria-label={t(passwordVisible ? 'Ocultar senha' : 'Mostrar senha')}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((current) => !current)}
                  >
                    {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
                <span
                  id="technician-password-error"
                  className={styles.error}
                  role={passwordError ? 'alert' : undefined}
                >
                  {t(passwordError ?? '')}
                </span>
              </div>
            )}
            {(addressSource.address ? addressFields : []).map((field) => (
              <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
                <label htmlFor={`technician-${field.key}`}>{t(field.label)}</label>
                <input id={`technician-${field.key}`} value={addressSource[field.key]} readOnly />
              </div>
            ))}
          </div>
        </fieldset>
        {!technician && (
          <p id="technician-password-rule" className={styles.note}>
            {t('Senha inicial: de 8 a 100 caracteres.')}
          </p>
        )}
        <fieldset
          disabled={busy}
          className={styles.competencies}
          aria-describedby="technician-competencies-help"
        >
          <legend>{t('Competências')}</legend>
          <p id="technician-competencies-help" className={styles.srOnly}>
            {t(
              'Use uma nota de 0 a 10, com até duas casas decimais. Deixe em branco para remover a avaliação.',
            )}
          </p>
          <div className={styles.competencyGrid}>
            {initialCompetencies.map((item) => {
              const id = `technician-competency-${item.id}`
              return (
                <div className={styles.competencyField} key={item.id}>
                  <label htmlFor={id}>{t(item.name)}</label>
                  <div className={styles.scoreInput}>
                    <input
                      id={id}
                      type="text"
                      inputMode="decimal"
                      maxLength={5}
                      value={ratings[item.id]}
                      aria-invalid={Boolean(ratingErrors[item.id])}
                      aria-describedby={
                        ratingErrors[item.id]
                          ? `${id}-error technician-competencies-help`
                          : 'technician-competencies-help'
                      }
                      onChange={(event) => {
                        const value = event.currentTarget.value
                        setRatings((current) => ({ ...current, [item.id]: value }))
                        setRatingErrors((current) => ({ ...current, [item.id]: '' }))
                      }}
                    />
                    <span aria-hidden="true">/10</span>
                  </div>
                  {ratingErrors[item.id] && (
                    <p id={`${id}-error`} className={styles.error} role="alert">
                      {t(ratingErrors[item.id])}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className={styles.error}>
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
        subject={form.name}
        confirmLabel="Salvar"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmSave}
      />
    </div>
  )
}
