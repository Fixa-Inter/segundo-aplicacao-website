import type { RecoveryErrors, RecoveryForm, RecoveryStep } from '../types/recovery'
import { validatePassword } from './apiValidation.ts'
import { validateEmail } from './validation.ts'

export function validateRecoveryCode(code: string): string | undefined {
  return /^[1-9]\d{5}$/.test(code)
    ? undefined
    : 'Digite os seis dígitos do código recebido por e-mail.'
}

export function validateCurrentPassword(password: string): string | undefined {
  if (!password) return 'Informe a senha atual.'
  if (password.length > 100) return 'Use uma senha de 8 a 100 caracteres.'
}

export function validateRecoveryForm(form: RecoveryForm, step: RecoveryStep): RecoveryErrors {
  const errors: RecoveryErrors = {}
  if (step === 'email') errors.email = validateEmail(form.email) ?? undefined
  if (step === 'code') errors.code = validateRecoveryCode(form.code)
  if (step === 'change') errors.current = validateCurrentPassword(form.current)
  if (step === 'password' || step === 'change') errors.password = validatePassword(form.password)
  if (step === 'password' && form.password !== form.confirmation)
    errors.confirmation = 'As senhas não coincidem.'
  return errors
}
