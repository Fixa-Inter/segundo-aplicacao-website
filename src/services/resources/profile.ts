import type { ManagementClient } from '../../types/api/shared'
import type { ApiProfile } from '../../types/api/profile'
import type { ManagerProfile } from '../../types/management'
import type { createUnitService } from './units.ts'
import { address } from '../../utils/apiUnits.ts'
import { validateProfile } from '../../utils/apiValidation.ts'
import { check } from '../../utils/validationErrors.ts'
export function createProfileService(
  client: ManagementClient,
  units: ReturnType<typeof createUnitService>,
) {
  const request = client.request
  const { scope } = units
  async function getProfile(): Promise<ManagerProfile> {
    const [profile, unit] = await Promise.all([request<ApiProfile>('/api/v1/perfil'), scope()])
    return {
      ...address(unit),
      name: profile.nomeCompleto,
      email: profile.email,
      birthDate: profile.dataNascimento ?? '',
      phone: '',
      company: unit?.nome ?? '',
    }
  }
  async function saveProfile(input: ManagerProfile): Promise<ManagerProfile> {
    check(validateProfile(input))
    await request('/api/v1/perfil', {
      method: 'PATCH',
      data: {
        nomeCompleto: input.name.trim(),
        email: input.email.trim(),
        ...(input.birthDate ? { dataNascimento: input.birthDate } : {}),
      },
    })
    return getProfile()
  }
  return { getProfile, saveProfile }
}
