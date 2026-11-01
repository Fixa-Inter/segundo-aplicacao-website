import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useResourceOptions } from '../../src/hooks/useResourceOptions'
import { useTechnicianCompetencies } from '../../src/hooks/useTechnicianCompetencies'
import { api as managementApi } from '../../src/services/api'

managementApi.setTokens({ token: 'browser-test-only', refreshToken: 'browser-test-refresh' })

type LoaderKey = 'first' | 'second' | 'throws'
interface Snapshot {
  items: unknown[]
  loading: boolean
  error: string
}
interface PendingRequest {
  id: number
  key: LoaderKey
  signal: AbortSignal
  resolve: (items: string[]) => void
  reject: (reason: unknown) => void
}
interface HarnessProps {
  enabled: boolean
  loaderKey: LoaderKey
  fallbackError: string
}
const requests: PendingRequest[] = []
const commits: Snapshot[] = []
const errors: string[] = []
let nextId = 0
const deferred =
  (key: LoaderKey) =>
  (signal: AbortSignal): Promise<string[]> =>
    new Promise((resolve, reject) => requests.push({ id: ++nextId, key, signal, resolve, reject }))
const loaders = {
  first: deferred('first'),
  second: deferred('second'),
  throws: (): Promise<string[]> => {
    throw new Error('Falha síncrona do carregador')
  },
}
export function Harness({ enabled, loaderKey, fallbackError }: HarnessProps) {
  const state = useResourceOptions(loaders[loaderKey], fallbackError, enabled)
  useLayoutEffect(() => {
    commits.push({ items: [...state.items], loading: state.loading, error: state.error })
  })
  return (
    <main>
      <output>
        {JSON.stringify({ items: state.items, loading: state.loading, error: state.error })}
      </output>
      <button type="button" onClick={state.retry}>
        Tentar novamente
      </button>
    </main>
  )
}
export function CompetencyHarness({ id }: { id?: string }) {
  const state = useTechnicianCompetencies(id)
  useLayoutEffect(() => {
    commits.push({
      items: state.items.map((item) => ({ id: item.id, rating: item.rating })),
      loading: state.loading,
      error: state.error,
    })
  })
  return <output>{JSON.stringify(state.items)}</output>
}
const root = createRoot(document.getElementById('root')!, {
  onUncaughtError: (error) => errors.push(error instanceof Error ? error.message : String(error)),
})
const api = {
  render(
    enabled = true,
    loaderKey: LoaderKey = 'first',
    fallbackError = 'Erro alternativo',
    strict = false,
  ) {
    flushSync(() =>
      root.render(
        strict ? (
          <StrictMode>
            <Harness {...{ enabled, loaderKey, fallbackError }} />
          </StrictMode>
        ) : (
          <Harness {...{ enabled, loaderKey, fallbackError }} />
        ),
      ),
    )
  },
  renderCompetencies(id?: string) {
    flushSync(() => root.render(<CompetencyHarness id={id} />))
  },
  resolve(id: number, items: string[]) {
    requests.find((request) => request.id === id)!.resolve(items)
  },
  reject(id: number, message: string | null) {
    requests
      .find((request) => request.id === id)!
      .reject(message === null ? null : new Error(message))
  },
  unmount() {
    flushSync(() => root.unmount())
  },
  read() {
    return {
      requests: requests.map((request) => ({
        id: request.id,
        key: request.key,
        aborted: request.signal.aborted,
      })),
      state: commits.at(-1),
      commits: commits.length,
      errors: [...errors],
    }
  },
}
declare global {
  interface Window {
    __resourceOptionsHarness: typeof api
  }
}
window.__resourceOptionsHarness = api
