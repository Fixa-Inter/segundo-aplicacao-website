export interface ResourceOptions<T> {
  items: T[]
  loading: boolean
  error: string
  retry: () => void
}
export interface ResourceOptionsRequest<T> {
  loader: (signal: AbortSignal) => Promise<T[]>
  enabled: boolean
  attempt: number
  fallbackError: string
}
export interface ResourceOptionsState<T> {
  request: ResourceOptionsRequest<T> | null
  items: T[]
  error: string
}
