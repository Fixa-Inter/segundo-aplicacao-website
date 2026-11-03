import type { InstitutionInput, InstitutionTab, LocationType } from '../types/institution'

export const locationTypes: { value: LocationType; label: string }[] = [
  { value: 'SALA_AULA', label: 'Sala de aula' },
  { value: 'LABORATORIO', label: 'Laboratório' },
  { value: 'DEPTO_ADMINISTRATIVO', label: 'Departamento administrativo' },
  { value: 'AUDITORIO', label: 'Auditório' },
  { value: 'ALMOXAFIRADO', label: 'Almoxarifado' },
  { value: 'AREA_COMUM', label: 'Área comum' },
]
export const institutionTabs = [
  { id: 'locations', label: 'Locais' },
  { id: 'shifts', label: 'Turnos' },
] as const

export function shiftSeconds(time: string): number {
  if (time === '24:00' || time === '24:00:00') return 86400
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) return NaN
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}
export function validateInstitution(input: InstitutionInput, kind: InstitutionTab) {
  const errors: Partial<Record<keyof InstitutionInput, string>> = {}
  if (!/^[1-9]\d*$/.test(input.unitId)) errors.unitId = 'Selecione uma unidade de trabalho.'
  if (!input.name.trim() || input.name.length > 100)
    errors.name = 'Informe um nome com até 100 caracteres.'
  if (kind === 'locations') {
    if (!locationTypes.some((type) => type.value === input.locationType))
      errors.locationType = 'Selecione um tipo de local.'
    if (!input.description.trim() || input.description.length > 255)
      errors.description = 'Informe uma descrição com até 255 caracteres.'
  } else {
    const start = shiftSeconds(input.startTime)
    const end = shiftSeconds(input.endTime)
    if (!Number.isFinite(start)) errors.startTime = 'Informe um horário válido (HH:MM).'
    if (!Number.isFinite(end)) errors.endTime = 'Informe um horário válido (HH:MM).'
    else if (start === end) errors.endTime = 'Os horários de início e fim devem ser diferentes.'
  }
  return errors
}
