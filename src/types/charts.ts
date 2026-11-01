import type { ManuChartModel } from '../hooks/useManuChartData'
import type { BoxGroup, ManuVisualization } from './visualization'

export interface ChartDatum {
  label: string
  value: number
  x?: number
  accent?: boolean
}

export interface BoxSummary {
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export interface DataChartProps {
  data?: ChartDatum[]
  kind?: 'bar' | 'line' | 'scatter' | 'box'
  label: string
  xLabel?: string
  yLabel?: string
  fill?: boolean
  softBars?: boolean
  box?: BoxSummary
}

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
