import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import {
  changePassword,
  requestRecovery,
  resetPassword,
  verifyRecoveryCode,
} from '../services/recoveryService'
import type { RecoveryChallenge, RecoveryStep } from '../types/recovery'
import { validatePassword } from '../utils/apiValidation'
import { maskRecoveryEmail, readRecoveryChallenge } from '../utils/recovery'
import { validateEmail } from '../utils/validation'

export function useRecoveryPage() {
  const { t } = usePreferences()

  const { pathname, state } = useLocation()
  const { user, logout } = useAuth()
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
      const passwordError = validatePassword(form.password)
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
        await resetPassword(challenge, form.password, form.code)
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
      setNotice('Se o e-mail estiver cadastrado, um novo código será enviado.')
    } catch {
      setError('Não foi possível reenviar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  function getDescription() {
    if (step === 'email') return 'Insira seu e-mail para receber um código de recuperação'
    if (step === 'code')
      return t('Código de validação para {email}', { email: maskRecoveryEmail(form.email) })
    if (step === 'password' || step === 'change') return ''
    return 'Sua senha foi alterada com sucesso.'
  }
  const description = getDescription()

  return {
    t,
    user,
    logout,
    changing,
    returnTo,
    step,
    form,
    setForm,
    error,
    setError,
    notice,
    busy,
    visible,
    setVisible,
    headingRef,
    formRef,
    back,
    submit,
    resend,
    description,
  }
}
