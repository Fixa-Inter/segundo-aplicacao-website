import { usePreferences } from '../../contexts/usePreferences'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import { hasFormChanges } from '../../utils/formChanges'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FigmaIcon } from '../../components/FigmaIcon'
import { PageHeader } from '../../components/PageHeader'
import { getProfile, saveProfile } from '../../services/managementService'
import { useAuth } from '../../contexts/useAuth'
import type { ManagerProfile } from '../../types/management'
import { validateProfile } from '../../utils/apiValidation'
import { formatDate as formatDateInput, parseDateInput } from '../../utils/calendar'
import { InformationItem } from '../../components/InformationItem'
import { formatAddress, truncateText } from '../../utils/presentation'
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
const fields: {
  key: 'name' | 'email' | 'birthDate'
  label: string
  type?: string
  maxLength: number
}[] = [
  { key: 'name', label: 'Nome', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 100 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
]

export default function Profile() {
  const { t, formatDate } = usePreferences()

  const navigate = useNavigate()
  const [pending, setPending] = useState<ManagerProfile | null>(null)
  const { updateName, user } = useAuth()
  const [profile, setProfile] = useState<ManagerProfile>(empty)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ManagerProfile, string>>>({})
  const [birthDateText, setBirthDateText] = useState('')
  const [savedProfile, setSavedProfile] = useState<ManagerProfile>(empty)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const wasEditing = useRef(false)
  const isDirty =
    editing &&
    hasFormChanges(
      { ...profile, birthDateText },
      {
        ...savedProfile,
        birthDateText: savedProfile.birthDate
          ? formatDateInput(savedProfile.birthDate, { dateStyle: 'short' })
          : '',
      },
    )
  const requestExit = useUnsavedForm(isDirty, busy)

  function cancel() {
    requestExit(() => {
      setProfile({ ...savedProfile })
      setEditing(false)
      setFieldErrors({})
      setError('')
    })
  }

  useEffect(() => {
    if (editing) formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    else if (wasEditing.current) editButtonRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  useEffect(() => {
    let active = true
    getProfile()
      .then((data) => {
        if (active) {
          setProfile(data)
          setSavedProfile(data)
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
    if (savedProfile.birthDate && !birthDateText)
      errors.birthDate = 'A data de nascimento cadastrada não pode ser removida.'
    if (birthDateText && !input.birthDate)
      errors.birthDate = 'Informe a data no formato DD/MM/AAAA.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
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
      setSavedProfile(saved)
      updateName(saved.name)
      setEditing(false)
      setNotice('Perfil atualizado com sucesso.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o perfil.')
    } finally {
      setPending(null)
      setBusy(false)
    }
  }
  const address = formatAddress(profile)

  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader title={t(editing ? 'Editar Perfil' : 'Perfil')} />
      {notice && (
        <p role="status" className={common.status}>
          {t(notice)}
        </p>
      )}
      {error && (
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
            <div className={styles.identityText}>
              <h2 title={profile.name} aria-label={profile.name}>
                {truncateText(profile.name) || t('Não informado')}
              </h2>
              <p>
                {t(user?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Gestor')} ·{' '}
                {profile.company || t('Não informado')}
              </p>
            </div>
            {!editing && (
              <button
                className={common.primary}
                type="button"
                onClick={() => {
                  navigate('/alterar-senha')
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
                  <div className={common.field} key={field.key}>
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
                        const value = event.target.value
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
              <section className={styles.locationInfo} aria-label={t('Localização')}>
                <InformationItem
                  icon={<FigmaIcon name="location" />}
                  label={t('Localização')}
                  value={address || t('Não informado')}
                />
                <p>{t('A localização é gerenciada pelo administrador da unidade.')}</p>
              </section>
              <div className={common.formActions}>
                <button className={common.secondary} type="button" onClick={cancel} disabled={busy}>
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
                <InformationItem
                  icon={<FigmaIcon name="location" />}
                  label={t('Localização')}
                  value={address || t('Não informado')}
                />
                <InformationItem
                  icon={<FigmaIcon name="mail" />}
                  label={t('E-mail')}
                  value={profile.email || t('Não informado')}
                />
                <InformationItem
                  icon={<FigmaIcon name="profile-calendar" />}
                  label={t('Data de nascimento')}
                  value={
                    profile.birthDate
                      ? formatDate(profile.birthDate, { dateStyle: 'long' })
                      : t('Não informado')
                  }
                />
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
      <ConfirmDialog
        opened={Boolean(pending)}
        variant="save"
        subject={profile.name}
        confirmLabel="Salvar"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmSave}
      />
    </div>
  )
}
