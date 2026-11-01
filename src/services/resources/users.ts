import type { ManagementClient } from '../../types/api/shared'
import type { ApiUser, ApiUserChanges, ApiUserQuery } from '../../types/api/users'
export function createUserService(client: ManagementClient) {
  const request = client.request
  async function listUsers(params?: ApiUserQuery): Promise<ApiUser[]> {
    return request<ApiUser[]>('/api/v1/usuarios', { params })
  }
  async function getUser(id: string, signal?: AbortSignal): Promise<ApiUser> {
    return request<ApiUser>(`/api/v1/usuarios/${id}`, { signal })
  }
  async function saveUser(data: ApiUserChanges, id?: string): Promise<ApiUser> {
    return request<ApiUser>(id ? `/api/v1/usuarios/${id}` : '/api/v1/usuarios', {
      method: id ? 'PATCH' : 'POST',
      data,
    })
  }
  async function setUserActive(id: string, active: boolean): Promise<ApiUser> {
    return request<ApiUser>(`/api/v1/usuarios/${id}/${active ? 'ativar' : 'desativar'}`, {
      method: 'PATCH',
    })
  }
  return { listUsers, getUser, saveUser, setUserActive }
}
