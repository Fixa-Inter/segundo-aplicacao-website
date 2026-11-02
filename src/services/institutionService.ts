import type { ManagementClient, ManagementSession } from '../types/api/shared'
import type { ApiLocation } from '../types/api/locations'
import type { ApiProfile } from '../types/api/profile'
import type { ApiShift } from '../types/api/shifts'
import type {
  InstitutionData,
  InstitutionEntry,
  InstitutionInput,
  InstitutionTab,
} from '../types/institution'
import { locationTypes, shiftSeconds, validateInstitution } from '../utils/institution.ts'
import { formatShiftTime } from '../utils/presentation.ts'
import { check } from '../utils/validationErrors.ts'
import type { createUnitService } from './resources/units.ts'

export function createInstitutionService(
  client: ManagementClient,
  user: ManagementSession,
  units: ReturnType<typeof createUnitService>,
) {
  const paths = { locations: '/api/v1/locais', shifts: '/api/v1/turnos' }
  async function allowedUnits(signal?: AbortSignal) {
    const role = user().role
    if (role === 'ADMINISTRADOR') return (await units.institutionScope(signal)).units
    if (role === 'GESTOR') {
      const profile = await client.request<ApiProfile>('/api/v1/perfil', { signal })
      if (
        String(profile.id) !== user().id ||
        !Number.isSafeInteger(profile.unidadeId) ||
        !profile.unidadeId ||
        profile.unidadeId <= 0
      )
        throw new Error('Não foi possível identificar a unidade da sua conta.')
      return [{ id: profile.unidadeId, nome: '', estaAtivo: true }]
    }
    throw new Error('Sua conta não tem permissão para acessar a instituição.')
  }
  function location(item: ApiLocation): InstitutionEntry {
    const type = item.tipoLocalEndereco
    const option =
      typeof type === 'object' && type
        ? locationTypes[type.id - 1]
        : locationTypes.find((option) => option.value === type)
    return {
      id: String(item.id),
      unitId: String(item.unidadeId),
      name: item.nome,
      active: item.estaAtivo,
      locationType: option?.value,
      description: item.descricao ?? '',
    }
  }
  function shift(item: ApiShift): InstitutionEntry {
    return {
      id: String(item.id),
      unitId: String(item.unidadeId),
      name: item.nome,
      active: item.estaAtivo,
      startTime: formatShiftTime(item.horaInicio),
      endTime: formatShiftTime(item.horaFim),
    }
  }
  async function loadInstitution(signal?: AbortSignal): Promise<InstitutionData> {
    const available = await allowedUnits(signal)
    const records = await Promise.all(
      available.map(async (unit) => {
        const params = { unidadeId: unit.id }
        const [locations, shifts] = await Promise.all([
          client.request<ApiLocation[]>(paths.locations, { params, signal }),
          client.request<ApiShift[]>(paths.shifts, { params, signal }),
        ])
        return {
          locations: locations.filter((item) => item.unidadeId === unit.id).map(location),
          shifts: shifts.filter((item) => item.unidadeId === unit.id).map(shift),
        }
      }),
    )
    return {
      units: available.map((unit) => ({
        id: String(unit.id),
        name: unit.nome,
        active: unit.estaAtivo,
      })),
      locations: records.flatMap((record) => record.locations),
      shifts: records.flatMap((record) => record.shifts),
    }
  }
  async function saveInstitutionEntry(
    kind: InstitutionTab,
    input: InstitutionInput,
    id?: string,
  ): Promise<void> {
    check(validateInstitution(input, kind))
    const available = await allowedUnits()
    const unit = available.find((unit) => String(unit.id) === input.unitId)
    if (!unit || !unit.estaAtivo) throw new Error('Selecione uma unidade ativa da sua instituição.')
    const path = paths[kind]
    if (id) {
      const previous = await client.request<ApiLocation | ApiShift>(path + '/' + id)
      if (!available.some((unit) => unit.id === previous.unidadeId))
        throw new Error('Este registro não pertence à sua instituição.')
    }
    const data =
      kind === 'locations'
        ? {
            unidadeId: unit.id,
            nome: input.name.trim(),
            tipoLocalEndereco: input.locationType,
            descricao: input.description.trim(),
          }
        : {
            unidadeId: unit.id,
            nome: input.name.trim(),
            horaInicio: shiftSeconds(input.startTime),
            horaFim: shiftSeconds(input.endTime),
            atravessaMeiaNoite: shiftSeconds(input.endTime) < shiftSeconds(input.startTime),
          }
    await client.request(id ? path + '/' + id : path, { method: id ? 'PATCH' : 'POST', data })
  }
  async function setInstitutionEntryActive(
    kind: InstitutionTab,
    id: string,
    active: boolean,
  ): Promise<void> {
    const available = await allowedUnits()
    const path = paths[kind]
    const previous = await client.request<ApiLocation | ApiShift>(path + '/' + id)
    if (!available.some((unit) => unit.id === previous.unidadeId))
      throw new Error('Este registro não pertence à sua instituição.')
    await client.request(path + '/' + id + (active ? '/ativar' : '/desativar'), { method: 'PATCH' })
  }
  return { loadInstitution, saveInstitutionEntry, setInstitutionEntryActive }
}
