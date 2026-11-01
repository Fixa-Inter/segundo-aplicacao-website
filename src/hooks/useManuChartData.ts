import { buildTimeSeries } from '../utils/chartData'
import { useId, useMemo } from 'react'
import { usePreferences } from '../contexts/usePreferences'
import type { BoxGroup, ManuVisualization } from '../types/visualization'
import { visualizationGroupLabel } from '../utils/visualization'

export function useManuChartData(visualization: ManuVisualization) {
  const id = useId()
  const { t, formatNumber, formatDate } = usePreferences()
  const formatValue = (n: number | null) =>
    n === null ? t('Sem dados') : formatNumber(n, { maximumFractionDigits: 2 })
  const formatGroup = (g: Record<string, string | number | null>) =>
    visualizationGroupLabel(g, t('Total'), t('Não informado'))
  const metadata = visualization.metadados
  const chartData = visualization.dados
  const unit = t(
    metadata.unidade_medida === 'minutos'
      ? 'Minutos'
      : metadata.unidade_medida === 'percentual'
        ? 'Percentual (%)'
        : 'Quantidade',
  )
  const categories =
    chartData.tipo === 'categorias'
      ? chartData.pontos.map((p) => ({ ...p, label: formatGroup(p.grupo) }))
      : []
  const histogramBins =
    chartData.tipo === 'histograma'
      ? chartData.intervalos.map((b) => ({
          ...b,
          label: `[${formatValue(b.inferior)} – ${formatValue(b.superior)}${b.inclui_superior ? ']' : ')'}`,
        }))
      : []
  const timeSeries = useMemo(
    () =>
      buildTimeSeries(
        visualization.dados.tipo === 'serie_temporal' ? visualization.dados.pontos : [],
        (group) => visualizationGroupLabel(group, t('Total'), t('Não informado')),
      ),
    [visualization, t],
  )
  const boxGroups =
    chartData.tipo === 'boxplot'
      ? chartData.grupos
          .filter((g): g is BoxGroup => g.tipo === 'boxplot')
          .map((g) => ({ ...g, label: formatGroup(g.grupo), range: [g.q1, g.q3] }))
      : []
  const domain: [number, number] = [0, Math.max(1, ...boxGroups.map((g) => g.maximo)) * 1.05]
  const showChart = chartData.tipo !== 'boxplot' || boxGroups.length > 0
  const dateLabel = (date: string) =>
    formatDate(date, {
      day: '2-digit',
      month: 'short',
      ...(metadata.granularidade === 'mes' ? { year: '2-digit', day: undefined } : {}),
    })
  const tooltipStyle = {
    background: 'var(--fixa-surface)',
    border: '1px solid var(--fixa-border)',
    borderRadius: 12,
    color: 'var(--fixa-ink)',
    fontSize: 12,
  }
  const formatCoverage = (
    b: { qtd_registros_elegiveis: number; qtd_registros_total: number } | null | undefined,
  ) =>
    b
      ? `${formatValue(b.qtd_registros_elegiveis)} / ${formatValue(b.qtd_registros_total)}`
      : t('Não se aplica')
  const period = metadata.periodo
  const periodEnd = period
    ? new Date(Date.parse(period.fim) - 86400000).toISOString().slice(0, 10)
    : ''

  return {
    visualization,
    id,
    t,
    formatNumber,
    formatDate,
    formatValue,
    formatGroup,
    metadata,
    chartData,
    unit,
    categories,
    histogramBins,
    timeSeries,
    boxGroups,
    domain,
    showChart,
    dateLabel,
    tooltipStyle,
    formatCoverage,
    period,
    periodEnd,
  }
}
export type ManuChartModel = ReturnType<typeof useManuChartData>
