import { useEffect, useMemo, useState } from 'react'
import type { ResourceOptions, ResourceOptionsState } from '../types/resources'

export function useResourceOptions<T>(
  loader: (signal: AbortSignal) => Promise<T[]>,
  fallbackError: string,
  enabled = true,
): ResourceOptions<T> {
  const [attempt, setAttempt] = useState(0)
  // A identidade inclui desativação/reativação; resultados de uma leitura anterior não são reutilizados.
  const request = useMemo(
    () => ({ loader, fallbackError, enabled, attempt }),
    [loader, fallbackError, enabled, attempt],
  )
  const [state, setState] = useState<ResourceOptionsState<T>>({
    request: null,
    items: [],
    error: '',
  })
  useEffect(() => {
    if (!request.enabled) return
    const controller = new AbortController()
    async function load() {
      try {
        const items = await request.loader(controller.signal)
        if (!controller.signal.aborted) setState({ request, items, error: '' })
      } catch (reason: unknown) {
        if (!controller.signal.aborted)
          setState({
            request,
            items: [],
            error: reason instanceof Error ? reason.message : request.fallbackError,
          })
      }
    }
    void load()
    return () => controller.abort()
  }, [request])
  const current = enabled && state.request === request
  return {
    items: current ? state.items : [],
    loading: enabled && !current,
    error: current ? state.error : '',
    retry: () => setAttempt((value) => value + 1),
  }
}
