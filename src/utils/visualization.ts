import type { ManuVisualization } from '../types/visualization'

const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER
const count = (v: unknown): v is number => number(v) && Number.isSafeInteger(v) && v >= 0
const text = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= 2000
const date = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
const range = (v: unknown): v is { inicio: string; fim: string } =>
  object(v) && date(v.inicio) && date(v.fim) && v.inicio < v.fim
const group = (v: unknown) =>
  object(v) &&
  Object.keys(v).length <= 20 &&
  Object.values(v).every(
    (x) =>
      x === null ||
      (typeof x === 'string' && x.length <= 1000) ||
      (number(x) && Number.isSafeInteger(x)),
  )
function base(v: unknown): boolean {
  return (
    v == null ||
    (object(v) &&
      count(v.qtd_registros_total) &&
      count(v.qtd_registros_elegiveis) &&
      count(v.qtd_tempos_negativos_excluidos ?? 0) &&
      v.qtd_registros_elegiveis + Number(v.qtd_tempos_negativos_excluidos ?? 0) <=
        v.qtd_registros_total)
  )
}
function validBaseCount(v: Record<string, unknown>): boolean {
  return (
    base(v.base_calculo) &&
    (v.base_calculo == null ||
      (object(v.base_calculo) && v.qtd_registros === v.base_calculo.qtd_registros_elegiveis))
  )
}
function point(v: unknown): v is Record<string, unknown> {
  return (
    object(v) &&
    group(v.grupo) &&
    (v.valor === null || (number(v.valor) && v.valor >= 0)) &&
    count(v.qtd_registros) &&
    validBaseCount(v) &&
    (v.base_calculo == null || (v.valor === null) === (v.qtd_registros === 0))
  )
}
function box(v: unknown, analysis: unknown): boolean {
  if (
    !object(v) ||
    !group(v.grupo) ||
    v.analise_id !== analysis ||
    v.unidade !== 'minutos' ||
    !count(v.qtd_registros) ||
    !validBaseCount(v)
  )
    return false
  if (v.tipo === 'sem_base')
    return (
      v.qtd_registros === 0 &&
      object(v.base_calculo) &&
      Number(v.base_calculo.qtd_registros_total) > 0 &&
      v.motivo === 'SEM_OBSERVACOES_ELEGIVEIS'
    )
  if (!['minimo', 'maximo', 'mediana'].every((k) => number(v[k]) && Number(v[k]) >= 0)) return false
  if (Number(v.minimo) > Number(v.mediana) || Number(v.mediana) > Number(v.maximo)) return false
  if (v.tipo === 'resumo')
    return (
      v.qtd_registros > 0 &&
      v.qtd_registros < 5 &&
      number(v.media) &&
      v.media >= Number(v.minimo) &&
      v.media <= Number(v.maximo) &&
      v.motivo === 'POUCOS_REGISTROS_PARA_BOXPLOT'
    )
  if (
    v.tipo !== 'boxplot' ||
    v.qtd_registros < 5 ||
    !['q1', 'q3', 'limite_inferior', 'limite_superior', 'bigode_inferior', 'bigode_superior'].every(
      (k) => number(v[k]),
    )
  )
    return false
  if (!(
    Number(v.minimo) <= Number(v.q1) &&
    Number(v.q1) <= Number(v.mediana) &&
    Number(v.mediana) <= Number(v.q3) &&
    Number(v.q3) <= Number(v.maximo)
  ))
    return false
  if (!(
    Number(v.minimo) <= Number(v.bigode_inferior) &&
    Number(v.bigode_inferior) <= Number(v.bigode_superior) &&
    Number(v.bigode_superior) <= Number(v.maximo) &&
    Number(v.limite_inferior) <= Number(v.bigode_inferior) &&
    Number(v.bigode_superior) <= Number(v.limite_superior)
  ))
    return false
  return (
    Array.isArray(v.valores_extremos) &&
    v.valores_extremos.length <= 50 &&
    v.valores_extremos.every(
      (x) =>
        number(x) &&
        x >= Number(v.minimo) &&
        x <= Number(v.maximo) &&
        (x < Number(v.limite_inferior) || x > Number(v.limite_superior)),
    ) &&
    count(v.qtd_extremos_total) &&
    count(v.qtd_extremos_omitidos) &&
    v.valores_extremos.length + v.qtd_extremos_omitidos === v.qtd_extremos_total &&
    v.qtd_extremos_total <= v.qtd_registros
  )
}

