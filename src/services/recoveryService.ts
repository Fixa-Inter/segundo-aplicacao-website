import type { RecoveryChallenge } from '../types/recovery'
import { validatePassword } from '../utils/apiValidation.ts'
import { validateEmail } from '../utils/validation.ts'
import { validateCurrentPassword, validateRecoveryCode } from '../utils/recoveryValidation.ts'
import { api } from './api.ts'

export async function requestRecovery(email: string): Promise<RecoveryChallenge> {
  const error = validateEmail(email)
  if (error) throw new Error(error)
  await api.request('/auth/recuperar-senha', {
    method: 'POST',
    anonymous: true,
    data: { email: email.trim() },
  })
  return { id: 'email-recovery', email: email.trim() }
}

export async function verifyRecoveryCode(
  _challenge: RecoveryChallenge,
  code: string,
): Promise<void> {
  const error = validateRecoveryCode(code)
  if (error) throw new Error(error)
}
export async function resetPassword(
  challenge: RecoveryChallenge,
  password: string,
  code: string,
): Promise<void> {
  const error = validateEmail(challenge.email) ?? validatePassword(password)
  if (error) throw new Error(error)
  await verifyRecoveryCode(challenge, code)
  await api.request('/auth/recuperar-senha/confirmar', {
    method: 'POST',
    anonymous: true,
    data: { email: challenge.email, codigo: Number(code), novaSenha: password },
  })
}
export async function changePassword(current: string, next: string): Promise<void> {
  const error = validateCurrentPassword(current) ?? validatePassword(next)
  if (error) throw new Error(error)
  await api.request('/auth/alterar-senha', {
    method: 'POST',
    data: { senhaAtual: current, novaSenha: next, confirmarNovaSenha: next },
  })
}
