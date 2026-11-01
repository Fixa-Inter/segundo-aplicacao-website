import type { ManagementClient, ManagementSession } from '../../types/api/shared'
import type { ApiUnit, InstitutionScope } from '../../types/api/units'
import type { WorkUnitOption } from '../../types/management'
import { address } from '../../utils/apiUnits.ts'
import type { createUserService } from './users.ts'

export function createUnitService(
  client: ManagementClient,
  user: ManagementSession,
  users: ReturnType<typeof createUserService>,
) {
  const request = client.request
  const digits = (value: string) => value.replace(/\D/g, '')
  const units = (signal?: AbortSignal): Promise<ApiUnit[]> =>
    request<ApiUnit[]>('/api/v1/unidades', { signal })
  async function currentUnit(signal?: AbortSignal): Promise<ApiUnit> {
    const found = (await units(signal)).find((unit) => digits(unit.cnpj) === digits(user().cnpj))
    if (!found) throw new Error('A unidade deste CNPJ não está disponível para sua conta.')
    return found
  }
  async function institutionScope(signal?: AbortSignal): Promise<InstitutionScope> {
    const current = user()
    const [availableUnits, identity] = await Promise.all([
      units(signal),
      users.getUser(current.id, signal),
    ])
    const linkedUnit = availableUnits.find((unit) => unit.id === identity.unidadeId)
    const institutionId = linkedUnit?.instituicaoId
    if (
      String(identity.id) !== current.id ||
      typeof institutionId !== 'number' ||
      !Number.isInteger(institutionId) ||
      institutionId <= 0 ||
      !linkedUnit
    )
      throw new Error('Não foi possível identificar a instituição da sua conta.')
    return {
      currentUnit: linkedUnit,
      units: availableUnits.filter((unit) => unit.instituicaoId === institutionId),
    }
  }

  const scope = (signal?: AbortSignal): Promise<ApiUnit | undefined> =>
    user().role === 'ADMINISTRADOR' ? currentUnit(signal) : Promise.resolve(undefined)
  async function listWorkUnits(signal?: AbortSignal): Promise<WorkUnitOption[]> {
    if (user().role !== 'ADMINISTRADOR') return []
    const institution = await institutionScope(signal)
    return institution.units.map((unit) => ({
      ...address(unit),
      id: String(unit.id),
      name: unit.nome,
      active: unit.estaAtivo,
    }))
  }
  return { currentUnit, institutionScope, scope, listWorkUnits }
}
