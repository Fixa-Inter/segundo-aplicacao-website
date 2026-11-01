import { useState, type FormEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import { requestRecovery } from '../services/recoveryService'
import type { LoginCredentials } from '../types/auth'
import { validateEmail, validateLoginFields } from '../utils/validation'

export function useLoginPage() {
  const { t } = usePreferences()

  const { user, login, loading, error } = useAuth()
  const [form, setForm] = useState<LoginCredentials>({ cnpj: '', email: '', password: '' })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  const errors = submitted ? validateLoginFields(form) : {}
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
  return {
    t,
    user,
    form,
    setForm,
    showPassword,
    setShowPassword,
    errors,
    loading,
    error,
    recovering,
    recoveryError,
    submit,
    forgot,
  }
}
