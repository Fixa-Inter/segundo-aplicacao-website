import { visualizationGroupKey, visualizationPointKey } from '../../../utils/chartData'
import type { ManuChartViewProps } from '../../../types/charts'
import styles from '../ManuChart.module.css'

export function ManuChartTable({ chart }: ManuChartViewProps) {
  const {
    visualization,
    t,
    formatDate,
    formatValue,
    formatGroup,
    chartData,
    unit,
    histogramBins,
    formatCoverage,
  } = chart
  return (
    <details className={styles.details}>
      <summary>{t('Ver dados do gráfico')}</summary>
      <div
        className={styles.tableScroll}
        tabIndex={0}
        role="region"
        aria-label={t('Dados do gráfico')}
      >
        <table>
          <caption>
            {visualization.titulo} · {unit}
          </caption>
          {chartData.tipo === 'categorias' || chartData.tipo === 'serie_temporal' ? (
            <>
              <thead>
                <tr>
                  {chartData.tipo === 'serie_temporal' && <th scope="col">{t('Data')}</th>}
                  <th scope="col">{t('Grupo')}</th>
                  <th scope="col">{unit}</th>
                  <th scope="col">{t('Registros')}</th>
                  <th scope="col">{t('Base elegível / total')}</th>
                  {chartData.tipo === 'serie_temporal' && (
                    <th scope="col">{t('Período consultado')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData.pontos.map((p) => (
                  <tr key={visualizationPointKey(p)}>
                    {'data_referencia' in p && (
                      <td>{formatDate(String(p.data_referencia), { dateStyle: 'short' })}</td>
                    )}
                    <th scope="row">{formatGroup(p.grupo)}</th>
                    <td>{formatValue(p.valor)}</td>
                    <td>{formatValue(p.qtd_registros)}</td>
                    <td>{formatCoverage(p.base_calculo)}</td>
                    {'data_referencia' in p && (
                      <td>
                        {'periodo' in p && p.periodo
                          ? `${formatDate(p.periodo.consultado.inicio, { dateStyle: 'short' })} – ${formatDate(new Date(Date.parse(p.periodo.consultado.fim) - 86400000).toISOString().slice(0, 10), { dateStyle: 'short' })}${p.periodo.parcial ? ' · ' + t('Parcial') : ''}`
                          : t('Não informado')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </>
          ) : chartData.tipo === 'histograma' ? (
            <>
              <thead>
                <tr>
                  <th scope="col">{t('Intervalo')}</th>
                  <th scope="col">{t('Frequência')}</th>
                </tr>
              </thead>
              <tbody>
                {histogramBins.map((b) => (
                  <tr key={`${b.inferior}:${b.superior}:${b.inclui_superior}`}>
                    <th scope="row">{b.label}</th>
                    <td>{formatValue(b.frequencia)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  {[
                    'Grupo',
                    'Registros',
                    'Mínimo',
                    'Q1',
                    'Mediana',
                    'Q3',
                    'Máximo',
                    'Média',
                    'Extremos omitidos',
                    'Base elegível / total',
                  ].map((s) => (
                    <th scope="col" key={s}>
                      {t(s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.grupos.map((g) => (
                  <tr key={visualizationGroupKey(g.grupo)}>
                    <th scope="row">
                      {formatGroup(g.grupo)}
                      {g.tipo === 'sem_base'
                        ? ' · ' + t('Sem dados')
                        : g.tipo === 'resumo'
                          ? ' · ' + t('Resumo')
                          : ''}
                    </th>
                    <td>{formatValue(g.qtd_registros)}</td>
                    {(
                      [
                        'minimo',
                        'q1',
                        'mediana',
                        'q3',
                        'maximo',
                        'media',
                        'qtd_extremos_omitidos',
                      ] as const
                    ).map((k) => (
                      <td key={k}>{formatValue(k in g ? Number(g[k as keyof typeof g]) : null)}</td>
                    ))}
                    <td>{formatCoverage(g.base_calculo)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </details>
  )
}
