export interface ApiLocation {
  id: number
  unidadeId: number
  nome: string
  tipoLocalEndereco?: string | { id: number; nome: string }
  descricao?: string
  estaAtivo: boolean
}
