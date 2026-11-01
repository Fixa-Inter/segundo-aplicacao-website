import type { ManagementSession } from '../types/api/shared'
import type { User } from '../types/auth'

export function createManagementSession(getUser: () => User | null): ManagementSession {
  return () => {
    const value = getUser()
    if (!value) throw new Error('Entre novamente para continuar.')
    return value
  }
}
