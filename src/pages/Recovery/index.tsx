import { FigmaIcon } from '../../components/FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { readRecoveryChallenge, maskRecoveryEmail } from '../../utils/recovery'
import manuChange from '../../assets/figma/manu-change-password.png'
import { PinInput } from '@mantine/core'
import { Eye, EyeOff } from 'lucide-react'
import { AuthField } from '../../components/AuthField'
import manu from '../../assets/figma/manu-recovery.png'
import manuCode from '../../assets/figma/manu-recovery-code.png'
import manuPassword from '../../assets/figma/manu-recovery-password.png'
import manuSuccess from '../../assets/figma/manu-recovery-success.png'
import {
  changePassword,
  DEMO_RECOVERY_CODE,
  requestRecovery,
  resetPassword,
  verifyRecoveryCode,
} from '../../services/recoveryService'
import { validateEmail } from '../../utils/validation'
import { validateDemoPassword } from '../../utils/managementValidation'
import type { RecoveryChallenge, RecoveryStep } from '../../types/recovery'
import styles from './Recovery.module.css'

const titles: Record<RecoveryStep, string> = {
  email: 'Esqueceu sua senha?',
  code: 'Verifique seu e-mail',
  password: 'Defina uma nova senha',
  change: 'Troque sua senha',
  success: 'Senha validada!',
}
const artByStep: Record<RecoveryStep, string> = {
  email: manu,
  code: manuCode,
  password: manuPassword,
  change: manuChange,
  success: manuSuccess,
}
export default function Recovery() {
  const { t } = usePreferences()

  const { pathname, state } = useLocation()
  const { user } = useAuth()
  const changing = pathname === '/alterar-senha'
  const returnTo = user ? '/perfil' : '/login'
  const [entry] = useState(() => readRecoveryChallenge(state))
  const [step, setStep] = useState<RecoveryStep>(changing ? 'change' : entry ? 'code' : 'email')
  const [form, setForm] = useState({
    email: entry?.email ?? '',
    code: '',
    password: '',
    confirmation: '',
    current: '',
  })
  const [challenge, setChallenge] = useState<RecoveryChallenge | null>(entry)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!error || busy) return
    const input =
      error === 'As senhas não coincidem.'
        ? formRef.current?.querySelector<HTMLInputElement>('#confirm-password')
        : formRef.current?.querySelector<HTMLInputElement>('input')
    input?.focus()
  }, [error, busy])
  useEffect(() => {
    if (step !== 'email') headingRef.current?.focus()
  }, [step])
  function back() {
    setError(null)
    setNotice('')
    setStep(step === 'password' ? 'code' : 'email')
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (step === 'email') {
      const message = validateEmail(form.email)
      if (message) {
        setError(message)
        return
      }
    }
    if (step === 'code' && form.code.length !== 6) {
      setError('Digite os seis dígitos do código.')
      return
    }
    if (step === 'change' && !form.current) {
      setError('Informe a senha atual.')
      return
    }
    if (step === 'password' || step === 'change') {
      const passwordError = validateDemoPassword(form.password)
      if (passwordError) {
        setError(passwordError)
        return
      }
      if (step === 'password' && form.password !== form.confirmation) {
        setError('As senhas não coincidem.')
        return
      }
    }
    setBusy(true)
    try {
      if (step === 'change') {
        await changePassword(form.current, form.password)
        setForm((current) => ({ ...current, current: '', password: '', confirmation: '' }))
        setStep('success')
      } else if (step === 'email') {
        setChallenge(await requestRecovery(form.email))
        setStep('code')
      } else if (step === 'code' && challenge) {
        await verifyRecoveryCode(challenge, form.code)
        setStep('password')
      } else if (step === 'password' && challenge) {
        await resetPassword(challenge, form.password)
        setForm((current) => ({ ...current, password: '', confirmation: '' }))
        setStep('success')
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Não foi possível continuar. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function resend() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      setChallenge(await requestRecovery(form.email))
      setNotice('Código de demonstração: 123456. Nenhum e-mail real é enviado.')
    } catch {
      setError('Não foi possível reenviar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  const description =
    step === 'email'
      ? 'Insira seu e-mail para simular o envio de um código de recuperação'
      : step === 'code'
        ? t('Código de validação para {email}', { email: maskRecoveryEmail(form.email) })
        : step === 'password' || step === 'change'
          ? ''
          : 'Fluxo validado. Nenhuma senha real foi alterada.'
  return (
    <main className={styles.page}>
      {step !== 'success' &&
        (step === 'email' || step === 'change' ? (
          <Link
            to={returnTo}
            className={styles.back}
            aria-label={t(user ? 'Voltar ao perfil' : 'Voltar ao login')}
          >
            <FigmaIcon name="back" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            className={styles.back}
            onClick={back}
            aria-label={t('Voltar à etapa anterior')}
          >
            <FigmaIcon name="back" />
          </button>
        ))}
      <section className={styles.content} aria-labelledby="recovery-title">
        <header className={styles.heading}>
          <img
            className={styles.manu}
            src={artByStep[step]}
            width="760"
            height="760"
            alt={t('Manu ajudando na recuperação da senha')}
          />
          <h1 ref={headingRef} id="recovery-title" tabIndex={-1}>
            {t(titles[step])}
          </h1>
          {description && <p className={styles.description}>{t(description)}</p>}
        </header>
        {step === 'success' ? (
          <>
            <Link className={styles.primary} to={returnTo}>
              {t(user ? 'Voltar ao perfil' : 'Ir para o login')}
            </Link>
          </>
        ) : (
          <>
            <form
              ref={formRef}
              className={styles.form}
              onSubmit={submit}
              noValidate
              aria-busy={busy}
            >
              {step === 'email' && (
                <>
                  <AuthField
                    id="recovery-email"
                    label={t('Email')}
                    placeholder={t('Digite o seu e-mail')}
                    type="email"
                    autoComplete="off"
                    maxLength={120}
                    disabled={busy}
                    value={form.email}
                    error={error || undefined}
                    onChange={(event) => {
                      const email = event.currentTarget.value
                      setForm((current) => ({ ...current, email }))
                      setError(null)
                    }}
                  />
                </>
              )}
              {step === 'code' && (
                <div className={styles.codeGroup}>
                  <p className={styles.codeLabel}>{t('Código')}</p>
                  {Array.from({ length: 6 }, (_, index) => (
                    <label
                      className={styles.srOnly}
                      htmlFor={`recovery-code-${index + 1}`}
                      key={`code-${index + 1}`}
                    >
                      {t('Dígito')}
                      {index + 1} {t('do código')}
                    </label>
                  ))}
                  <PinInput
                    type="number"
                    length={6}
                    value={form.code}
                    onChange={(code) => {
                      setForm((current) => ({ ...current, code }))
                      setError(null)
                    }}
                    placeholder=""
                    oneTimeCode
                    disabled={busy}
                    ariaLabel={t('Dígito do código de recuperação')}
                    error={Boolean(error)}
                    classNames={{ root: styles.pinRoot, input: styles.pinInput }}
                    getInputProps={(index) => ({
                      id: `recovery-code-${index + 1}`,
                      'aria-label': t('Dígito {number} do código', { number: index + 1 }),
                    })}
                  />
                </div>
              )}
              {(step === 'password' || step === 'change') && (
                <div className={styles.passwordFields}>
                  {step === 'change' && (
                    <AuthField
                      id="current-password"
                      label={t('Senha antiga')}
                      type="password"
                      autoComplete="off"
                      maxLength={128}
                      value={form.current}
                      disabled={busy}
                      onChange={(event) => {
                        const current = event.currentTarget.value
                        setForm((form) => ({ ...form, current }))
                      }}
                    />
                  )}

                  <AuthField
                    id="new-password"
                    label={t('Nova senha')}
                    type={visible ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder={t('Digite sua nova senha')}
                    maxLength={128}
                    disabled={busy}
                    value={form.password}
                    onChange={(event) => {
                      const password = event.currentTarget.value
                      setForm((current) => ({ ...current, password }))
                    }}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setVisible((current) => !current)}
                        aria-label={t(visible ? 'Ocultar nova senha' : 'Mostrar nova senha')}
                      >
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    }
                  />
                  {step === 'password' && (
                    <AuthField
                      id="confirm-password"
                      label={t('Confirme a nova senha')}
                      type={visible ? 'text' : 'password'}
                      autoComplete="off"
                      placeholder={t('Repita sua nova senha')}
                      maxLength={128}
                      disabled={busy}
                      value={form.confirmation}
                      onChange={(event) => {
                        const confirmation = event.currentTarget.value
                        setForm((current) => ({ ...current, confirmation }))
                      }}
                    />
                  )}
                </div>
              )}
              {(step === 'password' || step === 'change') && (
                <p className={styles.demoNote}>
                  {t(
                    'Use uma senha fictícia. Regra provisória: mínimo de 8 caracteres, maiúscula, minúscula e símbolo especial. A senha não é armazenada.',
                  )}
                </p>
              )}
              {step !== 'email' && error && (
                <p className={styles.error} role="alert">
                  {t(error)}
                </p>
              )}
              <button className={styles.primary} disabled={busy} type="submit">
                {t(
                  busy
                    ? 'Aguarde…'
                    : step === 'email'
                      ? 'Enviar e-mail'
                      : step === 'code'
                        ? 'Confirmar código'
                        : step === 'change'
                          ? 'Alterar'
                          : 'Continuar',
                )}
              </button>
            </form>
            {step === 'change' && (
              <p className={styles.resend}>
                {t('Não lembra sua senha?')} <Link to="/recuperar-senha">{t('Enviar código')}</Link>
              </p>
            )}
            {step === 'email' && (
              <Link className={styles.secondary} to="/login">
                {t('Voltar ao login')}
              </Link>
            )}
            {step === 'email' && (
              <p className={styles.demoNote}>{t('Demonstração: nenhum e-mail será enviado.')}</p>
            )}
            {step === 'code' && (
              <p className={styles.resend}>
                {t('Não recebeu o código?')}{' '}
                <button type="button" disabled={busy} onClick={resend}>
                  {t('Reenviar')}
                </button>
              </p>
            )}
            {step === 'code' && (
              <p className={styles.demoNote}>
                {t('Código de demonstração:')} {DEMO_RECOVERY_CODE}
              </p>
            )}
            {notice && (
              <p className={styles.demoNote} role="status">
                {t(notice)}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}
