import { useCallback, useMemo } from 'react'
import { listTechnicianCompetencies } from '../services/managementService'
import type { CompetenciesResult } from '../types/competency'
import { competencyCategories } from '../utils/competencies'
import { useResourceOptions } from './useResourceOptions'

export function useTechnicianCompetencies(technicianId?: string): CompetenciesResult {
  const emptyItems = useMemo(
    () => competencyCategories.map((item) => ({ ...item, rating: null })),
    [],
  )
  const loader = useCallback(
    (signal: AbortSignal) =>
      technicianId ? listTechnicianCompetencies(technicianId, signal) : Promise.resolve(emptyItems),
    [technicianId, emptyItems],
  )
  const state = useResourceOptions(
    loader,
    'Não foi possível carregar as competências.',
    Boolean(technicianId),
  )
  return technicianId ? state : { ...state, items: emptyItems }
}
