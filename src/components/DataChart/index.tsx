import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import type { DataChartProps } from '../../types/charts'
import { chartScale } from '../../utils/chartScale'
import styles from './DataChart.module.css'

export function DataChart({
  data = [],
  kind = 'bar',
  label,
  xLabel,
  yLabel,
  fill = false,
  softBars = false,
  box,
}: DataChartProps) {
  const { formatNumber } = usePreferences()
  const root = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 400, height: 240 })
  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const { width, height } = size
  const left = yLabel ? 60 : 38
  const right = width - 18
  const top = 28
  const bottom = height - (xLabel ? 50 : 30)
  const plotWidth = right - left
  const plotHeight = bottom - top
  const number = (value: number) => formatNumber(value, { maximumFractionDigits: 2 })
  const yScale = chartScale(Math.max(0, ...data.map((item) => item.value)), kind !== 'scatter')
  const xScale = chartScale(
    box?.max ?? Math.max(0, ...data.map((item) => item.x ?? 0)),
    kind === 'scatter',
  )
  const x = (value: number) => left + (value / xScale.max) * plotWidth
  const y = (value: number) => bottom - (value / yScale.max) * plotHeight
  const categoryX = (index: number) => left + ((index + 0.5) / Math.max(1, data.length)) * plotWidth
  const points = data.map((item, index) => `${categoryX(index)},${y(item.value)}`).join(' ')
  return (
    <div
      ref={root}
      className={`${styles.root} ${fill ? styles.fill : ''} ${kind === 'box' ? styles.box : ''}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {kind !== 'box' &&
          yScale.ticks.map((tick) => (
            <g key={tick}>
              <line className={styles.grid} x1={left} x2={right} y1={y(tick)} y2={y(tick)} />
              <text className={styles.tick} x={left - 9} y={y(tick) + 4} textAnchor="end">
                {number(tick)}
              </text>
            </g>
          ))}
        {(kind === 'scatter' || kind === 'box') &&
          xScale.ticks.map((tick) => (
            <g key={tick}>
              <line className={styles.grid} x1={x(tick)} x2={x(tick)} y1={top} y2={bottom} />
              <text className={styles.tick} x={x(tick)} y={bottom + 20} textAnchor="middle">
                {number(tick)}
              </text>
            </g>
          ))}
        <line className={styles.axis} x1={left} x2={right} y1={bottom} y2={bottom} />
        {kind === 'line' && <polyline className={styles.line} points={points} />}
        {(kind === 'bar' || kind === 'line') &&
          data.map((item, index) => {
            const barWidth = Math.min(50, (plotWidth / data.length) * 0.58)
            return (
              <g key={item.label}>
                {kind === 'bar' ? (
                  <rect
                    x={categoryX(index) - barWidth / 2}
                    y={y(item.value)}
                    width={barWidth}
                    height={bottom - y(item.value)}
                    rx={Math.min(14, barWidth / 2)}
                    className={softBars && !item.accent ? styles.softBar : styles.bar}
                  />
                ) : (
                  <circle className={styles.point} cx={categoryX(index)} cy={y(item.value)} r={4} />
                )}
                <text
                  className={styles.value}
                  x={categoryX(index)}
                  y={y(item.value) - 9}
                  textAnchor="middle"
                >
                  {number(item.value)}
                </text>
                <text
                  className={styles.tick}
                  x={categoryX(index)}
                  y={bottom + 20}
                  textAnchor="middle"
                >
                  {item.label}
                </text>
                <title>
                  {item.label}: {number(item.value)}
                </title>
              </g>
            )
          })}
        {kind === 'scatter' &&
          data.map((item) => (
            <g key={item.label}>
              <circle className={styles.point} cx={x(item.x ?? 0)} cy={y(item.value)} r={5} />
              <title>
                {item.label}: {xLabel} {number(item.x ?? 0)}; {yLabel} {number(item.value)}
              </title>
            </g>
          ))}
        {kind === 'box' && box && (
          <g>
            <line
              className={styles.whisker}
              x1={x(box.min)}
              x2={x(box.max)}
              y1={(top + bottom) / 2}
              y2={(top + bottom) / 2}
            />
            {[box.min, box.max].map((value, index) => (
              <line
                key={index}
                className={styles.whisker}
                x1={x(value)}
                x2={x(value)}
                y1={top + plotHeight * 0.3}
                y2={bottom - plotHeight * 0.3}
              />
            ))}
            <rect
              className={styles.boxBody}
              x={x(box.q1)}
              y={top + plotHeight * 0.2}
              width={Math.max(1, x(box.q3) - x(box.q1))}
              height={plotHeight * 0.6}
              rx={4}
            />
            <line
              className={styles.whisker}
              x1={x(box.median)}
              x2={x(box.median)}
              y1={top + plotHeight * 0.2}
              y2={bottom - plotHeight * 0.2}
            />
            <text className={styles.value} x={x(box.median)} y={top - 8} textAnchor="middle">
              {number(box.median)}
            </text>
          </g>
        )}
        {xLabel && (
          <text
            className={styles.caption}
            x={(left + right) / 2}
            y={height - 4}
            textAnchor="middle"
          >
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            className={styles.caption}
            x={14}
            y={(top + bottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${(top + bottom) / 2})`}
          >
            {yLabel}
          </text>
        )}
      </svg>
    </div>
  )
}
