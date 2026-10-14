import type { LoginCredentials, LoginErrors } from '../types/auth'

export function normalizeCnpj(value: string): string {
  return value.trim().replace(/[./-]/g, '').toUpperCase()
}

export function validateCnpj(value: string): string | null {
  if (!value.trim()) return 'Informe o CNPJ.'
  // O formato também aceita as 12 posições alfanuméricas previstas pela Receita Federal.
  const formatted = /^[a-z\d]{2}\.[a-z\d]{3}\.[a-z\d]{3}\/[a-z\d]{4}-\d{2}$/i
  if (!/^[a-z\d]{12}\d{2}$/i.test(value.trim()) && !formatted.test(value.trim()))
    return 'Digite um CNPJ com 14 posições, com ou sem pontuação.'
  return null
}

export function validateLoginFields({ cnpj, email, password }: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {}
  const cnpjError = validateCnpj(cnpj)
  const emailError = validateEmail(email)
  if (cnpjError) errors.cnpj = cnpjError
  if (emailError) errors.email = emailError
  if (!password) errors.password = 'Informe sua senha.'
  else if (password.length > 128) errors.password = 'A senha deve ter no máximo 128 caracteres.'
  return errors
}

export function validateLogin(credentials: LoginCredentials): string | null {
  return Object.values(validateLoginFields(credentials))[0] ?? null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Informe seu e-mail.'
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Digite um e-mail válido.'
  return null
}
