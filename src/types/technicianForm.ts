import type { FormEvent, RefObject } from 'react'
import type { CompetencyInput, TechnicianCompetency } from './competency'
import type { Address, ShiftOption, TechnicianInput, WorkUnitOption } from './management'

export interface TechnicianSubmission {
  input: TechnicianInput
  competencies: CompetencyInput[]
}
export interface TechnicianFieldDefinition {
  key: 'name' | 'email' | 'birthDate' | 'jobTitle'
  label: string
  type?: 'text' | 'email' | 'tel'
  maxLength?: number
}
export interface TechnicianFormController {
  form: TechnicianInput
  institutional: boolean
  technical: boolean
  cnpj: string
  workUnits: WorkUnitOption[]
  unitError: string
  unitsLoading: boolean
  retryUnits: () => void
  shifts: ShiftOption[]
  shiftError: string
  shiftsLoading: boolean
  retryShifts: () => void
  addressSource: Address
  birthDate: string
  ratings: Record<string, string>
  draftSpecialty: string
  ratingErrors: Record<string, string>
  password: string
  passwordVisible: boolean
  passwordError: string | undefined
  errors: Partial<Record<keyof TechnicianInput, string>>
  error: string
  pending: TechnicianSubmission | null
  busy: boolean
  formRef: RefObject<HTMLFormElement | null>
  updateField: (key: TechnicianFieldDefinition['key'], value: string) => void
  selectUnit: (value: string) => void
  selectShifts: (value: string[]) => void
  updateStatus: (value: TechnicianInput['status']) => void
  updatePassword: (value: string) => void
  togglePassword: () => void
  updateRating: (id: number, value: string) => void
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  confirmSave: () => Promise<void>
  closeConfirmation: () => void
  cancel: () => void
}

export interface TechnicianAssignmentsProps {
  controller: TechnicianFormController
  unitName: string
  initialUnitId?: string
}
export interface TechnicianGradesProps {
  controller: TechnicianFormController
  items: TechnicianCompetency[]
}
