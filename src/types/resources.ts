export interface ResourceOptions<T> {
  items: T[]
  loading: boolean
  error: string
  retry: () => void
}
export interface ResourceOptionsState<T> {
  loader: ((signal: AbortSignal) => Promise<T[]>) | null
  attempt: number
  items: T[]
  error: string
}
