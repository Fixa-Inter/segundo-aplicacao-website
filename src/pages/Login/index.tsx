import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent, type MouseEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import manu from '../../assets/figma/manu-login.png'
import { AuthField } from '../../components/AuthField'
import { Brand } from '../../components/Brand'
import { useAuth } from '../../contexts/useAuth'
import { usePreferences } from '../../contexts/usePreferences'
import { requestRecovery } from '../../services/recoveryService'
import type { LoginCredentials } from '../../types/auth'
import { validateEmail, validateLoginFields } from '../../utils/validation'
import styles from './Login.module.css'

export default function Login() {
  const { t } = usePreferences()

  const { user, login, loading, error } = useAuth()
  const [form, setForm] = useState<LoginCredentials>({ cnpj: '', email: '', password: '' })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  const errors = submitted ? validateLoginFields(form) : {}
  if (user) return <Navigate to="/" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (loading || recovering) return
    const invalid = Object.keys(validateLoginFields(form))[0]
    if (invalid) {
      event.currentTarget.querySelector<HTMLInputElement>(`#login-${invalid}`)?.focus()
      return
    }
    if (await login(form)) navigate('/', { replace: true })
  }
  async function forgot(event: MouseEvent<HTMLAnchorElement>) {
    if (recovering || loading) {
      event.preventDefault()
      return
    }
    if (validateEmail(form.email)) return
    event.preventDefault()
    setRecovering(true)
    setRecoveryError('')
    try {
      const challenge = await requestRecovery(form.email)
      navigate('/recuperar-senha', { state: { challenge } })
    } catch {
      setRecoveryError('Não foi possível continuar. Tente novamente.')
    } finally {
      setRecovering(false)
    }
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
      </header>
      <div className={styles.layout}>
        <section className={styles.formArea} aria-labelledby="login-title">
          <h1 id="login-title">{t('Login')}</h1>
          <form onSubmit={submit} noValidate aria-busy={loading || recovering}>
            <div className={styles.fields}>
              <AuthField
                id="login-cnpj"
                name="company-cnpj"
                label={t('CNPJ')}
                autoComplete="off"
                placeholder={t('Digite o CNPJ da empresa')}
                maxLength={18}
                required
                disabled={loading || recovering}
                value={form.cnpj}
                error={errors.cnpj}
                onChange={(event) => {
                  const value = event.currentTarget.value.toUpperCase()
                  setForm((current) => ({ ...current, cnpj: value }))
                }}
              />
              <AuthField
                id="login-email"
                name="username"
                label={t('E-mail')}
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('Digite o seu e-mail')}
                maxLength={100}
                required
                disabled={loading || recovering}
                value={form.email}
                error={errors.email}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setForm((current) => ({ ...current, email: value }))
                }}
              />
              <AuthField
                id="login-password"
                name="password"
                label={t('Senha')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('Coloque sua senha')}
                maxLength={128}
                required
                disabled={loading || recovering}
                value={form.password}
                error={errors.password}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setForm((current) => ({ ...current, password: value }))
                }}
                trailing={
                  <button
                    type="button"
                    aria-label={t(showPassword ? 'Ocultar senha' : 'Mostrar senha')}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>
            <div className={styles.forgot}>
              <Link to="/recuperar-senha" onClick={forgot} aria-disabled={recovering || loading}>
                {t('Esqueci minha senha')}
              </Link>
            </div>
            {(error || recoveryError) && (
              <p role="alert" className={styles.error}>
                {t(error || recoveryError)}
              </p>
            )}
            <button type="submit" disabled={loading || recovering} className={styles.submit}>
              {t(loading ? 'Entrando…' : 'Entrar')}
            </button>
            <Link className={styles.aboutLink} to="/sobre">
              {t('Conheça o projeto')}
            </Link>
          </form>
        </section>
        <img
          className={styles.manu}
          src={manu}
          width="658"
          height="620"
          alt={t('Manu, assistente do FIXA, dando boas-vindas')}
        />
      </div>
    </main>
  )
}
