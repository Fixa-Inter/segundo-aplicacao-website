import axios, { type AxiosAdapter, type AxiosRequestConfig } from 'axios'

export interface SessionTokens {
  token: string
  refreshToken: string
}
export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
export function createHttpClient(baseURL?: string, adapter?: AxiosAdapter) {
  const transport = axios.create({ baseURL, timeout: 15000, adapter })
  let tokens: SessionTokens | null = null
  let version = 0
  let refreshing: Promise<void> | null = null
  const listeners = new Set<() => void>()
  const tokenListeners = new Set<(value: SessionTokens | null) => void>()
  function setTokens(value: SessionTokens | null) {
    tokens = value
    tokenListeners.forEach((fn) => fn(value))
  }
  function clear() {
    version++
    setTokens(null)
    refreshing = null
  }
  function expire() {
    clear()
    listeners.forEach((fn) => fn())
  }
  function active(expected: number) {
    if (expected !== version) throw new ApiError('A sessão foi encerrada. Entre novamente.', 401)
  }
  function normalize(error: unknown): Error {
    if (error instanceof ApiError || axios.isCancel(error)) return error
    if (!axios.isAxiosError(error))
      return error instanceof Error ? error : new ApiError('Não foi possível concluir a operação.')
    const status = error.response?.status ?? 0
    const data: unknown = error.response?.data
    const fallback =
      status === 401
        ? 'Credenciais inválidas ou sessão expirada.'
        : status === 403
          ? 'Você não tem permissão para esta operação.'
          : status >= 500
            ? 'O servidor não conseguiu concluir a operação. Tente novamente.'
            : status === 0
              ? 'Não foi possível conectar à API. Confira o endereço do servidor e sua conexão.'
              : 'Não foi possível concluir a operação.'
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
      return new ApiError(
        fields.length
          ? fields.join(' ')
          : typeof body.erro === 'string'
            ? body.erro
            : typeof body.mensagem === 'string'
              ? body.mensagem
              : typeof body.detail === 'string'
                ? body.detail
                : fallback,
        status,
      )
    }
    return new ApiError(
      typeof data === 'string' && data.length < 250 && !data.includes('<') ? data : fallback,
      status,
    )
  }
  async function request<T>(
    url: string,
    config: AxiosRequestConfig & { anonymous?: boolean } = {},
  ): Promise<T> {
    if (!baseURL)
      throw new ApiError('Configure VITE_API_BASE_URL com o endereço da API para continuar.')
    const expected = version
    const { anonymous = false, ...options } = config
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
        active(expected)
        if (anonymous || !axios.isAxiosError(error) || error.response?.status !== 401) throw error
        if (sentToken === tokens?.token) {
          if (!refreshing) {
            const refreshToken = tokens?.refreshToken
            refreshing = transport
              .post<SessionTokens>('/auth/refresh', { refreshToken })
              .then(({ data }) => {
                active(expected)
                if (!data.token || !data.refreshToken)
                  throw new ApiError('Resposta de autenticação inválida.', 401)
                setTokens({ token: data.token, refreshToken: data.refreshToken })
              })
              .catch((reason: unknown) => {
                if (
                  expected === version &&
                  axios.isAxiosError(reason) &&
                  reason.response?.status === 401
                )
                  expire()
                throw reason
              })
              .finally(() => {
                if (expected === version) refreshing = null
              })
          }
          await refreshing
        }
        active(expected)
        response = await send()
      }
      active(expected)
      return response.data
    } catch (error) {
      if (
        !anonymous &&
        expected === version &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      )
        expire()
      throw normalize(error)
    }
  }
  return {
    request,
    clear,
    expire,
    setTokens,
    getTokens: () => tokens,
    getVersion: () => version,
    onExpired(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
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
