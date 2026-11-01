import type { RecoveryChallenge } from '../types/recovery'
import { validateEmail } from '../utils/validation.ts'
import { validatePassword } from '../utils/apiValidation.ts'
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
// Não existe endpoint para verificar isoladamente. A confirmação real ocorre com a nova senha.
export async function verifyRecoveryCode(
  _challenge: RecoveryChallenge,
  code: string,
): Promise<void> {
  if (!/^[1-9]\d{5}$/.test(code))
    throw new Error('Digite os seis dígitos do código recebido por e-mail.')
}
export async function resetPassword(
  challenge: RecoveryChallenge,
  password: string,
  code: string,
): Promise<void> {
  const error = validatePassword(password)
  if (error) throw new Error(error)
  await verifyRecoveryCode(challenge, code)
  await api.request('/auth/recuperar-senha/confirmar', {
    method: 'POST',
    anonymous: true,
    data: { email: challenge.email, codigo: Number(code), novaSenha: password },
  })
}
export async function changePassword(current: string, next: string): Promise<void> {
  if (!current) throw new Error('Informe a senha atual.')
  const error = validatePassword(next)
  if (error) throw new Error(error)
  await api.request('/auth/alterar-senha', {
    method: 'POST',
    data: { senhaAtual: current, novaSenha: next, confirmarNovaSenha: next },
  })
}
