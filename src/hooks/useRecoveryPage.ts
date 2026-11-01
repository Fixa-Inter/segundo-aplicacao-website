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
import type {
  RecoveryChallenge,
  RecoveryErrors,
  RecoveryForm,
  RecoveryStep,
} from '../types/recovery'
import { maskRecoveryEmail, readRecoveryChallenge } from '../utils/recovery'
import { validateRecoveryForm } from '../utils/recoveryValidation'

export function useRecoveryPage() {
  const { t } = usePreferences()

  const { pathname, state } = useLocation()
  const { user, logout } = useAuth()
  const changing = pathname === '/alterar-senha'
  const returnTo = user ? '/perfil' : '/login'
  const [entry] = useState(() => readRecoveryChallenge(state))
  const [step, setStep] = useState<RecoveryStep>(changing ? 'change' : entry ? 'code' : 'email')
  const [form, setForm] = useState<RecoveryForm>({
    email: entry?.email ?? '',
    code: '',
    password: '',
    confirmation: '',
    current: '',
  })
  const [challenge, setChallenge] = useState<RecoveryChallenge | null>(entry)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RecoveryErrors>({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (busy) return
    const hasFields = Object.values(fieldErrors).some(Boolean)
    if (!error && !hasFields) return
    const frame = requestAnimationFrame(() => {
      const selector = hasFields ? '[aria-invalid="true"]' : 'input'
      formRef.current?.querySelector<HTMLInputElement>(selector)?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [error, fieldErrors, busy])
  useEffect(() => {
    if (step !== 'email') headingRef.current?.focus()
  }, [step])
  function updateField(key: keyof RecoveryForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setError(null)
  }
  function back() {
    setFieldErrors({})
    setError(null)
    setNotice('')
    setStep(step === 'password' ? 'code' : 'email')
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(null)
    const errors = validateRecoveryForm(form, step)
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return
    if ((step === 'code' || step === 'password') && !challenge) {
      setStep('email')
      return
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
    updateField,
    fieldErrors,
    error,
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
