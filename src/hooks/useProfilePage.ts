import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import { useUnsavedForm } from '../contexts/useUnsavedChanges'
import { getProfile, saveProfile } from '../services/managementService'
import type { ManagerProfile } from '../types/management'
import { validateProfile } from '../utils/apiValidation'
import { formatDate as formatDateInput, parseDateInput } from '../utils/calendar'
import { hasFormChanges } from '../utils/formChanges'
import { formatAddress } from '../utils/presentation'

const empty: ManagerProfile = {
  name: '',
  email: '',
  company: '',
  phone: '',
  birthDate: '',
  postalCode: '',
  address: '',
  district: '',
  city: '',
  state: '',
  number: '',
  complement: '',
}
export function useProfilePage() {
  const { t, formatDate } = usePreferences()

  const navigate = useNavigate()
  const [pending, setPending] = useState<ManagerProfile | null>(null)
  const { updateName, user } = useAuth()
  const [profile, setProfile] = useState<ManagerProfile>(empty)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ManagerProfile, string>>>({})
  const [birthDateText, setBirthDateText] = useState('')
  const [savedProfile, setSavedProfile] = useState<ManagerProfile>(empty)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const wasEditing = useRef(false)
  const isDirty =
    editing &&
    hasFormChanges(
      { ...profile, birthDateText },
      {
        ...savedProfile,
        birthDateText: savedProfile.birthDate
          ? formatDateInput(savedProfile.birthDate, { dateStyle: 'short' })
          : '',
      },
    )
  const requestExit = useUnsavedForm(isDirty, busy)

  function cancel() {
    requestExit(() => {
      setProfile({ ...savedProfile })
      setEditing(false)
      setFieldErrors({})
      setError('')
    })
  }

  useEffect(() => {
    if (editing) formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    else if (wasEditing.current) editButtonRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  useEffect(() => {
    let active = true
    getProfile()
      .then((data) => {
        if (active) {
          setProfile(data)
          setSavedProfile(data)
        }
      })
      .catch(() => {
        if (active) setLoadError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadAttempt])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const input = { ...profile, birthDate: parseDateInput(birthDateText) }
    const errors = validateProfile(input)
    if (savedProfile.birthDate && !birthDateText)
      errors.birthDate = 'A data de nascimento cadastrada não pode ser removida.'
    if (birthDateText && !input.birthDate)
      errors.birthDate = 'Informe a data no formato DD/MM/AAAA.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    setPending(input)
  }

  async function confirmSave() {
    if (!pending || busy) return
    const input = pending
    setBusy(true)
    setError('')
    try {
      const saved = await saveProfile({
        ...input,
        name: profile.name.trim(),
        email: profile.email.trim(),
        company: profile.company.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
      })
      setProfile(saved)
      setSavedProfile(saved)
      updateName(saved.name)
      setEditing(false)
      setNotice('Perfil atualizado com sucesso.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o perfil.')
    } finally {
      setPending(null)
      setBusy(false)
    }
  }
  const address = formatAddress(profile)

  return {
    t,
    formatDate,
    navigate,
    pending,
    setPending,
    user,
    profile,
    setProfile,
    loading,
    setLoading,
    loadError,
    setLoadError,
    setLoadAttempt,
    busy,
    editing,
    setEditing,
    error,
    setError,
    notice,
    fieldErrors,
    setFieldErrors,
    birthDateText,
    setBirthDateText,
    editButtonRef,
    formRef,
    cancel,
    save,
    confirmSave,
    address,
  }
}
