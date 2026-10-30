import type { LoginResponse } from '../types/api/auth'
import type { LoginCredentials, User } from '../types/auth'
import { normalizeCnpj, validateLogin } from '../utils/validation.ts'
import { api } from './api.ts'
import { ApiError } from './httpClient.ts'

const key = 'fixa.session'
let user: User | null = null
function persist() {
  try {
    const tokens = api.getTokens()
    if (tokens && user) sessionStorage.setItem(key, JSON.stringify({ user, ...tokens }))
    else sessionStorage.removeItem(key)
  } catch {
    /* O acesso continua em memória se o navegador bloquear o armazenamento. */
  }
}
api.onTokens(persist)
export function currentUser() {
  return user
}
export function clearSession() {
  user = null
  api.clear()
  persist()
}
export async function login(credentials: LoginCredentials): Promise<User> {
  const error = validateLogin(credentials)
  if (error) throw new Error(error)
  if (!/^\d{14}$/.test(normalizeCnpj(credentials.cnpj)))
    throw new Error('A API atual exige um CNPJ numérico com 14 dígitos.')
  clearSession()
  const data = await api.request<LoginResponse>('/auth/login', {
    method: 'POST',
    anonymous: true,
    data: {
      email: credentials.email.trim(),
      senha: credentials.password,
      cnpj: normalizeCnpj(credentials.cnpj),
    },
  })
  if (
    !data.token ||
    !data.refreshToken ||
    !data.usuarioId ||
    !['GESTOR', 'ADMINISTRADOR'].includes(data.tipoAcesso)
  )
    throw new Error('Este acesso não pode abrir a área de gestão.')
  user = {
    id: String(data.usuarioId),
    name: data.nome,
    identifier: credentials.email.trim(),
    cnpj: normalizeCnpj(credentials.cnpj),
    role: data.tipoAcesso as User['role'],
  }
  api.setTokens({ token: data.token, refreshToken: data.refreshToken })
  return user
}
export async function restoreSession(): Promise<User | null> {
  let stored: unknown
  try {
    stored = JSON.parse(sessionStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
  if (!stored || typeof stored !== 'object') return null
  const value = stored as { user?: User; token?: string; refreshToken?: string }
  if (
    !value.user ||
    !/^\d+$/.test(value.user.id) ||
    !['GESTOR', 'ADMINISTRADOR'].includes(value.user.role) ||
    typeof value.user.cnpj !== 'string' ||
    typeof value.token !== 'string' ||
    typeof value.refreshToken !== 'string'
  ) {
    clearSession()
    return null
  }
  user = value.user
  api.setTokens({ token: value.token, refreshToken: value.refreshToken })
  try {
    const profile = await api.request<{ nomeCompleto: string }>('/api/v1/perfil')
    user = { ...value.user, name: profile.nomeCompleto }
    persist()
    return user
  } catch (reason) {
    if (reason instanceof ApiError && [401, 403].includes(reason.status)) {
      clearSession()
      return null
    }
    throw reason
  }
}
export function logout() {
  const refreshToken = api.getTokens()?.refreshToken
  clearSession()
  if (refreshToken)
    void api
      .request('/auth/logout', { method: 'POST', anonymous: true, data: { refreshToken } })
      .catch(() => {})
}
