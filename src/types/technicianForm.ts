import type { FormEvent, RefObject } from 'react'
import type { CompetencyInput } from './competency'
import type { Address, ShiftOption, TechnicianInput, WorkUnitOption } from './management'

export interface TechnicianSubmission {
  input: TechnicianInput
  competencies: CompetencyInput[]
}
export interface TechnicianFieldDefinition {
  key: Exclude<keyof TechnicianInput, 'status'>
  label: string
  type?: 'text' | 'email' | 'tel'
  maxLength?: number
}
export interface TechnicianFormController {
  form: TechnicianInput
  institutional: boolean
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
  selectShift: (value: string) => void
  updateStatus: (value: TechnicianInput['status']) => void
  updatePassword: (value: string) => void
  togglePassword: () => void
  updateRating: (id: number, value: string) => void
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  confirmSave: () => Promise<void>
  closeConfirmation: () => void
  cancel: () => void
}
