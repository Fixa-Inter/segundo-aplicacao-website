import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { usePreferences } from '../contexts/usePreferences'
import {
  loadInstitution,
  saveInstitutionEntry,
  setInstitutionEntryActive,
} from '../services/managementService'
import type {
  InstitutionData,
  InstitutionEntry,
  InstitutionInput,
  InstitutionTab,
} from '../types/institution'
import { institutionTabs, locationTypes } from '../utils/institution'
import { useNotice } from './useNotice'

export function useInstitutionPage() {
  const { t } = usePreferences()
  const [data, setData] = useState<InstitutionData>({ units: [], locations: [], shifts: [] })
  const [tab, setTab] = useState<InstitutionTab>('locations')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [unitId, setUnitId] = useState('Todos')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const { notice, setNotice, closeNotice } = useNotice()
  const [entry, setEntry] = useState<InstitutionEntry | null>(null)
  const [screen, setScreen] = useState<'list' | 'form' | 'details'>('list')
  const addButton = useRef<HTMLButtonElement>(null)
  const previousScreen = useRef(screen)
  useEffect(() => {
    const controller = new AbortController()
    loadInstitution(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setLoadError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar a instituição.',
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    if (screen === 'list' && previousScreen.current !== 'list') addButton.current?.focus()
    previousScreen.current = screen
  }, [screen])
  function retry() {
    setLoading(true)
    setLoadError('')
    setAttempt((value) => value + 1)
  }
  function selectTab(value: InstitutionTab) {
    setTab(value)
    setPage(1)
    setQuery('')
    setNotice('')
  }
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const value =
      event.key === 'Home'
        ? 'locations'
        : event.key === 'End'
          ? 'shifts'
          : tab === 'locations'
            ? 'shifts'
            : 'locations'
    selectTab(value)
    document.getElementById('institution-tab-' + value)?.focus()
  }
  function openForm(item: InstitutionEntry | null = null, readOnly = false) {
    setEntry(item)
    setScreen(readOnly ? 'details' : 'form')
    setNotice('')
  }
  async function save(input: InstitutionInput) {
    await saveInstitutionEntry(tab, input, entry?.id)
    if (entry && typeof input.active === 'boolean' && input.active !== entry.active)
      await setInstitutionEntryActive(tab, entry.id, input.active)
    setScreen('list')
    setPage(1)
    setNotice(tab === 'locations' ? 'Local salvo com sucesso.' : 'Turno salvo com sucesso.')
    retry()
  }
  const search = query.trim().toLocaleLowerCase('pt-BR')
  const filtered = data[tab].filter((item) => {
    const unit = data.units.find((unit) => unit.id === item.unitId)
    const type = locationTypes.find((type) => type.value === item.locationType)
    return (
      (unitId === 'Todos' || item.unitId === unitId) &&
      (status === 'Todos' || item.active === (status === 'Ativo')) &&
      [
        item.name,
        item.description,
        unit?.name,
        type ? t(type.label) : '',
        item.startTime,
        item.endTime,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(search)
    )
  })
  const total = Math.max(1, Math.ceil(filtered.length / 6))
  const currentPage = Math.min(page, total)
  const shown = filtered.slice((currentPage - 1) * 6, currentPage * 6)
  return {
    t,
    data,
    tab,
    query,
    setQuery,
    status,
    setStatus,
    unitId,
    setUnitId,
    page: currentPage,
    setPage,
    total,
    shown,
    loading,
    loadError,
    retry,
    notice,
    closeNotice,
    entry,
    screen,
    setScreen,
    addButton,
    selectTab,
    moveTab,
    openForm,
    save,
    tabs: institutionTabs,
  }
}
