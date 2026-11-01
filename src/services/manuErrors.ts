import { ApiError } from './httpClient'

export function errorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.status === 503 ||
      (error.status === 0 && error.message.startsWith('Não foi possível conectar à API.')))
  )
    return 'A Manu está temporariamente indisponível. Tente novamente mais tarde.'
  return error instanceof Error ? error.message : 'Não foi possível conectar à Manu.'
}
export function historyErrorMessage(reason: unknown) {
  return reason instanceof ApiError && [0, 503].includes(reason.status)
    ? 'Não foi possível carregar as conversas.'
    : errorMessage(reason)
}