// O contrato contém dados, nunca JSX, HTML ou opções executáveis vindas do modelo.
// Rejeita resultados inconsistentes sem impedir a leitura do texto da mensagem.
export function decodeVisualization(
  value: unknown,
  unitId: number | null,
): ManuVisualization | null {
  try {
    if (
      !object(value) ||
      JSON.stringify(value).length > 256 * 1024 ||
      value.versao_contrato !== '1.0' ||
      !text(value.visualizacao_id) ||
      !text(value.titulo) ||
      !['SUCESSO', 'SUCESSO_PARCIAL'].includes(String(value.status))
    )
      return null
    const meta = value.metadados,
      data = value.dados
    if (
      !object(meta) ||
      !object(data) ||
      !count(meta.unidade_id) ||
      meta.unidade_id === 0 ||
      meta.unidade_id !== unitId ||
      !/^VIS-\d{2}$/.test(String(meta.analise_id)) ||
      !['quantidade', 'minutos', 'percentual'].includes(String(meta.unidade_medida)) ||
      !count(meta.qtd_registros_considerados) ||
      !base(meta.base_calculo) ||
      (object(meta.base_calculo) &&
        meta.qtd_registros_considerados !== meta.base_calculo.qtd_registros_elegiveis) ||
      typeof meta.consultado_em !== 'string' ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(meta.consultado_em) ||
      Number.isNaN(Date.parse(meta.consultado_em))
    )
      return null
    if (
      (meta.periodo != null && !range(meta.periodo)) ||
      (meta.periodo != null && meta.instante_snapshot != null) ||
      (meta.escala_percentual != null && meta.escala_percentual !== 100) ||
      !object(meta.filtros)
    )
      return null
    if (!Array.isArray(value.avisos) || value.avisos.length > 100 || !value.avisos.every(text))
      return null
    if (data.tipo === 'categorias' || data.tipo === 'serie_temporal') {
      if (
        !Array.isArray(data.pontos) ||
        !data.pontos.length ||
        data.pontos.length > (data.tipo === 'categorias' ? 50 : 500) ||
        !data.pontos.every(point)
      )
        return null
      if (
        meta.unidade_medida === 'percentual' &&
        data.pontos.some((p) => p.valor !== null && Number(p.valor) > 100)
      )
        return null
      const identities = data.pontos.map(
        (p) =>
          JSON.stringify(Object.entries(p.grupo as Record<string, unknown>).sort()) +
          (data.tipo === 'serie_temporal' ? String(p.data_referencia) : ''),
      )
      if (new Set(identities).size !== identities.length) return null
      if (data.tipo === 'serie_temporal') {
        if (!range(meta.periodo) || !['dia', 'semana', 'mes'].includes(String(meta.granularidade)))
          return null
        const scope = meta.periodo
        if (
          data.pontos.some((p) => {
            if (!date(p.data_referencia)) return true
            if (p.periodo == null)
              return p.data_referencia < scope.inicio || p.data_referencia >= scope.fim
            const period = p.periodo
            return (
              !object(period) ||
              !range(period.calendario) ||
              !range(period.consultado) ||
              typeof period.parcial !== 'boolean' ||
              p.data_referencia !== period.calendario.inicio ||
              period.consultado.inicio !== [scope.inicio, period.calendario.inicio].sort().at(-1) ||
              period.consultado.fim !== [scope.fim, period.calendario.fim].sort()[0] ||
              period.parcial !==
                (period.calendario.inicio !== period.consultado.inicio ||
                  period.calendario.fim !== period.consultado.fim)
            )
          })
        )
          return null
      }
    } else if (data.tipo === 'histograma') {
      if (
        !count(data.qtd_registros) ||
        data.qtd_registros === 0 ||
        !Array.isArray(data.intervalos) ||
        !data.intervalos.length ||
        data.intervalos.length > 10
      )
        return null
      if (
        data.intervalos.some(
          (b, i, bins) =>
            !object(b) ||
            !number(b.inferior) ||
            !number(b.superior) ||
            b.inferior < 0 ||
            b.inferior > b.superior ||
            !count(b.frequencia) ||
            typeof b.inclui_superior !== 'boolean' ||
            (i > 0 && Number(bins[i - 1].superior) > b.inferior),
        )
      )
        return null
      if (data.intervalos.reduce((sum, b) => sum + Number(b.frequencia), 0) !== data.qtd_registros)
        return null
    } else if (data.tipo === 'boxplot') {
      if (
        !Array.isArray(data.grupos) ||
        !data.grupos.length ||
        data.grupos.length > 50 ||
        !data.grupos.every((g) => box(g, meta.analise_id)) ||
        data.grupos.reduce((n, g) => n + (g.valores_extremos?.length ?? 0), 0) > 500
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
      .map((v) => (v === null ? unknownLabel : String(v).replaceAll('_', ' ')))
      .join(' · ') || empty
  )
}
