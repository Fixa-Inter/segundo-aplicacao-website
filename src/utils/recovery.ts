import type { RecoveryChallenge } from '../types/recovery'
import { validateEmail } from './validation.ts'

// O estado de navegação é apenas uma entrada do protótipo, nunca uma autorização real.
export function readRecoveryChallenge(state: unknown): RecoveryChallenge | null {
  if (!state || typeof state !== 'object' || !('challenge' in state)) return null
  const value = state.challenge
  if (!value || typeof value !== 'object' || !('email' in value) || !('id' in value)) return null
  if (
    typeof value.email !== 'string' ||
    validateEmail(value.email) ||
    value.id !== 'email-recovery'
  )
    return null
  return { email: value.email.trim(), id: value.id }
}
export function maskRecoveryEmail(email: string): string {
  if (validateEmail(email)) return ''
  const [name, domain] = email.trim().split('@')
  return `${name.slice(0, Math.min(3, name.length))}***@${domain}`
}
