import { requestRecovery } from '../../services/recoveryService'
import { validateEmail } from '../../utils/validation'
import { usePreferences } from '../../contexts/usePreferences'
import { useState, type FormEvent, type MouseEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { Brand } from '../../components/Brand'
import { AuthField } from '../../components/AuthField'
import manu from '../../assets/figma/manu-login.png'
import styles from './Login.module.css'

export default function Login() {
  const { t } = usePreferences()

  const { user, login, loading, error } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  const identifierError =
    submitted && !form.identifier.trim() ? 'Informe seu e-mail ou CNPJ.' : undefined
  const passwordError = submitted && !form.password ? 'Informe sua senha.' : undefined
  if (user) return <Navigate to="/" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (loading || recovering) return
    if (!form.identifier.trim() || !form.password) {
      event.currentTarget
        .querySelector<HTMLInputElement>(form.identifier.trim() ? '#password' : '#identifier')
        ?.focus()
      return
    }
    if (await login(form)) navigate('/', { replace: true })
  }
  async function forgot(event: MouseEvent<HTMLAnchorElement>) {
    if (recovering || loading) {
      event.preventDefault()
      return
    }
    if (validateEmail(form.identifier)) return
    event.preventDefault()
    setRecovering(true)
    setRecoveryError('')
    try {
      const challenge = await requestRecovery(form.identifier)
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
                id="identifier"
                label={t('Email/CNPJ')}
                autoComplete="off"
                placeholder={t('Coloque seu Email/CNPJ')}
                maxLength={120}
                disabled={loading || recovering}
                value={form.identifier}
                error={identifierError}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setForm((current) => ({ ...current, identifier: value }))
                }}
              />
              <AuthField
                id="password"
                label={t('Senha')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                placeholder={t('Coloque sua senha')}
                maxLength={128}
                disabled={loading || recovering}
                value={form.password}
                error={passwordError}
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
            <p className={styles.demo}>
              {t('Acesso demonstrativo. Qualquer identificação e senha não vazias abrem a sessão.')}
            </p>
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
