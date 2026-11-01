import type { ManagementClient } from '../../types/api/shared'
import type { ApiLocation } from '../../types/api/locations'
import type { LocationOption } from '../../types/management'
import type { createUnitService } from './units.ts'
export function createLocationService(
  client: ManagementClient,
  units: ReturnType<typeof createUnitService>,
) {
  const request = client.request
  const { scope } = units
  async function listLocations(signal?: AbortSignal): Promise<LocationOption[]> {
    const unit = await scope(signal)
    return (
      await request<ApiLocation[]>('/api/v1/locais', {
        params: unit ? { unidadeId: unit.id } : undefined,
        signal,
      })
    )
      .filter((item) => item.estaAtivo)
      .map((item) => ({ id: String(item.id), name: item.nome }))
  }
  return { listLocations }
}
