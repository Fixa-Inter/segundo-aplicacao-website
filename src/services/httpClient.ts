import axios, { type AxiosAdapter, type AxiosRequestConfig } from 'axios'
import type { SessionTokens } from '../types/api/auth'

export type { SessionTokens } from '../types/api/auth'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
function defaultErrorMessage(status: number): string {
  if (status === 401) return 'Credenciais inválidas ou sessão expirada.'
  if (status === 403) return 'Você não tem permissão para esta operação.'
  if (status >= 500) return 'O servidor não conseguiu concluir a operação. Tente novamente.'
  if (status === 0)
    return 'Não foi possível conectar à API. Confira o endereço do servidor e sua conexão.'
  return 'Não foi possível concluir a operação.'
}

export function createHttpClient(baseURL?: string, adapter?: AxiosAdapter) {
  const transport = axios.create({ baseURL, timeout: 15000, adapter })
  let tokens: SessionTokens | null = null
  let sessionVersion = 0
  let refreshPromise: Promise<void> | null = null
  const expiredSessionListeners = new Set<() => void>()
  const tokenListeners = new Set<(value: SessionTokens | null) => void>()
  function setTokens(value: SessionTokens | null) {
    tokens = value
    tokenListeners.forEach((fn) => fn(value))
  }
  function clear() {
    sessionVersion++
    setTokens(null)
    refreshPromise = null
  }
  function expire() {
    clear()
    expiredSessionListeners.forEach((fn) => fn())
  }
  function assertActiveSession(expected: number) {
    if (expected !== sessionVersion)
      throw new ApiError('A sessão foi encerrada. Entre novamente.', 401)
  }
  function normalizeRequestError(error: unknown): Error {
    if (error instanceof ApiError || axios.isCancel(error)) return error
    if (!axios.isAxiosError(error))
      return error instanceof Error ? error : new ApiError('Não foi possível concluir a operação.')
    const status = error.response?.status ?? 0
    const data: unknown = error.response?.data
    const fallback = defaultErrorMessage(status)
    if (data && typeof data === 'object') {
      const body = data as {
        erro?: unknown
        campos?: Record<string, unknown>
        mensagem?: unknown
        detail?: unknown
      }
      const fields = body.campos
        ? Object.values(body.campos).filter((item) => typeof item === 'string')
        : []
      if (fields.length) return new ApiError(fields.join(' '), status)
      for (const message of [body.erro, body.mensagem, body.detail]) {
        if (typeof message === 'string') return new ApiError(message, status)
      }
      return new ApiError(fallback, status)
    }
    return new ApiError(
      typeof data === 'string' && data.length < 250 && !data.includes('<') ? data : fallback,
      status,
    )
  }
  async function request<T>(
    url: string,
    config: AxiosRequestConfig & {
      anonymous?: boolean
      expireSessionOnUnauthorized?: boolean
    } = {},
  ): Promise<T> {
    if (!baseURL)
      throw new ApiError('Configure VITE_API_BASE_URL com o endereço da API para continuar.')
    const expected = sessionVersion
    const { anonymous = false, expireSessionOnUnauthorized = true, ...options } = config
    if (!anonymous && !tokens) throw new ApiError('Entre novamente para continuar.', 401)
    const sentToken = tokens?.token
    const send = () =>
      transport.request<T>({
        ...options,
        url,
        headers: {
          ...options.headers,
          ...(!anonymous && tokens ? { Authorization: `Bearer ${tokens.token}` } : {}),
        },
      })
    try {
      let response
      try {
        response = await send()
      } catch (error) {
        assertActiveSession(expected)
        if (anonymous || !axios.isAxiosError(error) || error.response?.status !== 401) throw error
        if (sentToken === tokens?.token) {
          if (!refreshPromise) {
            const refreshToken = tokens?.refreshToken
            refreshPromise = transport
              .post<SessionTokens>('/auth/refresh', { refreshToken })
              .then(({ data }) => {
                assertActiveSession(expected)
                if (
                  !data ||
                  typeof data.token !== 'string' ||
                  !data.token.trim() ||
                  typeof data.refreshToken !== 'string' ||
                  !data.refreshToken.trim()
                )
                  throw new ApiError('Resposta de autenticação inválida.', 401)
                setTokens({ token: data.token, refreshToken: data.refreshToken })
              })
              .catch((reason: unknown) => {
                const unauthorized =
                  reason instanceof ApiError
                    ? reason.status === 401
                    : axios.isAxiosError(reason) && reason.response?.status === 401
                if (expected === sessionVersion && unauthorized) expire()
                throw reason
              })
              .finally(() => {
                if (expected === sessionVersion) refreshPromise = null
              })
          }
          await refreshPromise
        }
        assertActiveSession(expected)
        response = await send()
      }
      assertActiveSession(expected)
      return response.data
    } catch (error) {
      if (
        !anonymous &&
        expireSessionOnUnauthorized &&
        expected === sessionVersion &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      )
        expire()
      throw normalizeRequestError(error)
    }
  }
  return {
    request,
    clear,
    expire,
    setTokens,
    getTokens: () => tokens,
    getVersion: () => sessionVersion,
    onExpired(fn: () => void) {
      expiredSessionListeners.add(fn)
      return () => {
        expiredSessionListeners.delete(fn)
      }
    },
    onTokens(fn: (value: SessionTokens | null) => void) {
      tokenListeners.add(fn)
      return () => {
        tokenListeners.delete(fn)
      }
    },
  }
}
