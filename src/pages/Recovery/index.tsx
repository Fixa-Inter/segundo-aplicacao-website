import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PinInput } from '@mantine/core'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AuthField } from '../../components/AuthField'
import manu from '../../assets/figma/manu-recovery.png'
import manuCode from '../../assets/figma/manu-recovery-code.png'
import manuPassword from '../../assets/figma/manu-recovery-password.png'
import manuSuccess from '../../assets/figma/manu-recovery-success.png'
import {
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
  password: 'Defina sua nova senha',
  success: 'Demonstração concluída',
}
const artByStep: Record<RecoveryStep, string> = {
  email: manu,
  code: manuCode,
  password: manuPassword,
  success: manuSuccess,
}
const pageByStep: Record<RecoveryStep, string> = {
  email: styles.emailPage,
  code: styles.codePage,
  password: styles.passwordPage,
  success: styles.successPage,
}
export default function Recovery() {
  const [step, setStep] = useState<RecoveryStep>('email')
  const [form, setForm] = useState({ email: '', code: '', password: '', confirmation: '' })
  const [challenge, setChallenge] = useState<RecoveryChallenge | null>(null)
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
    if (step === 'password') {
      const passwordError = validateDemoPassword(form.password)
      if (passwordError) {
        setError(passwordError)
        return
      }
      if (form.password !== form.confirmation) {
        setError('As senhas não coincidem.')
        return
      }
    }
    setBusy(true)
    try {
      if (step === 'email') {
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
      setNotice(`Código de demonstração: ${DEMO_RECOVERY_CODE}. Nenhum e-mail real é enviado.`)
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
        ? 'Digite o código de 6 dígitos para continuar'
        : step === 'password'
          ? ''
          : 'Fluxo validado. Nenhuma senha real foi alterada.'
  return (
    <main className={`${styles.page} ${pageByStep[step]}`}>
      {step !== 'success' &&
        (step === 'email' ? (
          <Link to="/login" className={styles.back} aria-label="Voltar ao login">
            <ArrowLeft />
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            className={styles.back}
            onClick={back}
            aria-label="Voltar à etapa anterior"
          >
            <ArrowLeft />
          </button>
        ))}
      <section className={styles.content} aria-labelledby="recovery-title">
        <img
          className={styles.manu}
          src={artByStep[step]}
          width="760"
          height="760"
          alt="Manu ajudando na recuperação da senha"
        />
        <h1 ref={headingRef} id="recovery-title" tabIndex={-1}>
          {titles[step]}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
        {step === 'success' ? (
          <>
            <Link className={styles.primary} to="/login">
              Ir para o login
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
                    label="Email"
                    placeholder="Digite o seu e-mail"
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
                  <p className={styles.codeLabel}>Código</p>
                  {Array.from({ length: 6 }, (_, index) => (
                    <label
                      className={styles.srOnly}
                      htmlFor={`recovery-code-${index + 1}`}
                      key={`code-${index + 1}`}
                    >
                      Dígito {index + 1} do código
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
                    ariaLabel="Dígito do código de recuperação"
                    error={Boolean(error)}
                    classNames={{ root: styles.pinRoot, input: styles.pinInput }}
                    getInputProps={(index) => ({
                      id: `recovery-code-${index + 1}`,
                      'aria-label': `Dígito ${index + 1} do código`,
                    })}
                  />
                </div>
              )}
              {step === 'password' && (
                <div className={styles.passwordFields}>
                  <AuthField
                    id="new-password"
                    label="Nova senha"
                    type={visible ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder="Digite sua nova senha"
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
                        aria-label={visible ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                      >
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    }
                  />
                  <AuthField
                    id="confirm-password"
                    label="Confirme a nova senha"
                    type={visible ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder="Repita sua nova senha"
                    maxLength={128}
                    disabled={busy}
                    value={form.confirmation}
                    onChange={(event) => {
                      const confirmation = event.currentTarget.value
                      setForm((current) => ({ ...current, confirmation }))
                    }}
                  />
                </div>
              )}
              {step === 'password' && (
                <p className={styles.demoNote}>
                  Use uma senha fictícia. Regra provisória: mínimo de 8 caracteres, maiúscula,
                  minúscula e símbolo especial. A senha não é armazenada.
                </p>
              )}
              {step !== 'email' && error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button className={styles.primary} disabled={busy} type="submit">
                {busy
                  ? 'Aguarde…'
                  : step === 'email'
                    ? 'Enviar e-mail'
                    : step === 'code'
                      ? 'Confirmar código'
                      : 'Alterar senha'}
              </button>
            </form>
            {step === 'email' && (
              <Link className={styles.secondary} to="/login">
                Voltar ao login
              </Link>
            )}
            {step === 'email' && (
              <p className={styles.demoNote}>Demonstração: nenhum e-mail será enviado.</p>
            )}
            {step === 'code' && (
              <p className={styles.resend}>
                Não recebeu o código?{' '}
                <button type="button" disabled={busy} onClick={resend}>
                  Reenviar
                </button>
              </p>
            )}
            {step === 'code' && (
              <p className={styles.demoNote}>Código de demonstração: {DEMO_RECOVERY_CODE}</p>
            )}
            {notice && (
              <p className={styles.demoNote} role="status">
                {notice}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}
