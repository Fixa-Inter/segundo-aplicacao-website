import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@mantine/core'
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react'
import { DemoBadge } from '../../components/DemoBadge'
import { PageHeader } from '../../components/PageHeader'
import { getProfile, saveProfile } from '../../services/managementService'
import { useAuth } from '../../contexts/useAuth'
import type { ManagerProfile } from '../../types/management'
import { validateProfile } from '../../utils/managementValidation'
import { formatDate } from '../../utils/calendar'
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
  { key: 'birthDate', label: 'Data de nascimento', type: 'date' },
  { key: 'postalCode', label: 'CEP', maxLength: 9 },
  { key: 'address', label: 'Logradouro', maxLength: 100 },
  { key: 'district', label: 'Bairro', maxLength: 60 },
  { key: 'city', label: 'Cidade', maxLength: 60 },
  { key: 'state', label: 'Estado', maxLength: 2 },
  { key: 'number', label: 'Número', maxLength: 10 },
  { key: 'complement', label: 'Complemento', maxLength: 80 },
]

export default function Profile() {
  const { updateName } = useAuth()
  const [profile, setProfile] = useState<ManagerProfile>(empty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ManagerProfile, string>>>({})
  const [password, setPassword] = useState({ current: '', next: '', confirmation: '' })

  useEffect(() => {
    let active = true
    getProfile()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateProfile(profile)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError('')
    try {
      const saved = await saveProfile({
        ...profile,
        name: profile.name.trim(),
        email: profile.email.trim(),
        company: profile.company.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
      })
      setProfile(saved)
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
      return
    }
    if (password.next.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password.next !== password.confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setPassword({ current: '', next: '', confirmation: '' })
    setPasswordOpen(false)
    setNotice(
      'Formulário validado. Nenhuma credencial foi alterada: a API de autenticação ainda não existe.',
    )
  }
  const address = [profile.address, profile.number, profile.district, profile.city, profile.state]
    .filter(Boolean)
    .join(', ')

  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader
        title={editing ? 'Editar Perfil' : 'Perfil'}
        action={<DemoBadge>Conta demonstrativa</DemoBadge>}
      />
      {notice && (
        <p role="status" className={common.status}>
          {notice}
        </p>
      )}
      {error && !passwordOpen && (
        <p role="alert" className={common.error}>
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando perfil…</p>
      ) : (
        <>
          <div className={styles.identity}>
            <img src={avatar} width="88" height="88" alt="Avatar ilustrativo do perfil" />
            <div>
              <h2>{profile.name}</h2>
              <p>Administrador · {profile.company}</p>
            </div>
            {!editing && (
              <button
                className={common.primary}
                type="button"
                onClick={() => {
                  setError('')
                  setPasswordOpen(true)
                }}
              >
                Alterar senha
              </button>
            )}
          </div>
          {editing ? (
            <form className={styles.form} onSubmit={save} noValidate aria-busy={busy}>
              <div className={common.formGrid}>
                {fields.map((field) => (
                  <label className={common.field} key={field.key}>
                    {field.label}
                    <input
                      type={field.type ?? 'text'}
                      maxLength={field.maxLength}
                      value={profile[field.key]}
                      aria-invalid={Boolean(fieldErrors[field.key])}
                      onChange={(event) => {
                        const value =
                          field.key === 'state'
                            ? event.target.value.toUpperCase()
                            : event.target.value
                        setProfile((current) => ({ ...current, [field.key]: value }))
                        setFieldErrors((current) => ({ ...current, [field.key]: undefined }))
                      }}
                    />
                    {fieldErrors[field.key] && (
                      <span role="alert" className={common.error}>
                        {fieldErrors[field.key]}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className={common.formActions}>
                <button
                  className={common.secondary}
                  type="button"
                  onClick={async () => {
                    setProfile(await getProfile())
                    setEditing(false)
                    setFieldErrors({})
                  }}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button className={common.primary} type="submit" disabled={busy}>
                  {busy ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          ) : (
            <section className={styles.information} aria-label="Informações do perfil">
              <h3>Informações</h3>
              <div>
                <p>
                  <Mail size={18} aria-hidden="true" />
                  {profile.email}
                </p>
                <p>
                  <Phone size={18} aria-hidden="true" />
                  {profile.phone}
                </p>
                <p>
                  <CalendarDays size={18} aria-hidden="true" />
                  {profile.birthDate
                    ? formatDate(profile.birthDate, { dateStyle: 'long' })
                    : 'Não informado'}
                </p>
                <p>
                  <MapPin size={18} aria-hidden="true" />
                  {address}
                </p>
              </div>
              <button
                className={common.secondary}
                type="button"
                onClick={() => {
                  setError('')
                  setEditing(true)
                }}
              >
                Editar perfil
              </button>
            </section>
          )}
        </>
      )}
      <Modal
        opened={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Trocar senha"
        centered
      >
        <p className={common.muted}>Demonstração de validação. Nenhuma senha real será alterada.</p>
        <form onSubmit={validatePassword} noValidate>
          <div className={styles.passwordFields}>
            <label className={common.field}>
              Senha atual
              <input
                type="password"
                autoComplete="current-password"
                value={password.current}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, current: event.target.value }))
                }
              />
            </label>
            <label className={common.field}>
              Nova senha
              <input
                type="password"
                autoComplete="new-password"
                value={password.next}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, next: event.target.value }))
                }
              />
            </label>
            <label className={common.field}>
              Confirmar nova senha
              <input
                type="password"
                autoComplete="new-password"
                value={password.confirmation}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, confirmation: event.target.value }))
                }
              />
            </label>
          </div>
          {error && (
            <p role="alert" className={common.error}>
              {error}
            </p>
          )}
          <div className={common.formActions}>
            <button
              className={common.secondary}
              type="button"
              onClick={() => setPasswordOpen(false)}
            >
              Cancelar
            </button>
            <button className={common.primary} type="submit">
              Validar formulário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
