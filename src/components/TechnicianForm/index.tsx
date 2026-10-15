import { ConfirmDialog } from '../ConfirmDialog'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import { hasFormChanges } from '../../utils/formChanges'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import { useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Address, TechnicianInput } from '../../types/management'
import type {
  TechnicianFormFieldsProps,
  TechnicianFormProps,
  TechnicianSubmission,
} from '../../types/ui'
import type { CompetencyInput } from '../../types/competency'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import { parseCompetencyRating } from '../../utils/competencies'
import { validateDemoPassword, validateTechnician } from '../../utils/managementValidation'
import { formatDate, parseDateInput } from '../../utils/calendar'
import styles from './TechnicianForm.module.css'

const fields: {
  key: Exclude<keyof TechnicianInput, 'status'>
  label: string
  type?: 'text' | 'email' | 'tel'
  maxLength?: number
}[] = [
  { key: 'name', label: 'Nome completo', maxLength: 80 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 120 },
  { key: 'phone', label: 'Telefone', type: 'tel', maxLength: 20 },
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

  const [form, setForm] = useState<TechnicianInput>({
    name: technician?.name ?? '',
    birthDate: technician?.birthDate ?? '',
    email: technician?.email ?? '',
    phone: technician?.phone ?? '',
    specialty: technician?.specialty ?? '',
    shift: technician?.shift ?? '08:00 - 16:00',
    status: technician?.status ?? 'Ativo',
  })
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
  const [ratingErrors, setRatingErrors] = useState<Record<string, string>>({})
  const [initial] = useState(() => ({ ...form, birthDateText: birthDate, password }))
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [errors, setErrors] = useState<Partial<Record<keyof TechnicianInput, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState<TechnicianSubmission | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isDirty =
    hasFormChanges({ ...form, birthDateText: birthDate, password }, initial) ||
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
          value={field.key === 'birthDate' ? birthDate : form[field.key]}
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
    const input = { ...form, birthDate: parseDateInput(birthDate) }
    const validation = validateTechnician(input)
    const invalidPassword = technician ? undefined : validateDemoPassword(password)
    const competencies: CompetencyInput[] = []
    const invalidRatings: Record<string, string> = {}
    for (const item of initialCompetencies) {
      const rating = parseCompetencyRating(ratings[item.id])
      if (rating === undefined) invalidRatings[item.id] = 'Informe uma nota inteira de 0 a 10.'
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
      // A senha apenas valida o formulário demonstrativo e nunca é enviada ao repositório em memória.
      const saved = await onSubmit(input, competencies)
      setPassword('')
      onSaved(saved)
    } catch (reason) {
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
      <h1 className={styles.title}>
        <span>{t(technician ? 'Edite' : 'Adicione um novo')}</span>{' '}
        {technician ? technician.name : t('funcionário')}
      </h1>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className={styles.srOnly}>
            {t('Informações do técnico e endereço herdado do gestor')}
          </legend>
          <div className={`${styles.grid} ${technician ? styles.edit : ''}`}>
            {fields.slice(0, 3).map(renderField)}
            {!technician && (
              <div className={`${styles.field} ${styles.password}`}>
                <label htmlFor="technician-password">{t('Senha de demonstração *')}</label>
                <span className={styles.passwordField}>
                  <input
                    id="technician-password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    autoComplete="off"
                    maxLength={128}
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
                    aria-label={t(
                      passwordVisible
                        ? 'Ocultar senha de demonstração'
                        : 'Mostrar senha de demonstração',
                    )}
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
            {renderField(fields[3])}
            <div className={`${styles.field} ${styles.access}`}>
              <label htmlFor="technician-access">{t('Tipo de acesso')}</label>
              <input
                id="technician-access"
                value={t('TÉCNICO')}
                readOnly
                aria-describedby="technician-access-note"
              />
            </div>
            {addressFields.map((field) => (
              <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
                <label htmlFor={`technician-${field.key}`}>{t(field.label)}</label>
                <input
                  id={`technician-${field.key}`}
                  value={manager[field.key]}
                  readOnly
                  aria-describedby="technician-address-note"
                />
              </div>
            ))}
          </div>
        </fieldset>
        <div className={styles.rules}>
          <p className={styles.note}>
            {t(
              'Use dados fictícios. Nenhuma conta ou senha real será criada. Os campos com * são obrigatórios nesta demonstração.',
            )}
          </p>
          {!technician && (
            <p id="technician-password-rule" className={styles.note}>
              {t(
                'Senha: regra provisória de no mínimo 8 caracteres, maiúscula, minúscula e símbolo especial. A senha não é armazenada.',
              )}
            </p>
          )}
          <p id="technician-access-note" className={styles.note}>
            {t('O tipo TÉCNICO é definido automaticamente pelo cadastro do gestor.')}
          </p>
          <p id="technician-address-note" className={styles.note}>
            {t('O endereço de')}
            {manager.name} {t('será aplicado ao salvar e não pode ser alterado neste cadastro.')}
          </p>
        </div>
        <fieldset disabled={busy}>
          <legend>{t('Informações operacionais da demonstração')}</legend>
          <div className={styles.operational}>
            {fields.slice(4).map(renderField)}
            <div className={styles.field}>
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
          </div>
        </fieldset>
        <fieldset
          disabled={busy}
          className={styles.competencies}
          aria-describedby="technician-competencies-help"
        >
          <legend>{t('Competências')}</legend>
          <p id="technician-competencies-help" className={styles.note}>
            {t('Use uma nota inteira de 0 a 10. Deixe em branco para remover a avaliação.')}
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
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="_"
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
