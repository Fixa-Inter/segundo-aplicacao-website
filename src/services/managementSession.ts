import type { User } from '../types/auth'
import type { ManagementSession } from '../types/api/shared'
export function createManagementSession(getUser: () => User | null): ManagementSession {
  return () => {
    const value = getUser()
    if (!value) throw new Error('Entre novamente para continuar.')
    return value
  }
}
