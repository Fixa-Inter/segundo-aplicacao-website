import type { ApiProfile } from '../types/api/profile'
import type { ApiShift } from '../types/api/shifts'
import type { ApiUser } from '../types/api/users'
import type { User } from '../types/auth'
import { ApiError, type createHttpClient } from './httpClient.ts'

const validId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

export function createDashboardScopeService(
  client: ReturnType<typeof createHttpClient>,
  getUser: () => User | null,
) {
  async function getUnitId(signal?: AbortSignal): Promise<number> {
    const session = getUser()
    if (!session) throw new ApiError('Entre novamente para continuar.', 401)
    const userId = session.id
    const version = client.getVersion()
    function active() {
      signal?.throwIfAborted()
      if (version !== client.getVersion() || getUser()?.id !== userId)
        throw new ApiError('A sessão foi encerrada. Entre novamente.', 401)
    }
    const invalid = () => new ApiError('Não foi possível identificar a unidade da sua conta.')
    active()
    const profile = await client.request<ApiProfile>('/api/v1/perfil', { signal })
    active()
    if (!profile || !validId(profile.id) || String(profile.id) !== session.id) throw invalid()
    if (validId(profile.unidadeId)) return profile.unidadeId
    if (session.role === 'ADMINISTRADOR') {
      const identity = await client.request<ApiUser>(`/api/v1/usuarios/${profile.id}`, { signal })
      active()
      if (!identity || identity.id !== profile.id || !validId(identity.unidadeId)) throw invalid()
      return identity.unidadeId
    }
    if (session.role !== 'GESTOR')
      throw new ApiError('Você não tem permissão para esta operação.', 403)

    const shifts = await client.request<ApiShift[]>('/api/v1/turnos', { signal })
    active()
    if (
      !Array.isArray(shifts) ||
      !shifts.length ||
      shifts.some((shift) => !shift || !validId(shift.unidadeId))
    )
      throw invalid()
    const ids = new Set(shifts.map((shift) => shift.unidadeId))
    if (ids.size !== 1) throw invalid()
    return shifts[0].unidadeId
  }
  return { getUnitId }
}
