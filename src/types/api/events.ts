export interface ApiEvent {
  id: number
  usuarioId: number
  localEnderecoId: number
  titulo: string
  descricao: string
  descricaoLocal: string
  observacao: string | null
  dataHoraInicio: string
  dataHoraFim: string
}
