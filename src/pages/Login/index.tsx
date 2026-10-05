import { usePreferences } from '../../contexts/usePreferences'
import { useState, type FormEvent } from 'react'
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
  const identifierError =
    submitted && !form.identifier.trim() ? 'Informe seu e-mail ou CNPJ.' : undefined
  const passwordError = submitted && !form.password ? 'Informe sua senha.' : undefined
  if (user) return <Navigate to="/" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (loading) return
    if (!form.identifier.trim() || !form.password) {
      event.currentTarget
        .querySelector<HTMLInputElement>(form.identifier.trim() ? '#password' : '#identifier')
        ?.focus()
      return
    }
    if (await login(form)) navigate('/', { replace: true })
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
      </header>
      <div className={styles.layout}>
        <section className={styles.formArea} aria-labelledby="login-title">
          <h1 id="login-title">{t('Login')}</h1>
          <form onSubmit={submit} noValidate aria-busy={loading}>
            <div className={styles.fields}>
              <AuthField
                id="identifier"
                label={t('Email/CNPJ')}
                autoComplete="off"
                placeholder={t('Coloque seu Email/CNPJ')}
                maxLength={120}
                disabled={loading}
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
                disabled={loading}
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
              <Link to="/recuperar-senha">{t('Esqueci minha senha')}</Link>
            </div>
            {error && (
              <p role="alert" className={styles.error}>
                {t(error)}
              </p>
            )}
            <button type="submit" disabled={loading} className={styles.submit}>
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
