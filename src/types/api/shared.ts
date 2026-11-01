import type { AxiosRequestConfig } from 'axios'
import type { User } from '../auth'
export type EnumValue = string | { id: number; nome: string }
export interface ManagementClient {
  request<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}
export type ManagementSession = () => User
