export type VisualizationGroup = Record<string, string | number | null>
export interface CalculationBase {
  qtd_registros_total: number
  qtd_registros_elegiveis: number
  qtd_tempos_negativos_excluidos?: number
}
export interface VisualizationPoint {
  grupo: VisualizationGroup
  valor: number | null
  qtd_registros: number
  base_calculo?: CalculationBase | null
}
export interface TemporalPoint extends VisualizationPoint {
  data_referencia: string
  periodo?: { calendario: DateRange; consultado: DateRange; parcial: boolean } | null
}
export interface DateRange {
  inicio: string
  fim: string
}
export interface HistogramBin {
  inferior: number
  superior: number
  frequencia: number
  inclui_superior: boolean
}
export interface BoxGroup {
  tipo: 'boxplot'
  analise_id: string
  grupo: VisualizationGroup
  unidade: 'minutos'
  qtd_registros: number
  minimo: number
  q1: number
  mediana: number
  q3: number
  maximo: number
  limite_inferior: number
  limite_superior: number
  bigode_inferior: number
  bigode_superior: number
  valores_extremos: number[]
  qtd_extremos_total: number
  qtd_extremos_omitidos: number
  base_calculo?: CalculationBase | null
}
export interface SummaryGroup {
  tipo: 'resumo'
  analise_id: string
  grupo: VisualizationGroup
  unidade: 'minutos'
  qtd_registros: number
  minimo: number
  maximo: number
  media: number
  mediana: number
  motivo: 'POUCOS_REGISTROS_PARA_BOXPLOT'
  base_calculo?: CalculationBase | null
}
export interface EmptyGroup {
  tipo: 'sem_base'
  analise_id: string
  grupo: VisualizationGroup
  unidade: 'minutos'
  qtd_registros: 0
  motivo: 'SEM_OBSERVACOES_ELEGIVEIS'
  base_calculo: CalculationBase
}
export type VisualizationData =
  | { tipo: 'categorias'; pontos: VisualizationPoint[] }
  | { tipo: 'serie_temporal'; pontos: TemporalPoint[] }
  | { tipo: 'histograma'; intervalos: HistogramBin[]; qtd_registros: number }
  | { tipo: 'boxplot'; grupos: (BoxGroup | SummaryGroup | EmptyGroup)[] }
export interface ManuVisualization {
  versao_contrato: '1.0'
  visualizacao_id: string
  titulo: string
  status: 'SUCESSO' | 'SUCESSO_PARCIAL'
  metadados: {
    analise_id: string
    unidade_id: number
    unidade_medida: 'quantidade' | 'minutos' | 'percentual'
    escala_percentual?: 100 | null
    periodo?: DateRange | null
    granularidade?: 'dia' | 'semana' | 'mes' | null
    instante_snapshot?: string | null
    consultado_em: string
    filtros: Record<string, unknown>
    qtd_registros_considerados: number
    base_calculo?: CalculationBase | null
  }
  dados: VisualizationData
  avisos: string[]
}
