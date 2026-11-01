export interface ApiUnit {
  id: number
  instituicaoId?: number
  nome: string
  cnpj: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  estaAtivo: boolean
}

export interface InstitutionScope {
  currentUnit: ApiUnit
  units: ApiUnit[]
}
