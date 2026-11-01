import type { EnumValue } from './shared'

export interface ApiUser {
  id: number
  unidadeId: number
  nomeCompleto: string
  email: string
  tipoAcesso: EnumValue
  cargo: string
  dataNascimento: string
  estaAtivo: boolean
}
export interface ApiUserChanges {
  nomeCompleto: string
  email: string
  cargo?: string
  dataNascimento: string
  unidadeId?: number
  tipoAcesso?: 'TECNICO'
  senha?: string
}
export interface ApiUserQuery {
  tipoAcesso?: string
  unidadeId?: number
}
