import { createContext } from 'react'
import type { LoginCredentials, User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  updateName: (name: string) => void
}
export const AuthContext = createContext<AuthContextValue | null>(null)
