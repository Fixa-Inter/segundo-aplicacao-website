import type { EnumValue } from '../types/api/shared'
import type { ApiUser } from '../types/api/users'
import type { ApiUnit } from '../types/api/units'
import type { ApiShift, ApiLink } from '../types/api/shifts'
import type { ApiGrade } from '../types/api/competencies'
import type { Technician, TeamMember } from '../types/management'
import { address } from './apiUnits.ts'
import { grades } from './apiCompetencies.ts'
import { getCompetencyPresentation } from './competencies.ts'
import { formatShiftLabel } from './presentation.ts'
export const isTechnician = (value: EnumValue) =>
  typeof value === 'object' ? value.id === 3 : value === 'TECNICO'

export const teamAccessType = (value: EnumValue): TeamMember['accessType'] | null => {
  const role = typeof value === 'object' ? value?.id : value
  if (role === 2 || role === 'GESTOR') return 'GESTOR'
  if (role === 3 || role === 'TECNICO') return 'TÉCNICO'
  return null
}

export function technician(
  item: ApiUser,
  unit: ApiUnit | undefined,
  shifts: ApiShift[],
  links: ApiLink[],
  ratings: ApiGrade[],
): Technician {
  const activeShifts = links
    .filter((link) => link.estaAtivo)
    .map((link) => shifts.find((shift) => shift.id === link.turnoId))
    .filter((shift): shift is ApiShift => Boolean(shift))
  return {
    ...address(unit),
    id: String(item.id),
    unitId: String(item.unidadeId),
    unitName: unit?.nome,
    name: item.nomeCompleto,
    email: item.email,
    birthDate: item.dataNascimento,
    jobTitle: item.cargo,
    phone: '',
    specialty: '',
    assessedSpecialty: getCompetencyPresentation(grades(ratings)).highlights[0]?.name ?? null,
    accessType: 'TÉCNICO',
    status: item.estaAtivo ? 'Ativo' : 'Inativo',
    shiftId: activeShifts[0] ? String(activeShifts[0].id) : '',
    shift: activeShifts.map(formatShiftLabel).join(', '),
    shiftIds: activeShifts.map((shift) => String(shift.id)),
  }
}
