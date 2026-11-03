export interface ApiShift {
  id: number
  unidadeId: number
  nome: string
  horaInicio: number
  horaFim: number
  atravessaMeiaNoite?: boolean
  estaAtivo: boolean
}

export interface ApiLink {
  id: number
  turnoId: number
  estaAtivo: boolean
}
