import type { EnumValue } from './shared'

export interface ApiGrade {
  id: number
  usuarioId: number
  categoriaProblema: EnumValue
  nota: number
  estaAtivo: boolean
}
