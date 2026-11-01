import type { TimeSeriesData, TimeSeriesLine } from '../types/charts'
import type { TemporalPoint, VisualizationGroup, VisualizationPoint } from '../types/visualization'

export function visualizationGroupKey(group: Record<string, unknown>): string {
  return JSON.stringify(Object.entries(group).sort(([a], [b]) => a.localeCompare(b)))
}

export function visualizationPointKey(point: VisualizationPoint | TemporalPoint): string {
  return (
    visualizationGroupKey(point.grupo) +
    ('data_referencia' in point ? '/' + point.data_referencia : '')
  )
}

export function buildTimeSeries(
  points: TemporalPoint[],
  label: (group: VisualizationGroup) => string,
): TimeSeriesData {
  const series = new Map<string, TimeSeriesLine>()
  const rows = new Map<string, Record<string, string | number | null>>()
  for (const point of points) {
    const id = visualizationGroupKey(point.grupo)
    const line = series.get(id) ?? { id, key: 's' + series.size, label: label(point.grupo) }
    series.set(id, line)
    const row = rows.get(point.data_referencia) ?? { date: point.data_referencia }
    row[line.key] = point.valor
    rows.set(point.data_referencia, row)
  }
  const lines = [...series.values()]
  const orderedRows = [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => {
      for (const line of lines) if (!(line.key in row)) row[line.key] = null
      return row
    })
  return { rows: orderedRows, series: lines }
}
