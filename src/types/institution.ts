export type InstitutionTab = 'locations' | 'shifts'
export type LocationType =
  'SALA_AULA' | 'LABORATORIO' | 'DEPTO_ADMINISTRATIVO' | 'AUDITORIO' | 'ALMOXAFIRADO' | 'AREA_COMUM'
export interface InstitutionUnit {
  id: string
  name: string
  active: boolean
}
export interface InstitutionEntry {
  id: string
  unitId: string
  name: string
  active: boolean
  locationType?: LocationType
  description?: string
  startTime?: string
  endTime?: string
}
export interface InstitutionData {
  units: InstitutionUnit[]
  locations: InstitutionEntry[]
  shifts: InstitutionEntry[]
}
export interface InstitutionInput {
  active?: boolean
  unitId: string
  name: string
  locationType: LocationType | ''
  description: string
  startTime: string
  endTime: string
}
export interface InstitutionFormProps {
  kind: InstitutionTab
  entry: InstitutionEntry | null
  units: InstitutionUnit[]
  readOnly: boolean
  onEdit: () => void
  onCancel: () => void
  onSubmit: (input: InstitutionInput) => Promise<void>
}
