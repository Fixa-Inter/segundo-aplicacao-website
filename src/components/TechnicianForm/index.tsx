import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { saveTechnician } from '../../services/managementService'
import type { Address, TechnicianInput } from '../../types/management'
import type { TechnicianFormProps } from '../../types/ui'
import { validateDemoPassword, validateTechnician } from '../../utils/managementValidation'
import { formatDate, parseDateInput } from '../../utils/calendar'
import { DemoBadge } from '../DemoBadge'
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

export function TechnicianForm({ technician, manager, onSaved, onCancel }: TechnicianFormProps) {
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
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [errors, setErrors] = useState<Partial<Record<keyof TechnicianInput, string>>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function renderField(field: (typeof fields)[number]) {
    const id = `technician-${field.key}`
    return (
      <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
        <label htmlFor={id}>{field.label} *</label>
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
              ? 'DD/MM/AAAA'
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
            {errors[field.key]}
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
    setErrors(validation)
    setPasswordError(invalidPassword)
    setError('')
    if (Object.keys(validation).length || invalidPassword) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }
    setBusy(true)
    try {
      // A senha apenas valida o formulário demonstrativo e nunca é enviada ao repositório em memória.
      const saved = await saveTechnician(input, technician?.id)
      setPassword('')
      onSaved(saved)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o técnico.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <button
        className={styles.back}
        type="button"
        onClick={onCancel}
        disabled={busy}
        aria-label="Voltar para equipe"
      >
        <ArrowLeft size={28} />
      </button>
      <h1 className={styles.title}>
        <span>{technician ? 'Edite os dados' : 'Adicione um novo'}</span>{' '}
        {technician ? 'do funcionário' : 'funcionário'}
      </h1>
      <DemoBadge>Cadastro demonstrativo · alterações até recarregar</DemoBadge>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
        <p className={styles.note}>
          Use dados fictícios. Nenhuma conta ou senha real será criada. Os campos com * são
          obrigatórios nesta demonstração.
        </p>
        <fieldset disabled={busy}>
          <legend className={styles.srOnly}>
            Informações do técnico e endereço herdado do gestor
          </legend>
          <div className={`${styles.grid} ${technician ? styles.edit : ''}`}>
            {fields.slice(0, 3).map(renderField)}
            {!technician && (
              <div className={`${styles.field} ${styles.password}`}>
                <label htmlFor="technician-password">Senha de demonstração *</label>
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
                    aria-label={
                      passwordVisible
                        ? 'Ocultar senha de demonstração'
                        : 'Mostrar senha de demonstração'
                    }
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
                  {passwordError}
                </span>
              </div>
            )}
            {renderField(fields[3])}
            <div className={`${styles.field} ${styles.access}`}>
              <label htmlFor="technician-access">Tipo de acesso</label>
              <input
                id="technician-access"
                value="TÉCNICO"
                readOnly
                aria-describedby="technician-access-note"
              />
            </div>
            {addressFields.map((field) => (
              <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
                <label htmlFor={`technician-${field.key}`}>{field.label}</label>
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
          {!technician && (
            <p id="technician-password-rule" className={styles.note}>
              Senha: regra provisória de no mínimo 8 caracteres, maiúscula, minúscula e símbolo
              especial. A senha não é armazenada.
            </p>
          )}
          <p id="technician-access-note" className={styles.note}>
            O tipo TÉCNICO é definido automaticamente pelo cadastro do gestor.
          </p>
          <p id="technician-address-note" className={styles.note}>
            O endereço de {manager.name} será aplicado ao salvar e não pode ser alterado neste
            cadastro.
          </p>
        </div>
        <fieldset disabled={busy}>
          <legend>Informações operacionais da demonstração</legend>
          <div className={styles.operational}>
            {fields.slice(4).map(renderField)}
            <div className={styles.field}>
              <label htmlFor="technician-status">Situação</label>
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
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className={styles.save} type="submit" disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
