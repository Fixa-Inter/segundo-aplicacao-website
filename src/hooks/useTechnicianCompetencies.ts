import { useEffect, useState } from 'react'
import { listTechnicianCompetencies } from '../services/managementService'
import type { CompetenciesResult, CompetenciesState } from '../types/competency'
import { competencyCategories } from '../utils/competencies'

export function useTechnicianCompetencies(technicianId?: string): CompetenciesResult {
  const [state, setState] = useState<CompetenciesState>(() => ({
    items: technicianId ? [] : competencyCategories.map((item) => ({ ...item, rating: null })),
    loading: Boolean(technicianId),
    error: '',
  }))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!technicianId) return
    const controller = new AbortController()
    listTechnicianCompetencies(technicianId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ items, loading: false, error: '' })
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setState((current) => ({
            ...current,
            loading: false,
            error:
              reason instanceof Error
                ? reason.message
                : 'Não foi possível carregar as competências.',
          }))
      })
    return () => controller.abort()
  }, [technicianId, attempt])

  function retry() {
    setState((current) => ({ ...current, loading: true, error: '' }))
    setAttempt((current) => current + 1)
  }

  return { ...state, retry }
}
