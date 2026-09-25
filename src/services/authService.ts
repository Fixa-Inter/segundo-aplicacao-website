import type { LoginCredentials, User } from '../types/auth'
import { validateLogin } from '../utils/validation'

// Serviço temporário: substitua esta implementação quando o contrato da API estiver disponível.
export async function loginMock(credentials: LoginCredentials): Promise<User> {
  const error = validateLogin(credentials)
  if (error) throw new Error(error)
  await new Promise<void>((resolve) => window.setTimeout(resolve, 450))
  return {
    id: 'demo-manager',
    name: 'Rapha',
    identifier: credentials.identifier.trim(),
    role: 'manager',
  }
}
