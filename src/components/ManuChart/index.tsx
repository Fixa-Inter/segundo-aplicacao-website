import { useId, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
} from 'recharts'
import type { BoxGroup, ManuVisualization } from '../../types/visualization'
import { visualizationGroupLabel } from '../../utils/visualization'
import { usePreferences } from '../../contexts/usePreferences'
import styles from './ManuChart.module.css'

const colors = ['var(--fixa-text-primary)', '#527ec0', '#9349ac', '#078277', '#c77b16', '#995067']
// O desenho usa a área e a escala do Recharts, inclusive quando Q1 e Q3 são iguais.
function BoxShape({
  payload,
  y,
  height,
  domain,
}: {
  payload?: BoxGroup
  y?: number
  height?: number
  domain: [number, number]
}) {
  const area = usePlotArea()
  if (!area || !payload || typeof y !== 'number' || typeof height !== 'number') return <g />
  const x = (n: number) => area.x + ((n - domain[0]) / (domain[1] - domain[0])) * area.width
  const center = y + height / 2,
    top = y + height * 0.15,
    bottom = y + height * 0.85
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

export function ManuChart({ visualization: v }: { visualization: ManuVisualization }) {
  const id = useId()
  const { t, formatNumber, formatDate } = usePreferences()
  const number = (n: number | null) =>
    n === null ? t('Sem dados') : formatNumber(n, { maximumFractionDigits: 2 })
  const group = (g: Record<string, string | number | null>) =>
    visualizationGroupLabel(g, t('Total'), t('Não informado'))
  const meta = v.metadados,
    data = v.dados
  const unit = t(
    meta.unidade_medida === 'minutos'
      ? 'Minutos'
      : meta.unidade_medida === 'percentual'
        ? 'Percentual (%)'
        : 'Quantidade',
  )
  const categories =
    data.tipo === 'categorias'
      ? data.pontos.map((p, i) => ({ ...p, label: group(p.grupo), key: i }))
      : []
  const bins =
    data.tipo === 'histograma'
      ? data.intervalos.map((b) => ({
          ...b,
          label: `[${number(b.inferior)} – ${number(b.superior)}${b.inclui_superior ? ']' : ')'}`,
        }))
      : []
  const temporal = useMemo(() => {
    if (v.dados.tipo !== 'serie_temporal') return { rows: [], series: [] }
    const signatures = [
      ...new Set(v.dados.pontos.map((p) => JSON.stringify(Object.entries(p.grupo).sort()))),
    ]
    const series = signatures.map((sig, i) => ({
      key: 's' + i,
      label: visualizationGroupLabel(
        Object.fromEntries(JSON.parse(sig)),
        t('Total'),
        t('Não informado'),
      ),
    }))
    const dates = [...new Set(v.dados.pontos.map((p) => p.data_referencia))].sort()
    const rows = dates.map((date) => {
      const row: Record<string, string | number | null> = { date }
      series.forEach((s) => {
        row[s.key] = null
      })
      if (v.dados.tipo === 'serie_temporal')
        v.dados.pontos
          .filter((p) => p.data_referencia === date)
          .forEach((p) => {
            const i = signatures.indexOf(JSON.stringify(Object.entries(p.grupo).sort()))
            row['s' + i] = p.valor
          })
      return row
    })
    return { rows, series }
  }, [v, t])
  const boxes =
    data.tipo === 'boxplot'
      ? data.grupos
          .filter((g): g is BoxGroup => g.tipo === 'boxplot')
          .map((g) => ({ ...g, label: group(g.grupo), range: [g.q1, g.q3] }))
      : []
  const domain: [number, number] = [0, Math.max(1, ...boxes.map((g) => g.maximo)) * 1.05]
  const showChart = data.tipo !== 'boxplot' || boxes.length > 0
  const dateLabel = (date: string) =>
    formatDate(date, {
      day: '2-digit',
      month: 'short',
      ...(meta.granularidade === 'mes' ? { year: '2-digit', day: undefined } : {}),
    })
  const tooltipStyle = {
    background: 'var(--fixa-surface)',
    border: '1px solid var(--fixa-border)',
    borderRadius: 12,
    color: 'var(--fixa-ink)',
    fontSize: 12,
  }
  const coverage = (
    b: { qtd_registros_elegiveis: number; qtd_registros_total: number } | null | undefined,
  ) =>
    b
      ? `${number(b.qtd_registros_elegiveis)} / ${number(b.qtd_registros_total)}`
      : t('Não se aplica')
  const period = meta.periodo
  const end = period ? new Date(Date.parse(period.fim) - 86400000).toISOString().slice(0, 10) : ''
  return (
    <section className={styles.root} aria-labelledby={id} data-chart-kind={data.tipo}>
      <header>
        <h3 id={id}>{v.titulo}</h3>
        {v.status === 'SUCESSO_PARCIAL' && (
          <span className={styles.partial}>{t('Resultado parcial')}</span>
        )}
      </header>
      {period && (
        <p className={styles.period}>
          {formatDate(period.inicio, { dateStyle: 'short' })} –{' '}
          {formatDate(end, { dateStyle: 'short' })}
        </p>
      )}
      {showChart && (
        <div
          className={styles.chart}
          role="group"
          aria-label={v.titulo}
          style={data.tipo === 'boxplot' ? { height: Math.max(260, boxes.length * 48) } : undefined}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {data.tipo === 'serie_temporal' ? (
              <LineChart
                data={temporal.rows}
                margin={{ top: 16, right: 12, bottom: 12, left: 0 }}
                accessibilityLayer
                title={v.titulo}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={dateLabel}
                  minTickGap={24}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  width={48}
                  domain={meta.unidade_medida === 'percentual' ? [0, 100] : [0, 'auto']}
                  tickFormatter={(n) => number(n)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [number(typeof value === 'number' ? value : null), unit]}
                  labelFormatter={(label) => dateLabel(String(label))}
                />
                {temporal.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {temporal.series.map((s, i) => (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={temporal.rows.length < 40}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            ) : data.tipo === 'boxplot' ? (
              <BarChart
                data={boxes}
                layout="vertical"
                margin={{ top: 10, right: 12, bottom: 12, left: 0 }}
                accessibilityLayer
                title={v.titulo}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={domain}
                  tickFormatter={(n) => number(n)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={70}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(s) => String(s).slice(0, 12)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    Array.isArray(value)
                      ? value.map((n) => number(Number(n))).join(' – ')
                      : String(value),
                    t('Quartis'),
                  ]}
                />
                <Bar
                  dataKey="range"
                  name={t('Quartis')}
                  shape={<BoxShape domain={domain} />}
                  isAnimationActive={false}
                />
              </BarChart>
            ) : (
              <BarChart
                data={
                  data.tipo === 'categorias'
                    ? categories.map((p) => ({ label: p.label, value: p.valor }))
                    : bins.map((b) => ({ label: b.label, value: b.frequencia }))
                }
                margin={{ top: 16, right: 12, bottom: 12, left: 0 }}
                accessibilityLayer
                title={v.titulo}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(s) =>
                    String(s).length > 18 ? String(s).slice(0, 17) + '…' : String(s)
                  }
                  minTickGap={16}
                />
                <YAxis
                  width={48}
                  domain={
                    meta.unidade_medida === 'percentual' && data.tipo !== 'histograma'
                      ? [0, 100]
                      : [0, 'auto']
                  }
                  tick={{ fontSize: 11 }}
                  tickFormatter={(n) => number(n)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    number(typeof value === 'number' ? value : null),
                    data.tipo === 'histograma' ? t('Frequência') : unit,
                  ]}
                />
                <Bar
                  dataKey="value"
                  name={data.tipo === 'histograma' ? t('Frequência') : unit}
                  fill={colors[0]}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={60}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      {v.avisos.length > 0 && (
        <ul className={styles.warnings}>
          {v.avisos.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      )}
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
              {v.titulo} · {unit}
            </caption>
            {data.tipo === 'categorias' || data.tipo === 'serie_temporal' ? (
              <>
                <thead>
                  <tr>
                    {data.tipo === 'serie_temporal' && <th scope="col">{t('Data')}</th>}
                    <th scope="col">{t('Grupo')}</th>
                    <th scope="col">{unit}</th>
                    <th scope="col">{t('Registros')}</th>
                    <th scope="col">{t('Base elegível / total')}</th>
                    {data.tipo === 'serie_temporal' && (
                      <th scope="col">{t('Período consultado')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.pontos.map((p, i) => (
                    <tr key={i}>
                      {'data_referencia' in p && (
                        <td>{formatDate(String(p.data_referencia), { dateStyle: 'short' })}</td>
                      )}
                      <th scope="row">{group(p.grupo)}</th>
                      <td>{number(p.valor)}</td>
                      <td>{number(p.qtd_registros)}</td>
                      <td>{coverage(p.base_calculo)}</td>
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
            ) : data.tipo === 'histograma' ? (
              <>
                <thead>
                  <tr>
                    <th scope="col">{t('Intervalo')}</th>
                    <th scope="col">{t('Frequência')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bins.map((b, i) => (
                    <tr key={i}>
                      <th scope="row">{b.label}</th>
                      <td>{number(b.frequencia)}</td>
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
                  {data.grupos.map((g, i) => (
                    <tr key={i}>
                      <th scope="row">
                        {group(g.grupo)}
                        {g.tipo === 'sem_base'
                          ? ' · ' + t('Sem dados')
                          : g.tipo === 'resumo'
                            ? ' · ' + t('Resumo')
                            : ''}
                      </th>
                      <td>{number(g.qtd_registros)}</td>
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
                        <td key={k}>{number(k in g ? Number(g[k as keyof typeof g]) : null)}</td>
                      ))}
                      <td>{coverage(g.base_calculo)}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </details>
    </section>
  )
}
