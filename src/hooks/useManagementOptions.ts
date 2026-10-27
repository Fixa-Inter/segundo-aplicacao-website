import { useCallback } from 'react'
import { listLocations, listShifts, listWorkUnits } from '../services/managementService'
import type { LocationOption, ShiftOption, WorkUnitOption } from '../types/management'
import type { ResourceOptions } from '../types/resources'
import { useResourceOptions } from './useResourceOptions'

export function useEventLocations(): ResourceOptions<LocationOption> {
  return useResourceOptions(listLocations, 'Não foi possível carregar os locais.')
}
export function useWorkUnits(enabled: boolean): ResourceOptions<WorkUnitOption> {
  return useResourceOptions(
    listWorkUnits,
    'Não foi possível carregar as unidades de trabalho.',
    enabled,
  )
}
export function useShifts(unitId?: string): ResourceOptions<ShiftOption> {
  const loader = useCallback((signal: AbortSignal) => listShifts(unitId, signal), [unitId])
  return useResourceOptions(loader, 'Não foi possível carregar os turnos.')
}
