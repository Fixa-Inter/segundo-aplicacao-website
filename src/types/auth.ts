export type AccessType = 'GESTOR' | 'TÉCNICO' | 'SOLICITANTE' | 'ADMINISTRADOR'

export interface User {
  id: string
  name: string
  identifier: string
  role: AccessType
}
export interface LoginCredentials {
  identifier: string
  password: string
}
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_NAME'; name: string }
