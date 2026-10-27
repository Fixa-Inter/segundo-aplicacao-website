import type { ManagementClient, ManagementSession } from '../../types/api/shared'
import type { ApiShift, ApiLink } from '../../types/api/shifts'
import type { ShiftOption } from '../../types/management'
import type { createUnitService } from './units.ts'
import { formatShiftLabel } from '../../utils/presentation.ts'
export function createShiftService(
  client: ManagementClient,
  user: ManagementSession,
  units: ReturnType<typeof createUnitService>,
) {
  const request = client.request
  const { institutionScope, scope } = units
  async function listRawShifts(unitId?: number, signal?: AbortSignal): Promise<ApiShift[]> {
    return request<ApiShift[]>('/api/v1/turnos', {
      params: unitId ? { unidadeId: unitId } : undefined,
      signal,
    })
  }
  async function listUserShifts(id: string, signal?: AbortSignal): Promise<ApiLink[]> {
    return request<ApiLink[]>(`/api/v1/usuarios/${id}/turnos`, { signal })
  }
  async function linkUser(shiftId: string, userId: string): Promise<void> {
    await request(`/api/v1/turnos/${shiftId}/usuarios/${userId}`, { method: 'POST' })
  }
  async function deactivateLink(id: string): Promise<void> {
    await request(`/api/v1/turnos-usuarios/${id}/desativar`, { method: 'PATCH' })
  }
  async function listShifts(
    requestedUnitId?: string,
    signal?: AbortSignal,
  ): Promise<ShiftOption[]> {
    const institution = user().role === 'ADMINISTRADOR' ? await institutionScope(signal) : null
    const unit = institution
      ? requestedUnitId
        ? institution.units.find((item) => String(item.id) === requestedUnitId)
        : institution.currentUnit
      : await scope(signal)
    if (institution && !unit)
      throw new Error('A unidade selecionada não pertence à instituição da sua conta.')
    return (await listRawShifts(unit?.id, signal))
      .filter((item) => item.estaAtivo && (!unit || item.unidadeId === unit.id))
      .map((item) => ({
        id: String(item.id),
        name: formatShiftLabel(item),
      }))
  }
  return { listRawShifts, listUserShifts, linkUser, deactivateLink, listShifts }
}
