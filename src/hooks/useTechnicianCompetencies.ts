import { useEffect, useRef, useState } from 'react'
import { listTechnicianCompetencies, saveTechnicianCompetency } from '../services/managementService'
import type { CompetenciesResult, CompetenciesState, CompetencyInput } from '../types/competency'

export function useTechnicianCompetencies(technicianId: string): CompetenciesResult {
  const [state, setState] = useState<CompetenciesState>({
    items: [],
    loading: true,
    error: '',
    saving: false,
  })
  const [attempt, setAttempt] = useState(0)
  const saveController = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    listTechnicianCompetencies(technicianId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted)
          setState((current) => ({ ...current, items, loading: false, error: '' }))
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

  useEffect(() => () => saveController.current?.abort(), [])

  function retry() {
    setState((current) => ({ ...current, loading: true, error: '' }))
    setAttempt((current) => current + 1)
  }

  async function save(input: CompetencyInput) {
    if (saveController.current) throw new Error('Aguarde o salvamento da competência.')
    const controller = new AbortController()
    saveController.current = controller
    setState((current) => ({ ...current, saving: true }))
    try {
      const saved = await saveTechnicianCompetency(technicianId, input, controller.signal)
      if (!controller.signal.aborted)
        setState((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === saved.id ? saved : item)),
        }))
      return saved
    } finally {
      saveController.current = null
      if (!controller.signal.aborted) setState((current) => ({ ...current, saving: false }))
    }
  }

  return { ...state, retry, save }
}
