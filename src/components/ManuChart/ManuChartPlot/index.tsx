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
} from 'recharts'
import type { ManuChartViewProps } from '../../../types/charts'
import { BoxShape } from '../BoxShape'
import { colors } from '../chartTheme'

export function ManuChartPlot({ chart }: ManuChartViewProps) {
  const {
    visualization,
    t,
    formatValue,
    metadata,
    chartData,
    unit,
    categories,
    histogramBins,
    timeSeries,
    boxGroups,
    domain,
    dateLabel,
    tooltipStyle,
  } = chart
  function renderChart() {
    if (chartData.tipo === 'serie_temporal') {
      return (
        <LineChart
          data={timeSeries.rows}
          margin={{ top: 16, right: 12, bottom: 12, left: 0 }}
          accessibilityLayer
          title={visualization.titulo}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={dateLabel} minTickGap={24} tick={{ fontSize: 11 }} />
          <YAxis
            width={48}
            domain={metadata.unidade_medida === 'percentual' ? [0, 100] : [0, 'auto']}
            tickFormatter={(n) => formatValue(n)}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatValue(typeof value === 'number' ? value : null), unit]}
            labelFormatter={(label) => dateLabel(String(label))}
          />
          {timeSeries.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {timeSeries.series.map((s, i) => (
            <Line
              key={s.id}
              dataKey={s.key}
              name={s.label}
              stroke={colors[i % colors.length]}
              strokeWidth={2.5}
              connectNulls={false}
              dot={timeSeries.rows.length < 40}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      )
    }
    if (chartData.tipo === 'boxplot') {
      return (
        <BarChart
          data={boxGroups}
          layout="vertical"
          margin={{ top: 10, right: 12, bottom: 12, left: 0 }}
          accessibilityLayer
          title={visualization.titulo}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={domain}
            tickFormatter={(n) => formatValue(n)}
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
                ? value.map((n) => formatValue(Number(n))).join(' – ')
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
      )
    }
    return (
      <BarChart
        data={
          chartData.tipo === 'categorias'
            ? categories.map((p) => ({ label: p.label, value: p.valor }))
            : histogramBins.map((b) => ({ label: b.label, value: b.frequencia }))
        }
        margin={{ top: 16, right: 12, bottom: 12, left: 0 }}
        accessibilityLayer
        title={visualization.titulo}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickFormatter={(s) => (String(s).length > 18 ? String(s).slice(0, 17) + '…' : String(s))}
          minTickGap={16}
        />
        <YAxis
          width={48}
          domain={
            metadata.unidade_medida === 'percentual' && chartData.tipo !== 'histograma'
              ? [0, 100]
              : [0, 'auto']
          }
          tick={{ fontSize: 11 }}
          tickFormatter={(n) => formatValue(n)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [
            formatValue(typeof value === 'number' ? value : null),
            chartData.tipo === 'histograma' ? t('Frequência') : unit,
          ]}
        />
        <Bar
          dataKey="value"
          name={chartData.tipo === 'histograma' ? t('Frequência') : unit}
          fill={colors[0]}
          radius={[5, 5, 0, 0]}
          maxBarSize={60}
          isAnimationActive={false}
        />
      </BarChart>
    )
  }
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      {renderChart()}
    </ResponsiveContainer>
  )
}
