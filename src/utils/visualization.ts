import type { ManuVisualization } from '../types/visualization'

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
  !!candidate && typeof candidate === 'object' && !Array.isArray(candidate)
const isSafeNumber = (candidate: unknown): candidate is number =>
  typeof candidate === 'number' &&
  Number.isFinite(candidate) &&
  Math.abs(candidate) <= Number.MAX_SAFE_INTEGER
const isCount = (candidate: unknown): candidate is number =>
  isSafeNumber(candidate) && Number.isSafeInteger(candidate) && candidate >= 0
const isNonEmptyText = (candidate: unknown): candidate is string =>
  typeof candidate === 'string' && candidate.trim().length > 0 && candidate.length <= 2000
const isValidDate = (candidate: unknown): candidate is string =>
  typeof candidate === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(candidate) &&
  !Number.isNaN(Date.parse(candidate)) &&
  new Date(candidate).toISOString().slice(0, 10) === candidate
const isDateRange = (candidate: unknown): candidate is { inicio: string; fim: string } =>
  isRecord(candidate) &&
  isValidDate(candidate.inicio) &&
  isValidDate(candidate.fim) &&
  candidate.inicio < candidate.fim
const isGroup = (candidate: unknown) =>
  isRecord(candidate) &&
  Object.keys(candidate).length <= 20 &&
  Object.values(candidate).every(
    (x) =>
      x === null ||
      (typeof x === 'string' && x.length <= 1000) ||
      (isSafeNumber(x) && Number.isSafeInteger(x)),
  )
function isCalculationBase(candidate: unknown): boolean {
  return (
    candidate == null ||
    (isRecord(candidate) &&
      isCount(candidate.qtd_registros_total) &&
      isCount(candidate.qtd_registros_elegiveis) &&
      isCount(candidate.qtd_tempos_negativos_excluidos ?? 0) &&
      candidate.qtd_registros_elegiveis + Number(candidate.qtd_tempos_negativos_excluidos ?? 0) <=
        candidate.qtd_registros_total)
  )
}
function validBaseCount(candidate: Record<string, unknown>): boolean {
  return (
    isCalculationBase(candidate.base_calculo) &&
    (candidate.base_calculo == null ||
      (isRecord(candidate.base_calculo) &&
        candidate.qtd_registros === candidate.base_calculo.qtd_registros_elegiveis))
  )
}
function isDataPoint(candidate: unknown): candidate is Record<string, unknown> {
  return (
    isRecord(candidate) &&
    isGroup(candidate.grupo) &&
    (candidate.valor === null || (isSafeNumber(candidate.valor) && candidate.valor >= 0)) &&
    isCount(candidate.qtd_registros) &&
    validBaseCount(candidate) &&
    (candidate.base_calculo == null ||
      (candidate.valor === null) === (candidate.qtd_registros === 0))
  )
}
function isBoxGroup(candidate: unknown, analysisId: unknown): boolean {
  if (
    !isRecord(candidate) ||
    !isGroup(candidate.grupo) ||
    candidate.analise_id !== analysisId ||
    candidate.unidade !== 'minutos' ||
    !isCount(candidate.qtd_registros) ||
    !validBaseCount(candidate)
  )
    return false
  if (candidate.tipo === 'sem_base')
    return (
      candidate.qtd_registros === 0 &&
      isRecord(candidate.base_calculo) &&
      Number(candidate.base_calculo.qtd_registros_total) > 0 &&
      candidate.motivo === 'SEM_OBSERVACOES_ELEGIVEIS'
    )
  if (
    !['minimo', 'maximo', 'mediana'].every(
      (k) => isSafeNumber(candidate[k]) && Number(candidate[k]) >= 0,
    )
  )
    return false
  if (
    Number(candidate.minimo) > Number(candidate.mediana) ||
    Number(candidate.mediana) > Number(candidate.maximo)
  )
    return false
  if (candidate.tipo === 'resumo')
    return (
      candidate.qtd_registros > 0 &&
      candidate.qtd_registros < 5 &&
      isSafeNumber(candidate.media) &&
      candidate.media >= Number(candidate.minimo) &&
      candidate.media <= Number(candidate.maximo) &&
      candidate.motivo === 'POUCOS_REGISTROS_PARA_BOXPLOT'
    )
  if (
    candidate.tipo !== 'boxplot' ||
    candidate.qtd_registros < 5 ||
    !['q1', 'q3', 'limite_inferior', 'limite_superior', 'bigode_inferior', 'bigode_superior'].every(
      (k) => isSafeNumber(candidate[k]),
    )
  )
    return false
  if (!(
    Number(candidate.minimo) <= Number(candidate.q1) &&
    Number(candidate.q1) <= Number(candidate.mediana) &&
    Number(candidate.mediana) <= Number(candidate.q3) &&
    Number(candidate.q3) <= Number(candidate.maximo)
  ))
    return false
  if (!(
    Number(candidate.minimo) <= Number(candidate.bigode_inferior) &&
    Number(candidate.bigode_inferior) <= Number(candidate.bigode_superior) &&
    Number(candidate.bigode_superior) <= Number(candidate.maximo) &&
    Number(candidate.limite_inferior) <= Number(candidate.bigode_inferior) &&
    Number(candidate.bigode_superior) <= Number(candidate.limite_superior)
  ))
    return false
  return (
    Array.isArray(candidate.valores_extremos) &&
    candidate.valores_extremos.length <= 50 &&
    candidate.valores_extremos.every(
      (x) =>
        isSafeNumber(x) &&
        x >= Number(candidate.minimo) &&
        x <= Number(candidate.maximo) &&
        (x < Number(candidate.limite_inferior) || x > Number(candidate.limite_superior)),
    ) &&
    isCount(candidate.qtd_extremos_total) &&
    isCount(candidate.qtd_extremos_omitidos) &&
    candidate.valores_extremos.length + candidate.qtd_extremos_omitidos ===
      candidate.qtd_extremos_total &&
    candidate.qtd_extremos_total <= candidate.qtd_registros
  )
}

