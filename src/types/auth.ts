export type AccessType = 'GESTOR' | 'TÉCNICO' | 'SOLICITANTE' | 'ADMINISTRADOR'

export interface User {
  id: string
  name: string
  identifier: string
  cnpj: string
  role: AccessType
}
export interface LoginCredentials {
  cnpj: string
  email: string
  password: string
}
export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>
export type AuthState =
  | { status: 'checking' | 'signing-in'; user: null; error: null }
  | { status: 'anonymous'; user: null; error: null }
  | { status: 'authenticated'; user: User; error: null }
  | { status: 'error'; user: null; error: string }

export interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  updateName: (name: string) => void
}
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_NAME'; name: string }
