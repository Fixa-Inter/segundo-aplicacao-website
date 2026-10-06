import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthField } from '../../components/AuthField'
import manuPassword from '../../assets/figma/manu-change-password.png'
import { FigmaIcon } from '../../components/FigmaIcon'
import { PageHeader } from '../../components/PageHeader'
import { getProfile, saveProfile } from '../../services/managementService'
import { useAuth } from '../../contexts/useAuth'
import type { ManagerProfile } from '../../types/management'
import { validateDemoPassword, validateProfile } from '../../utils/managementValidation'
import { formatDate as formatDateInput, parseDateInput } from '../../utils/calendar'
import avatar from '../../assets/figma/avatar.png'
import common from '../management.module.css'
import styles from './Profile.module.css'

const empty: ManagerProfile = {
  name: '',
  email: '',
  company: '',
  phone: '',
  birthDate: '',
  postalCode: '',
  address: '',
  district: '',
  city: '',
  state: '',
  number: '',
  complement: '',
}
const fields: { key: keyof ManagerProfile; label: string; type?: string; maxLength?: number }[] = [
  { key: 'name', label: 'Nome', maxLength: 80 },
  { key: 'company', label: 'Empresa', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 120 },
  { key: 'phone', label: 'Telefone', type: 'tel', maxLength: 20 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
  { key: 'postalCode', label: 'CEP', maxLength: 9 },
  { key: 'address', label: 'Logradouro', maxLength: 100 },
  { key: 'district', label: 'Bairro', maxLength: 60 },
  { key: 'city', label: 'Cidade', maxLength: 60 },
  { key: 'state', label: 'Estado', maxLength: 2 },
  { key: 'number', label: 'Número', maxLength: 10 },
  { key: 'complement', label: 'Complemento', maxLength: 80 },
]

export default function Profile() {
  const { t, formatDate } = usePreferences()

  const { updateName } = useAuth()
  const [profile, setProfile] = useState<ManagerProfile>(empty)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ManagerProfile, string>>>({})
  const [password, setPassword] = useState({ current: '', next: '', confirmation: '' })
  const [birthDateText, setBirthDateText] = useState('')
  const savedProfileRef = useRef<ManagerProfile>(empty)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const passwordButtonRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const wasEditing = useRef(false)

  useEffect(() => {
    if (editing) formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    else if (wasEditing.current) editButtonRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  function closePassword() {
    setPasswordOpen(false)
    setPassword({ current: '', next: '', confirmation: '' })
    setError('')
    requestAnimationFrame(() => passwordButtonRef.current?.focus())
  }

  useEffect(() => {
    let active = true
    getProfile()
      .then((data) => {
        if (active) {
          setProfile(data)
          savedProfileRef.current = data
        }
      })
      .catch(() => {
        if (active) setLoadError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadAttempt])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const input = { ...profile, birthDate: parseDateInput(birthDateText) }
    const errors = validateProfile(input)
    if (birthDateText && !input.birthDate)
      errors.birthDate = 'Informe a data no formato DD/MM/AAAA.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await saveProfile({
        ...input,
        name: profile.name.trim(),
        email: profile.email.trim(),
        company: profile.company.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
      })
      setProfile(saved)
      savedProfileRef.current = saved
      updateName(saved.name)
      setEditing(false)
      setNotice('Perfil atualizado nesta sessão de demonstração.')
    } catch {
      setError('Não foi possível atualizar o perfil.')
    } finally {
      setBusy(false)
    }
  }
  function validatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!password.current) {
      setError('Informe a senha atual.')
      event.currentTarget.querySelector<HTMLInputElement>('#profile-password-current')?.focus()
      return
    }
    const passwordError = validateDemoPassword(password.next)
    if (passwordError) {
      setError(passwordError)
      event.currentTarget.querySelector<HTMLInputElement>('#profile-password-next')?.focus()
      return
    }
    if (password.next !== password.confirmation) {
      setError('As senhas não coincidem.')
      event.currentTarget.querySelector<HTMLInputElement>('#profile-password-confirmation')?.focus()
      return
    }
    setPassword({ current: '', next: '', confirmation: '' })
    setPasswordOpen(false)
    requestAnimationFrame(() => passwordButtonRef.current?.focus())
    setNotice(
      'Formulário validado. Nenhuma credencial foi alterada: a API de autenticação ainda não existe.',
    )
  }
  const address = [profile.address, profile.number, profile.district, profile.city, profile.state]
    .filter(Boolean)
    .join(', ')

  if (passwordOpen) {
    return (
      <section className={styles.passwordPage} aria-labelledby="change-password-title">
        <button
          type="button"
          className={styles.passwordBack}
          onClick={closePassword}
          aria-label={t('Voltar ao perfil')}
        >
          <FigmaIcon name="back" />
        </button>
        <img className={styles.passwordManu} src={manuPassword} width="352" height="350" alt="" />
        <h1 id="change-password-title">{t('Troque sua senha')}</h1>
        <form onSubmit={validatePassword} noValidate>
          <div className={styles.passwordFields}>
            <AuthField
              id="profile-password-current"
              label={t('Senha antiga')}
              type="password"
              autoComplete="off"
              maxLength={128}
              value={password.current}
              autoFocus
              onChange={(event) =>
                setPassword((current) => ({ ...current, current: event.target.value }))
              }
            />
            <AuthField
              id="profile-password-next"
              label={t('Nova senha')}
              type="password"
              autoComplete="off"
              maxLength={128}
              value={password.next}
              onChange={(event) =>
                setPassword((current) => ({ ...current, next: event.target.value }))
              }
            />
            <AuthField
              id="profile-password-confirmation"
              label={t('Confirmar nova senha')}
              type="password"
              autoComplete="off"
              maxLength={128}
              value={password.confirmation}
              onChange={(event) =>
                setPassword((current) => ({ ...current, confirmation: event.target.value }))
              }
            />
          </div>
          {error && (
            <p role="alert" className={common.error}>
              {t(error)}
            </p>
          )}
          <button className={styles.passwordSubmit} type="submit">
            {t('Alterar')}
          </button>
          <p>
            {t('Não lembra sua senha?')} <Link to="/recuperar-senha">{t('Enviar código')}</Link>
          </p>
        </form>
      </section>
    )
  }
  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader title={t(editing ? 'Editar Perfil' : 'Perfil')} />
      {notice && (
        <p role="status" className={common.status}>
          {t(notice)}
        </p>
      )}
      {error && !passwordOpen && (
        <p role="alert" className={common.error}>
          {t(error)}
        </p>
      )}
      {loading ? (
        <p role="status">{t('Carregando perfil…')}</p>
      ) : loadError ? (
        <div role="alert" className={common.error}>
          <p>{t(loadError)}</p>
          <button
            className={common.secondary}
            type="button"
            onClick={() => {
              setLoadError('')
              setLoading(true)
              setLoadAttempt((current) => current + 1)
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.identity}>
            <img src={avatar} width="88" height="88" alt={t('Avatar ilustrativo do perfil')} />
            <div>
              <h2>{profile.name}</h2>
              <p>
                {t('Gestor ·')} {profile.company}
              </p>
            </div>
            {!editing && (
              <button
                ref={passwordButtonRef}
                className={common.primary}
                type="button"
                onClick={() => {
                  setError('')
                  setPasswordOpen(true)
                }}
              >
                {t('Alterar senha')}
              </button>
            )}
          </div>
          {editing ? (
            <form ref={formRef} className={styles.form} onSubmit={save} noValidate aria-busy={busy}>
              <div className={styles.profileGrid}>
                {fields.map((field) => (
                  <div className={`${common.field} ${styles[field.key]}`} key={field.key}>
                    <label htmlFor={`profile-${field.key}`}>{t(field.label)}</label>
                    <input
                      id={`profile-${field.key}`}
                      disabled={busy}
                      type={field.type ?? 'text'}
                      maxLength={field.maxLength}
                      value={field.key === 'birthDate' ? birthDateText : profile[field.key]}
                      placeholder={field.key === 'birthDate' ? t('DD/MM/AAAA') : undefined}
                      inputMode={field.key === 'birthDate' ? 'numeric' : undefined}
                      aria-invalid={Boolean(fieldErrors[field.key])}
                      aria-describedby={
                        fieldErrors[field.key] ? `profile-${field.key}-error` : undefined
                      }
                      onChange={(event) => {
                        const value =
                          field.key === 'state'
                            ? event.target.value.toUpperCase()
                            : event.target.value
                        if (field.key === 'birthDate') setBirthDateText(value)
                        else setProfile((current) => ({ ...current, [field.key]: value }))
                        setFieldErrors((current) => ({ ...current, [field.key]: undefined }))
                      }}
                    />
                    {fieldErrors[field.key] && (
                      <span id={`profile-${field.key}-error`} role="alert" className={common.error}>
                        {t(fieldErrors[field.key] ?? '')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className={common.formActions}>
                <button
                  className={common.secondary}
                  type="button"
                  onClick={() => {
                    setProfile({ ...savedProfileRef.current })
                    setEditing(false)
                    setFieldErrors({})
                  }}
                  disabled={busy}
                >
                  {t('Cancelar')}
                </button>
                <button className={common.primary} type="submit" disabled={busy}>
                  {t(busy ? 'Salvando…' : 'Salvar')}
                </button>
              </div>
            </form>
          ) : (
            <section className={styles.information} aria-label={t('Informações do perfil')}>
              <h3>{t('Informações')}</h3>
              <div>
                <p>
                  <FigmaIcon name="mail" />
                  {profile.email}
                </p>
                <p>
                  <FigmaIcon name="phone" />
                  {profile.phone}
                </p>
                <p>
                  <FigmaIcon name="profile-calendar" />
                  {profile.birthDate
                    ? formatDate(profile.birthDate, { dateStyle: 'long' })
                    : t('Não informado')}
                </p>
                <p>
                  <FigmaIcon name="location" />
                  {address}
                </p>
              </div>
              <button
                ref={editButtonRef}
                className={common.secondary}
                type="button"
                onClick={() => {
                  setError('')
                  setBirthDateText(
                    profile.birthDate
                      ? formatDateInput(profile.birthDate, { dateStyle: 'short' })
                      : '',
                  )
                  setEditing(true)
                }}
              >
                <FigmaIcon name="profile-edit" /> {t('Editar perfil')}
              </button>
            </section>
          )}
        </>
      )}
    </div>
  )
}
