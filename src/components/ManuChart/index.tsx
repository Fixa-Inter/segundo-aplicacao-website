import { useManuChartData } from '../../hooks/useManuChartData'
import type { ManuChartProps } from '../../types/charts'
import styles from './ManuChart.module.css'
import { ManuChartPlot } from './ManuChartPlot'
import { ManuChartTable } from './ManuChartTable'

export function ManuChart({ visualization }: ManuChartProps) {
  const chart = useManuChartData(visualization)
  const { id, t, formatDate, chartData, boxGroups, showChart, period, periodEnd } = chart
  return (
    <section className={styles.root} aria-labelledby={id} data-chart-kind={chartData.tipo}>
      <header>
        <h3 id={id}>{visualization.titulo}</h3>
        {visualization.status === 'SUCESSO_PARCIAL' && (
          <span className={styles.partial}>{t('Resultado parcial')}</span>
        )}
      </header>
      {period && (
        <p className={styles.period}>
          {formatDate(period.inicio, { dateStyle: 'short' })} –{' '}
          {formatDate(periodEnd, { dateStyle: 'short' })}
        </p>
      )}
      {showChart && (
        <div
          className={styles.chart}
          role="group"
          aria-label={visualization.titulo}
          style={
            chartData.tipo === 'boxplot'
              ? { height: Math.max(260, boxGroups.length * 48) }
              : undefined
          }
        >
          <ManuChartPlot chart={chart} />
        </div>
      )}
      {visualization.avisos.length > 0 && (
        <ul className={styles.warnings}>
          {[...new Set(visualization.avisos)].map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <ManuChartTable chart={chart} />
    </section>
  )
}
