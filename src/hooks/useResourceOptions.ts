import { useEffect, useState } from 'react'
import type { ResourceOptions, ResourceOptionsState } from '../types/resources'

export function useResourceOptions<T>(
  loader: (signal: AbortSignal) => Promise<T[]>,
  fallbackError: string,
  enabled = true,
): ResourceOptions<T> {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ResourceOptionsState<T>>({
    loader: null,
    attempt: 0,
    items: [],
    error: '',
  })
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    loader(controller.signal).then(
      (items) => {
        if (!controller.signal.aborted) setState({ loader, attempt, items, error: '' })
      },
      (reason: unknown) => {
        if (!controller.signal.aborted)
          setState({
            loader,
            attempt,
            items: [],
            error: reason instanceof Error ? reason.message : fallbackError,
          })
      },
    )
    return () => controller.abort()
  }, [loader, attempt, enabled, fallbackError])
  const current = enabled && state.loader === loader && state.attempt === attempt
  return {
    items: current ? state.items : [],
    loading: enabled && !current,
    error: current ? state.error : '',
    retry: () => setAttempt((value) => value + 1),
  }
}
