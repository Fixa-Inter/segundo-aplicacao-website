import type { LoginCredentials, User } from '../../types/auth'
import { normalizeCnpj, validateLogin } from '../../utils/validation.ts'

// Serviço temporário: substitua esta implementação quando o contrato da API estiver disponível.
export async function loginMock(credentials: LoginCredentials): Promise<User> {
  const error = validateLogin(credentials)
  if (error) throw new Error(error)
  await new Promise<void>((resolve) => setTimeout(resolve, 450))
  return {
    id: 'demo-manager',
    name: 'Rapha',
    identifier: credentials.email.trim(),
    cnpj: normalizeCnpj(credentials.cnpj),
    role: 'GESTOR',
  }
}