export function decodeVisualization(
  value: unknown,
  unitId: number | null,
): ManuVisualization | null {
  try {
    if (
      !isRecord(value) ||
      JSON.stringify(value).length > 256 * 1024 ||
      value.versao_contrato !== '1.0' ||
      !isNonEmptyText(value.visualizacao_id) ||
      !isNonEmptyText(value.titulo) ||
      !['SUCESSO', 'SUCESSO_PARCIAL'].includes(String(value.status))
    )
      return null
    const metadata = value.metadados
    const chartData = value.dados
    if (
      !isRecord(metadata) ||
      !isRecord(chartData) ||
      !isCount(metadata.unidade_id) ||
      metadata.unidade_id === 0 ||
      metadata.unidade_id !== unitId ||
      !/^VIS-\d{2}$/.test(String(metadata.analise_id)) ||
      !['quantidade', 'minutos', 'percentual'].includes(String(metadata.unidade_medida)) ||
      !isCount(metadata.qtd_registros_considerados) ||
      !isCalculationBase(metadata.base_calculo) ||
      (isRecord(metadata.base_calculo) &&
        metadata.qtd_registros_considerados !== metadata.base_calculo.qtd_registros_elegiveis) ||
      typeof metadata.consultado_em !== 'string' ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(metadata.consultado_em) ||
      Number.isNaN(Date.parse(metadata.consultado_em))
    )
      return null
    if (
      (metadata.periodo != null && !isDateRange(metadata.periodo)) ||
      (metadata.periodo != null && metadata.instante_snapshot != null) ||
      (metadata.escala_percentual != null && metadata.escala_percentual !== 100) ||
      !isRecord(metadata.filtros)
    )
      return null
    if (
      !Array.isArray(value.avisos) ||
      value.avisos.length > 100 ||
      !value.avisos.every(isNonEmptyText)
    )
      return null
    if (chartData.tipo === 'categorias' || chartData.tipo === 'serie_temporal') {
      if (
        !Array.isArray(chartData.pontos) ||
        !chartData.pontos.length ||
        chartData.pontos.length > (chartData.tipo === 'categorias' ? 50 : 500) ||
        !chartData.pontos.every(isDataPoint)
      )
        return null
      if (
        metadata.unidade_medida === 'percentual' &&
        chartData.pontos.some((p) => p.valor !== null && Number(p.valor) > 100)
      )
        return null
      const pointKeys = chartData.pontos.map(
        (p) =>
          JSON.stringify(Object.entries(p.grupo as Record<string, unknown>).sort()) +
          (chartData.tipo === 'serie_temporal' ? String(p.data_referencia) : ''),
      )
      if (new Set(pointKeys).size !== pointKeys.length) return null
      if (chartData.tipo === 'serie_temporal') {
        if (
          !isDateRange(metadata.periodo) ||
          !['dia', 'semana', 'mes'].includes(String(metadata.granularidade))
        )
          return null
        const selectedPeriod = metadata.periodo
        if (
          chartData.pontos.some((p) => {
            if (!isValidDate(p.data_referencia)) return true
            if (p.periodo == null)
              return (
                p.data_referencia < selectedPeriod.inicio || p.data_referencia >= selectedPeriod.fim
              )
            const period = p.periodo
            return (
              !isRecord(period) ||
              !isDateRange(period.calendario) ||
              !isDateRange(period.consultado) ||
              typeof period.parcial !== 'boolean' ||
              p.data_referencia !== period.calendario.inicio ||
              period.consultado.inicio !==
                [selectedPeriod.inicio, period.calendario.inicio].sort().at(-1) ||
              period.consultado.fim !== [selectedPeriod.fim, period.calendario.fim].sort()[0] ||
              period.parcial !==
                (period.calendario.inicio !== period.consultado.inicio ||
                  period.calendario.fim !== period.consultado.fim)
            )
          })
        )
          return null
      }
    } else if (chartData.tipo === 'histograma') {
      if (
        !isCount(chartData.qtd_registros) ||
        chartData.qtd_registros === 0 ||
        !Array.isArray(chartData.intervalos) ||
        !chartData.intervalos.length ||
        chartData.intervalos.length > 10
      )
        return null
      if (
        chartData.intervalos.some(
          (b, i, bins) =>
            !isRecord(b) ||
            !isSafeNumber(b.inferior) ||
            !isSafeNumber(b.superior) ||
            b.inferior < 0 ||
            b.inferior > b.superior ||
            !isCount(b.frequencia) ||
            typeof b.inclui_superior !== 'boolean' ||
            (i > 0 && Number(bins[i - 1].superior) > b.inferior),
        )
      )
        return null
      if (
        chartData.intervalos.reduce((sum, b) => sum + Number(b.frequencia), 0) !==
        chartData.qtd_registros
      )
        return null
    } else if (chartData.tipo === 'boxplot') {
      if (
        !Array.isArray(chartData.grupos) ||
        !chartData.grupos.length ||
        chartData.grupos.length > 50 ||
        !chartData.grupos.every((g) => isBoxGroup(g, metadata.analise_id)) ||
        chartData.grupos.reduce((n, g) => n + (g.valores_extremos?.length ?? 0), 0) > 500
      )
        return null
    } else return null
    return structuredClone(value) as unknown as ManuVisualization
  } catch {
    return null
  }
}

export function visualizationGroupLabel(
  group: Record<string, string | number | null>,
  empty: string,
  unknownLabel = 'Não informado',
): string {
  return (
    Object.values(group)
      .map((candidate) =>
        candidate === null ? unknownLabel : String(candidate).replaceAll('_', ' '),
      )
      .join(' · ') || empty
  )
}
