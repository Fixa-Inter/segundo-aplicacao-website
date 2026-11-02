import type { ManuChartModel } from '../hooks/useManuChartData'
import type { BoxGroup, ManuVisualization } from './visualization'

export interface ManuChartProps {
  visualization: ManuVisualization
}

export interface ManuChartViewProps {
  chart: ManuChartModel
}

export interface BoxShapeProps {
  payload?: BoxGroup
  y?: number
  height?: number
  domain: [number, number]
}

export interface TimeSeriesLine {
  id: string
  key: string
  label: string
}

export interface TimeSeriesData {
  rows: Record<string, string | number | null>[]
  series: TimeSeriesLine[]
}
