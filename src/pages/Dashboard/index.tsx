import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useState } from 'react'
import { FigmaIcon } from '../../components/FigmaIcon'
import { FilterButton } from '../../components/FilterButton'
import { PageHeader } from '../../components/PageHeader'
import { getDashboard, listTechnicians } from '../../services/managementService'
import type { DashboardRecord, Technician } from '../../types/management'
import { buildHistogram, summarizeHours } from '../../utils/analytics'
import common from '../management.module.css'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { t, formatNumber } = usePreferences()

  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [months, setMonths] = useState('7')
  const [metric, setMetric] = useState<'opened' | 'completed'>('completed')
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [technicianId, setTechnicianId] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([getDashboard(technicianId), listTechnicians()])
      .then(([data, team]) => {
        if (active) {
          setRecords(data)
          setTechnicians(team)
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o dashboard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [technicianId, retry])

  const visible = records.slice(-Number(months))
  const opened = visible.reduce((sum, item) => sum + item.opened, 0)
  const completed = visible.reduce((sum, item) => sum + item.completed, 0)
  const completionRate = opened ? Math.min(100, Math.round((completed / opened) * 100)) : 0
  const pending = Math.max(0, opened - completed)
  const hours = visible.flatMap((item) => item.hours)
  const summary = summarizeHours(hours)
  const average = summary ? formatNumber(summary.mean, { maximumFractionDigits: 1 }) : '—'
  const hourAxisMax = Math.max(1, summary?.max ?? 0)
  const position = (value: number) => (value / hourAxisMax) * 100
  const formatHour = (value: number) => formatNumber(value, { maximumFractionDigits: 2 })
  const max = Math.max(1, ...visible.map((item) => Math.max(item.opened, item.completed)))
  const points = visible
    .map(
      (item, index) =>
        `${visible.length === 1 ? 50 : (index * 100) / (visible.length - 1)},${100 - (item.completed / max) * 100}`,
    )
    .join(' ')
  const histogram = buildHistogram(hours)
  const scatter = visible.flatMap((item) => {
    const monthlySummary = summarizeHours(item.hours)
    return monthlySummary ? [{ ...item, mean: monthlySummary.mean }] : []
  })
  const scatterMaxX = Math.max(1, ...scatter.map((item) => item.opened))
  const scatterMaxY = Math.max(1, ...scatter.map((item) => item.mean))

  return (
    <div className={common.page}>
      <PageHeader title={t('Dashboard')} />
      <div className={styles.controls}>
        <div className={common.toolbar}>
          <label
            htmlFor="dashboard-technician"
            className={`${common.field} ${styles.technicianField}`}
          >
            <span className={styles.srOnly}>{t('Técnico')}</span>
            <FigmaIcon name="select-arrow" />
            <select
              className={styles.technicianSelect}
              id="dashboard-technician"
              value={technicianId}
              onChange={(event) => {
                setLoading(true)
                setError('')
                setTechnicianId(event.target.value)
              }}
            >
              <option value="">{t('Técnico')}</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <FilterButton
          active={months !== '7' || metric !== 'completed' || Boolean(technicianId)}
          onClear={() => {
            setMonths('7')
            setMetric('completed')
            if (technicianId) {
              setLoading(true)
              setError('')
              setTechnicianId('')
            }
          }}
        >
          {' '}
          <label htmlFor="dashboard-period" className={common.field}>
            <span className={styles.srOnly}>{t('Período')}</span>
            <select
              id="dashboard-period"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            >
              <option value="3">{t('Últimos 3 meses')}</option>
              <option value="7">{t('Últimos 7 meses')}</option>
            </select>
          </label>
          <label htmlFor="dashboard-metric" className={common.field}>
            <span className={styles.srOnly}>{t('Comparar')}</span>
            <select
              id="dashboard-metric"
              value={metric}
              onChange={(event) => setMetric(event.target.value as 'opened' | 'completed')}
            >
              <option value="completed">{t('Concluídas')}</option>
              <option value="opened">{t('Abertas')}</option>
            </select>
          </label>
        </FilterButton>
      </div>
      {loading && <p role="status">{t('Carregando indicadores…')}</p>}
      {error && (
        <div role="alert" className={common.error}>
          <p>{t(error)}</p>
          <button
            type="button"
            className={common.secondary}
            onClick={() => {
              setLoading(true)
              setError('')
              setRetry((current) => current + 1)
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      )}
      {!loading &&
        !error &&
        (visible.length ? (
          <>
            <div className={styles.overview}>
              <section className={styles.summaryGrid} aria-label={t('Indicadores principais')}>
                <div className={styles.summaryCard}>
                  <span>{t('Solicitações abertas')}</span>
                  <strong>{opened}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>{t('Concluídas')}</span>
                  <strong>{completed}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>{t('Pendentes')}</span>
                  <strong>{pending}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>{t('Tempo médio')}</span>
                  <strong>
                    {average} {t('h')}
                  </strong>
                </div>
              </section>
              <section className={styles.rings} aria-label={t('Distribuição das solicitações')}>
                <div className={styles.ringCard}>
                  <h2>{t('Taxa de conclusão')}</h2>
                  <div
                    className={styles.ring}
                    role="img"
                    aria-label={t('{name}% das solicitações abertas foram concluídas', {
                      name: completionRate,
                    })}
                    style={{
                      background: `conic-gradient(#2cc64d ${completionRate}%, #0b5805 0)`,
                    }}
                  >
                    <span>{completionRate}%</span>
                  </div>
                  <p>{t('Concluídas / abertas')}</p>
                </div>
                <div className={styles.ringCard}>
                  <h2>{t('Em andamento')}</h2>
                  <div
                    className={styles.ring}
                    role="img"
                    aria-label={t('{name}% das solicitações abertas estão pendentes', {
                      name: 100 - completionRate,
                    })}
                    style={{
                      background: `conic-gradient(#5ad1f8 ${100 - completionRate}%, #153d7d 0)`,
                    }}
                  >
                    <span>{pending}</span>
                  </div>
                  <p>{t('Solicitações pendentes')}</p>
                </div>
              </section>
            </div>
            <div className={styles.charts}>
              <section className={common.panel} aria-labelledby="bar-title">
                <h2 id="bar-title">{t('Solicitações por mês')}</h2>
                <div
                  className={styles.bars}
                  role="img"
                  aria-label={visible
                    .map(
                      (item) =>
                        `${t(item.month)}: ${item[metric]} ${t(metric === 'opened' ? 'Abertas' : 'Concluídas')}`,
                    )
                    .join('; ')}
                >
                  {visible.map((item) => (
                    <div className={styles.barItem} key={t(item.month)}>
                      <span className={styles.value}>{item[metric]}</span>
                      <div
                        className={styles.bar}
                        style={{ height: `${(item[metric] / max) * 100}%` }}
                      />
                      <span>{t(item.month)}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className={common.panel} aria-labelledby="scatter-title">
                <h2 id="scatter-title">{t('Solicitações abertas × tempo médio')}</h2>
                {scatter.length ? (
                  <>
                    <svg
                      className={styles.scatter}
                      viewBox="0 0 320 200"
                      role="img"
                      aria-label={scatter
                        .map((item) =>
                          t('{month}: {opened} abertas e média de {mean} horas', {
                            month: t(item.month),
                            opened: item.opened,
                            mean: formatHour(item.mean),
                          }),
                        )
                        .join('; ')}
                    >
                      <path d="M 40 15 V 160 H 300" fill="none" stroke="var(--fixa-muted)" />
                      <text x="35" y="178">
                        0
                      </text>
                      <text x="300" y="178" textAnchor="end">
                        {scatterMaxX}
                      </text>
                      <text x="33" y="25" textAnchor="end">
                        {formatHour(scatterMaxY)}
                      </text>
                      <text x="170" y="196" textAnchor="middle">
                        {t('Abertas (quantidade)')}
                      </text>
                      <text x="14" y="90" textAnchor="middle" transform="rotate(-90 14 90)">
                        {t('Tempo médio (h)')}
                      </text>
                      {scatter.map((item) => (
                        <g key={t(item.month)}>
                          <circle
                            cx={40 + (item.opened / scatterMaxX) * 260}
                            cy={160 - (item.mean / scatterMaxY) * 140}
                            r="5"
                            fill="var(--fixa-text-primary)"
                          />
                          <title>
                            {t(item.month)}: {item.opened} {t('abertas ·')} {formatHour(item.mean)}{' '}
                            {t('h')}
                          </title>
                        </g>
                      ))}
                    </svg>
                    <p className={common.muted}>
                      {t('Cada ponto representa um mês; a relação não estabelece causa e efeito.')}
                    </p>
                  </>
                ) : (
                  <p>{t('Não há tempos de atendimento para comparar.')}</p>
                )}
              </section>
              <section className={common.panel} aria-labelledby="line-title">
                <h2 id="line-title">{t('Evolução de concluídas')}</h2>
                <svg
                  className={styles.line}
                  viewBox="0 0 100 110"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={visible
                    .map((item) => `${t(item.month)}: ${item.completed}`)
                    .join('; ')}
                >
                  <polyline
                    points={points}
                    fill="none"
                    stroke="var(--fixa-text-primary)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className={styles.labels}>
                  {visible.map((item) => (
                    <span key={t(item.month)}>{t(item.month)}</span>
                  ))}
                </div>
              </section>
              <section className={common.panel} aria-labelledby="hist-title">
                <h2 id="hist-title">{t('Distribuição do tempo de atendimento')}</h2>
                <div
                  className={styles.histogram}
                  role="img"
                  aria-label={histogram
                    .map(
                      (bin, index) =>
                        `De ${bin.from} horas inclusive a ${bin.to} horas ${index === 4 ? 'inclusive' : 'exclusive'}: ${bin.count} atendimentos`,
                    )
                    .join('; ')}
                >
                  {histogram.map((bin) => (
                    <div className={styles.barItem} key={bin.from}>
                      <span className={styles.value}>{bin.count}</span>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${(bin.count / Math.max(1, ...histogram.map((item) => item.count))) * 100}%`,
                        }}
                      />
                      <span>
                        {bin.from}–{bin.to}
                        {t('h')}
                      </span>
                    </div>
                  ))}
                </div>
                <p className={common.muted}>
                  {t('Intervalos incluem o início e excluem o fim; o último inclui ambos.')}
                </p>
              </section>
              <section className={common.panel} aria-labelledby="box-title">
                <h2 id="box-title">{t('Variação do tempo')}</h2>
                {summary ? (
                  <>
                    <div
                      className={styles.box}
                      role="img"
                      aria-label={t(
                        'Mínimo {value1} horas, primeiro quartil {value2} horas, mediana {value3} horas, terceiro quartil {value4} horas e máximo {value5} horas.',
                        {
                          value1: formatHour(summary.min),
                          value2: formatHour(summary.q1),
                          value3: formatHour(summary.median),
                          value4: formatHour(summary.q3),
                          value5: formatHour(summary.max),
                        },
                      )}
                    >
                      <div
                        className={styles.whisker}
                        style={{
                          left: `${position(summary.min)}%`,
                          width: `${position(summary.max - summary.min)}%`,
                        }}
                      />
                      <div
                        className={styles.boxBody}
                        style={{
                          left: `${position(summary.q1)}%`,
                          width: `${position(summary.q3 - summary.q1)}%`,
                        }}
                      />
                      <i
                        className={styles.median}
                        style={{ left: `${position(summary.median)}%` }}
                      />
                    </div>
                    <p className={common.muted}>
                      {t('Mediana:')}
                      {formatHour(summary.median)} {t('h · Mínimo:')} {formatHour(summary.min)}{' '}
                      {t('h · Máximo:')}
                      {formatHour(summary.max)}{' '}
                      {t('h. Quartis interpolados; hastes nos extremos da amostra.')}
                    </p>
                  </>
                ) : (
                  <p>{t('Não há tempos de atendimento neste período.')}</p>
                )}
              </section>
            </div>
          </>
        ) : (
          <p className={common.empty}>{t('Não há dados para o técnico e período selecionados.')}</p>
        ))}
    </div>
  )
}
