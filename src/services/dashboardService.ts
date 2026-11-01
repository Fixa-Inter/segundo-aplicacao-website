import type { DashboardAccess } from '../types/dashboard'
export type { DashboardAccess } from '../types/dashboard'
import { ApiError, type createHttpClient } from './httpClient.ts'

export function decodeDashboardAccess(value: unknown): DashboardAccess {
  const invalid = () => new ApiError('Não foi possível autorizar o dashboard da sua unidade.')
  if (!value || typeof value !== 'object') throw invalid()
  const v = value as Record<string, unknown>
  let origin: URL
  try {
    origin = new URL(String(v.instanceUrl))
  } catch {
    throw invalid()
  }
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    !['', '/'].includes(origin.pathname) ||
    !(
      origin.hostname.endsWith('.databricks.com') ||
      origin.hostname.endsWith('.azuredatabricks.net')
    ) ||
    origin.port ||
    typeof v.workspaceId !== 'string' ||
    !/^\d+$/.test(v.workspaceId) ||
    typeof v.dashboardId !== 'string' ||
    !/^[a-f0-9]{32}$/i.test(v.dashboardId) ||
    typeof v.token !== 'string' ||
    !v.token.trim() ||
    v.token.length > 32768 ||
    /\s/.test(v.token) ||
    typeof v.expiresIn !== 'number' ||
    !Number.isSafeInteger(v.expiresIn) ||
    v.expiresIn <= 0
  )
    throw invalid()
  return {
    instanceUrl: origin.origin,
    workspaceId: v.workspaceId,
    dashboardId: v.dashboardId,
    token: v.token,
    expiresIn: v.expiresIn,
  }
}
export function createDashboardService(client: ReturnType<typeof createHttpClient>) {
  return {
    async access(signal?: AbortSignal): Promise<DashboardAccess> {
      const data = await client.request<unknown>('/api/v1/dashboard/embed', {
        signal,
        timeout: 30000,
      })
      signal?.throwIfAborted()
      return decodeDashboardAccess(data)
    },
  }
}
