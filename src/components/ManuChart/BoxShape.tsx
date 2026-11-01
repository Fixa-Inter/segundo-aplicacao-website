import { usePlotArea } from 'recharts'
import type { BoxGroup } from '../../types/visualization'
import { colors } from './chartTheme'

export function BoxShape({
  payload,
  y,
  height,
  domain: valueDomain,
}: {
  payload?: BoxGroup
  y?: number
  height?: number
  domain: [number, number]
}) {
  const area = usePlotArea()
  if (!area || !payload || typeof y !== 'number' || typeof height !== 'number') return <g />
  const x = (n: number) =>
    area.x + ((n - valueDomain[0]) / (valueDomain[1] - valueDomain[0])) * area.width
  const center = y + height / 2
  const top = y + height * 0.15
  const bottom = y + height * 0.85
  return (
    <g stroke={colors[0]} strokeWidth={2}>
      <line
        x1={x(payload.bigode_inferior)}
        x2={x(payload.bigode_superior)}
        y1={center}
        y2={center}
      />
      {[payload.bigode_inferior, payload.bigode_superior].map((n, i) => (
        <line key={i} x1={x(n)} x2={x(n)} y1={top} y2={bottom} />
      ))}
      <rect
        x={x(payload.q1)}
        y={top}
        width={Math.max(1, x(payload.q3) - x(payload.q1))}
        height={bottom - top}
        fill="#d7e5fa"
      />
      <line x1={x(payload.mediana)} x2={x(payload.mediana)} y1={top} y2={bottom} />
      {payload.valores_extremos.map((n, i) => (
        <circle key={i} cx={x(n)} cy={center} r={3} fill={colors[1]} />
      ))}
    </g>
  )
}
