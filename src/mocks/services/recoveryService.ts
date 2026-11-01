import type { RecoveryChallenge } from '../../types/recovery'
import { validateEmail } from '../../utils/validation.ts'
import { validateDemoPassword } from '../../utils/managementValidation.ts'
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 350))
export const DEMO_RECOVERY_CODE = '123456'
export async function requestRecovery(email: string): Promise<RecoveryChallenge> {
  const error = validateEmail(email)
  if (error) throw new Error(error)
  await delay()
  return { id: 'demo-recovery', email: email.trim() }
}
export async function verifyRecoveryCode(
  challenge: RecoveryChallenge,
  code: string,
): Promise<void> {
  await delay()
  if (!challenge.email || code !== DEMO_RECOVERY_CODE)
    throw new Error('Código inválido. Confira os seis dígitos e tente novamente.')
}
export async function resetPassword(challenge: RecoveryChallenge, password: string): Promise<void> {
  await delay()
  if (!challenge.email) throw new Error('Inicie a recuperação pelo e-mail de demonstração.')
  const error = validateDemoPassword(password)
  if (error) throw new Error(error)
  // Mock: nenhum e-mail é enviado e nenhuma credencial real é alterada.
}

export async function changePassword(current: string, next: string): Promise<void> {
  if (!current) throw new Error('Informe a senha atual.')
  const error = validateDemoPassword(next)
  if (error) throw new Error(error)
  await delay()
  // Mock: a senha atual não é verificada e nenhuma credencial é armazenada ou alterada.
}
