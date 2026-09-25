import type { LoginCredentials } from '../types/auth'

export function validateLogin({ identifier, password }: LoginCredentials): string | null {
  if (!identifier.trim()) return 'Informe seu e-mail ou CNPJ.'
  if (identifier.trim().length > 120) return 'O e-mail ou CNPJ deve ter no máximo 120 caracteres.'
  if (!password) return 'Informe sua senha.'
  return null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Informe seu e-mail.'
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Digite um e-mail válido.'
  return null
}
