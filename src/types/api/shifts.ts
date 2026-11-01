export interface ApiShift {
  id: number
  unidadeId: number
  nome: string
  horaInicio: number
  horaFim: number
  estaAtivo: boolean
}

export interface ApiLink {
  id: number
  turnoId: number
  estaAtivo: boolean
}
