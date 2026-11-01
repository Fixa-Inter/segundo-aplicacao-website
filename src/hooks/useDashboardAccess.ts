import { useCallback } from 'react'
import { useAuth } from '../contexts/useAuth'
import { api } from '../services/api'
import { createDashboardService } from '../services/dashboardService'
import { ApiError } from '../services/httpClient'

const dashboards = createDashboardService(api)
export function useDashboardAccess() {
  const { user } = useAuth()
  return useCallback(
    (signal?: AbortSignal) => {
      if (!user) throw new ApiError('Entre novamente para continuar.', 401)
      return dashboards.access(signal)
    },
    [user],
  )
}
