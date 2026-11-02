import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import {
  getProfile,
  listTeamMembers,
  saveManager,
  saveTechnician,
} from '../services/managementService'
import type { TechnicianFormProps } from '../types/ui'
import type { ManagerProfile, TeamMember } from '../types/management'
import { pageSize, teamTabs } from '../utils/teamPresentation'

export function useTeamPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const institutional = user?.role === 'ADMINISTRADOR'
  const [selectedAccess, setSelectedAccess] = useState<TeamMember['accessType']>(
    institutional ? 'GESTOR' : 'TÉCNICO',
  )
  const activeAccess = institutional ? selectedAccess : 'TÉCNICO'
  const activeTab = teamTabs.find((tab) => tab.accessType === activeAccess)!
  const technical = activeAccess === 'TÉCNICO'
  const teamTitle = t(activeTab.label)

  const [items, setItems] = useState<TeamMember[]>([])
  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [unitFilter, setUnitFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const validMemberId = memberId !== undefined && /^[1-9]\d*$/.test(memberId)
  const details = validMemberId ? (items.find((item) => item.id === memberId) ?? null) : null
  const memberNotFound = memberId !== undefined && !loading && !loadError && !details
  function showDetails(item: TeamMember) {
    navigate(`/equipe/${item.id}`)
  }
  function closeDetails() {
    navigate('/equipe', { state: { focusMemberId: details?.id } })
  }
  function cancelForm() {
    setFormOpen(false)
    setLoadAttempt((value) => value + 1)
    if (memberId !== undefined) closeDetails()
  }
  const submitTechnician: TechnicianFormProps['onSubmit'] = (input, competencies, persistedId) =>
    editing?.accessType === 'GESTOR'
      ? saveManager(input, editing.id)
      : saveTechnician(input, persistedId ?? editing?.id, competencies)
  function memberSaved(saved: TeamMember) {
    setItems((current) =>
      editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved],
    )
    setNotice(
      editing?.accessType === 'GESTOR'
        ? 'Gestor atualizado com sucesso.'
        : editing
          ? 'Técnico atualizado com sucesso.'
          : 'Técnico cadastrado com sucesso.',
    )
    setPage(1)
    setFormOpen(false)
    setLoadAttempt((value) => value + 1)
  }
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasFormOpen = useRef(false)
  useEffect(() => {
    const id: unknown = state?.focusMemberId
    if (loading || memberId !== undefined || typeof id !== 'string') return
    const frame = requestAnimationFrame(() =>
      document.getElementById(`tech-details-${id}`)?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [state, loading, memberId])

  useEffect(() => {
    if (wasFormOpen.current && !formOpen) {
      if (editing) document.getElementById('team-edit-' + editing.id)?.focus()
      else addButtonRef.current?.focus()
    }
    wasFormOpen.current = formOpen
  }, [formOpen, editing])

  useEffect(() => {
    let active = true
    Promise.all([listTeamMembers(), getProfile()])
      .then(([technicians, profile]) => {
        if (active) {
          setItems(technicians)
          setManager(profile)
        }
      })
      .catch(() => {
        if (active) setLoadError('Não foi possível carregar a equipe.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadAttempt, user?.id])

  const filtered = items.filter(
    (item) =>
      (filter === 'Todos' || item.status === filter) &&
      item.accessType === activeAccess &&
      (unitFilter === 'Todos' || item.unitId === unitFilter) &&
      `${item.name} ${item.email} ${item.unitName ?? ''} ${t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')} ${item.accessType === 'TÉCNICO' ? t(item.assessedSpecialty ?? 'Sem notas') : ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR').trim()),
  )
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  function selectTab(accessType: TeamMember['accessType']) {
    setSelectedAccess(accessType)
    setPage(1)
  }
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const index = teamTabs.findIndex((tab) => tab.accessType === activeAccess)
    const next = {
      ArrowRight: (index + 1) % teamTabs.length,
      ArrowLeft: (index + teamTabs.length - 1) % teamTabs.length,
      Home: 0,
      End: teamTabs.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    selectTab(teamTabs[next].accessType)
    document.getElementById('team-tab-' + teamTabs[next].id)?.focus()
  }
  function openForm(item?: TeamMember) {
    if (item?.accessType === 'GESTOR' && !institutional) return
    setEditing(item ?? null)
    setFormOpen(true)
  }

  return {
    t,
    institutional,
    activeAccess,
    activeTab,
    technical,
    teamTitle,
    items,
    manager,
    loading,
    setLoading,
    loadError,
    setLoadError,
    setLoadAttempt,
    notice,
    query,
    setQuery,
    filter,
    setFilter,
    unitFilter,
    setUnitFilter,
    page,
    setPage,
    editing,
    formOpen,
    details,
    closeDetails,
    cancelForm,
    memberId,
    memberNotFound,
    submitTechnician,
    memberSaved,
    showDetails,
    addButtonRef,
    filtered,
    lastPage,
    shown,
    selectTab,
    moveTab,
    openForm,
  }
}
