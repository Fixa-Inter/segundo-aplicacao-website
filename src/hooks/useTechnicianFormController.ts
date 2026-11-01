import { useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/useAuth'
import { useUnsavedForm } from '../contexts/useUnsavedChanges'
import { PartialSaveError } from '../services/managementErrors'
import type { CompetencyInput } from '../types/competency'
import type { TechnicianInput } from '../types/management'
import type {
  TechnicianFieldDefinition,
  TechnicianFormController,
  TechnicianSubmission,
} from '../types/technicianForm'
import type { TechnicianFormFieldsProps } from '../types/ui'
import { validatePassword, validateTechnician } from '../utils/apiValidation'
import { formatDate, parseDateInput } from '../utils/calendar'
import { getCompetencyPresentation, parseCompetencyRating } from '../utils/competencies'
import { hasFormChanges } from '../utils/formChanges'
import { useShifts, useWorkUnits } from './useManagementOptions'

export function useTechnicianFormController({
  technician,
  manager,
  onSubmit,
  onSaved,
  onCancel,
  initialCompetencies,
}: TechnicianFormFieldsProps): TechnicianFormController {
  const { user } = useAuth()
  const institutional = user?.role === 'ADMINISTRADOR'
  const linkedShiftIds = [
    ...new Set(technician?.shiftIds ?? (technician?.shiftId ? [technician.shiftId] : [])),
  ]
  const selectedShiftId = linkedShiftIds.length === 1 ? linkedShiftIds[0] : ''
  const [form, setForm] = useState<TechnicianInput>({
    name: technician?.name ?? '',
    birthDate: technician?.birthDate ?? '',
    email: technician?.email ?? '',
    phone: technician?.phone ?? '',
    unitId: technician?.unitId ?? '',
    jobTitle: technician?.jobTitle ?? 'Técnico de manutenção',
    shiftId: selectedShiftId,
    shiftIds: linkedShiftIds,
    specialty: technician?.specialty ?? '',
    shift: technician?.shift ?? '08:00 - 16:00',
    status: technician?.status ?? 'Ativo',
  })
  const {
    items: workUnits,
    error: unitError,
    loading: unitsLoading,
    retry: retryUnits,
  } = useWorkUnits(institutional)
  const {
    items: shifts,
    error: shiftError,
    loading: shiftsLoading,
    retry: retryShifts,
  } = useShifts(form.unitId || technician?.unitId)
  const addressSource = workUnits.find((unit) => unit.id === form.unitId) ?? technician ?? manager
  const [persistedId, setPersistedId] = useState<string | undefined>(technician?.id)
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState(
    technician ? formatDate(technician.birthDate, { dateStyle: 'short' }) : '',
  )
  const [ratings, setRatings] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialCompetencies.map((item) => [item.id, item.rating === null ? '' : String(item.rating)]),
    ),
  )
  const [initialRatings] = useState(() => ({ ...ratings }))
  const draftSpecialty =
    getCompetencyPresentation(
      initialCompetencies.map((item) => ({
        ...item,
        rating: parseCompetencyRating(ratings[item.id]) ?? null,
      })),
    ).highlights[0]?.name ?? ''
  const [ratingErrors, setRatingErrors] = useState<Record<string, string>>({})
  const [initial] = useState(() => ({
    form: JSON.stringify(form),
    birthDateText: birthDate,
    password,
  }))
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [errors, setErrors] = useState<Partial<Record<keyof TechnicianInput, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState<TechnicianSubmission | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isDirty =
    hasFormChanges({ form: JSON.stringify(form), birthDateText: birthDate, password }, initial) ||
    hasFormChanges(ratings, initialRatings)
  const requestExit = useUnsavedForm(isDirty, busy)
  const cancel = () => requestExit(onCancel)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const input = {
      ...form,
      specialty: draftSpecialty,
      birthDate: parseDateInput(birthDate),
      password: persistedId ? undefined : password,
    }
    const validation = validateTechnician(input)
    if (institutional && !input.unitId) validation.unitId = 'Selecione uma unidade de trabalho.'
    const invalidPassword = persistedId ? undefined : validatePassword(password)
    const competencies: CompetencyInput[] = []
    const invalidRatings: Record<string, string> = {}
    for (const item of initialCompetencies) {
      const rating = parseCompetencyRating(ratings[item.id])
      if (rating === undefined)
        invalidRatings[item.id] = 'Informe uma nota de 0 a 10, com até duas casas decimais.'
      else competencies.push({ competencyId: item.id, rating })
    }
    setRatingErrors(invalidRatings)
    setErrors(validation)
    setPasswordError(invalidPassword)
    setError('')
    if (Object.keys(validation).length || invalidPassword || Object.keys(invalidRatings).length) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }
    setPending({ input, competencies })
  }
  async function confirmSave() {
    if (!pending || busy) return
    const { input, competencies } = pending
    setBusy(true)
    try {
      const saved = await onSubmit(input, competencies, persistedId)
      setPassword('')
      onSaved(saved)
    } catch (reason) {
      if (reason instanceof PartialSaveError) {
        setPersistedId(reason.resourceId)
        setPassword('')
      }
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o técnico.')
    } finally {
      setPending(null)
      setBusy(false)
    }
  }
  function updateField(key: TechnicianFieldDefinition['key'], value: string) {
    if (key === 'birthDate') setBirthDate(value)
    else setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }
  function selectUnit(unitId: string) {
    setForm((value) => ({ ...value, unitId, shiftId: '', shiftIds: [] }))
    setErrors((value) => ({ ...value, unitId: undefined, shiftId: undefined }))
  }
  function selectShift(shiftId: string) {
    setForm((current) => ({ ...current, shiftId, shiftIds: shiftId ? [shiftId] : [] }))
    setErrors((current) => ({ ...current, shiftId: undefined }))
  }
  function updatePassword(value: string) {
    setPassword(value)
    setPasswordError(undefined)
  }
  function updateRating(id: number, value: string) {
    setRatings((current) => ({ ...current, [id]: value }))
    setRatingErrors((current) => ({ ...current, [id]: '' }))
  }
  return {
    form,
    institutional,
    cnpj: user?.cnpj ?? '',
    workUnits,
    unitError,
    unitsLoading,
    retryUnits,
    shifts,
    shiftError,
    shiftsLoading,
    retryShifts,
    addressSource,
    birthDate,
    ratings,
    draftSpecialty,
    ratingErrors,
    password,
    passwordVisible,
    passwordError,
    errors,
    error,
    pending,
    busy,
    formRef,
    updateField,
    selectUnit,
    selectShift,
    updateStatus: (value) => setForm((current) => ({ ...current, status: value })),
    updatePassword,
    togglePassword: () => setPasswordVisible((current) => !current),
    updateRating,
    submit,
    confirmSave,
    closeConfirmation: () => setPending(null),
    cancel,
  }
}
