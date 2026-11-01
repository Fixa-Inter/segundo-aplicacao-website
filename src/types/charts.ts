export type ChartDatum = {
  label: string
  value: number
  x?: number
  accent?: boolean
}

export type BoxSummary = {
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export type DataChartProps = {
  data?: ChartDatum[]
  kind?: 'bar' | 'line' | 'scatter' | 'box'
  label: string
  xLabel?: string
  yLabel?: string
  fill?: boolean
  softBars?: boolean
  box?: BoxSummary
}
