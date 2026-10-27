export interface SessionTokens {
  token: string
  refreshToken: string
}

export interface LoginResponse {
  usuarioId: number
  nome: string
  tipoAcesso: string
  token: string
  refreshToken: string
}
