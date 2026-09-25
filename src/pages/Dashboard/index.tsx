import { useEffect, useState } from 'react'
import { getDashboard } from '../../services/managementService'
import type { DashboardRecord } from '../../types/management'
import common from '../management.module.css'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [months, setMonths] = useState('7')
  const [metric, setMetric] = useState<'opened' | 'completed'>('completed')

  useEffect(() => {
    let active = true
    getDashboard()
      .then((data) => {
        if (active) setRecords(data)
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
  }, [])

  const visible = records.slice(-Number(months))
  const opened = visible.reduce((sum, item) => sum + item.opened, 0)
  const completed = visible.reduce((sum, item) => sum + item.completed, 0)
  const completionRate = opened ? Math.min(100, Math.round((completed / opened) * 100)) : 0
  const pending = Math.max(0, opened - completed)
  const hours = visible.flatMap((item) => item.hours).sort((a, b) => a - b)
  const average = hours.length
    ? (hours.reduce((sum, hour) => sum + hour, 0) / hours.length).toFixed(1)
    : '0'
  const max = Math.max(1, ...visible.map((item) => Math.max(item.opened, item.completed)))
  const points = visible
    .map(
      (item, index) =>
        `${visible.length === 1 ? 50 : (index * 100) / (visible.length - 1)},${100 - (item.completed / max) * 100}`,
    )
    .join(' ')
  const quartile = (part: number) => hours[Math.floor((hours.length - 1) * part)] ?? 0
  const histogram = [0, 0, 0, 0, 0]
  hours.forEach((hour) => {
    histogram[Math.min(4, Math.floor((hour - 1) / 2))] += 1
  })

  return (
    <div className={common.page}>
      <div className={common.heading}>
        <div>
          <h1>Dashboard</h1>
          <p>Indicadores de manutenção e tempo de atendimento.</p>
        </div>
        <span className={common.demo}>Dados demonstrativos</span>
      </div>
      <div className={common.toolbar}>
        <label className={common.field}>
          Período
          <select value={months} onChange={(event) => setMonths(event.target.value)}>
            <option value="3">Últimos 3 meses</option>
            <option value="7">Últimos 7 meses</option>
          </select>
        </label>
        <label className={common.field}>
          Comparar
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as 'opened' | 'completed')}
          >
            <option value="completed">Concluídas</option>
            <option value="opened">Abertas</option>
          </select>
        </label>
      </div>
      {loading && <p role="status">Carregando indicadores…</p>}
      {error && (
        <p role="alert" className={common.error}>
          {error}
        </p>
      )}
      {!loading &&
        !error &&
        (visible.length ? (
          <>
            <div className={styles.overview}>
              <section className={styles.summaryGrid} aria-label="Indicadores principais">
                <div className={styles.summaryCard}>
                  <span>Solicitações abertas</span>
                  <strong>{opened}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Concluídas</span>
                  <strong>{completed}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Pendentes</span>
                  <strong>{pending}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span>Tempo médio</span>
                  <strong>{average} h</strong>
                </div>
              </section>
              <section className={styles.rings} aria-label="Distribuição das solicitações">
                <div className={styles.ringCard}>
                  <h2>Taxa de conclusão</h2>
                  <div
                    className={styles.ring}
                    role="img"
                    aria-label={`${completionRate}% das solicitações abertas foram concluídas`}
                    style={{ background: `conic-gradient(#153d7d ${completionRate}%, #dbe7f6 0)` }}
                  >
                    <span>{completionRate}%</span>
                  </div>
                  <p>Concluídas / abertas</p>
                </div>
                <div className={styles.ringCard}>
                  <h2>Em andamento</h2>
                  <div
                    className={styles.ring}
                    role="img"
                    aria-label={`${100 - completionRate}% das solicitações abertas estão pendentes`}
                    style={{
                      background: `conic-gradient(#578bd6 ${100 - completionRate}%, #dbe7f6 0)`,
                    }}
                  >
                    <span>{pending}</span>
                  </div>
                  <p>Solicitações pendentes</p>
                </div>
              </section>
            </div>
            <div className={styles.charts}>
              <section className={common.panel} aria-labelledby="bar-title">
                <h2 id="bar-title">Solicitações por mês</h2>
                <div
                  className={styles.bars}
                  role="img"
                  aria-label={visible
                    .map(
                      (item) =>
                        `${item.month}: ${item[metric]} ${metric === 'opened' ? 'abertas' : 'concluídas'}`,
                    )
                    .join('; ')}
                >
                  {visible.map((item) => (
                    <div className={styles.barItem} key={item.month}>
                      <span className={styles.value}>{item[metric]}</span>
                      <div
                        className={styles.bar}
                        style={{ height: `${(item[metric] / max) * 100}%` }}
                      />
                      <span>{item.month}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className={common.panel} aria-labelledby="line-title">
                <h2 id="line-title">Evolução de concluídas</h2>
                <svg
                  className={styles.line}
                  viewBox="0 0 100 110"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={visible.map((item) => `${item.month}: ${item.completed}`).join('; ')}
                >
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#153d7d"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className={styles.labels}>
                  {visible.map((item) => (
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
              </section>
              <section className={common.panel} aria-labelledby="hist-title">
                <h2 id="hist-title">Distribuição do tempo de atendimento</h2>
                <div
                  className={styles.histogram}
                  role="img"
                  aria-label={histogram
                    .map(
                      (count, index) =>
                        `${index * 2 + 1} a ${index * 2 + 2} horas: ${count} atendimentos`,
                    )
                    .join('; ')}
                >
                  {histogram.map((count, index) => (
                    <div className={styles.barItem} key={index}>
                      <span className={styles.value}>{count}</span>
                      <div
                        className={styles.bar}
                        style={{ height: `${(count / Math.max(1, ...histogram)) * 100}%` }}
                      />
                      <span>
                        {index * 2 + 1}–{index * 2 + 2}h
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <section className={common.panel} aria-labelledby="box-title">
                <h2 id="box-title">Variação do tempo</h2>
                <div
                  className={styles.box}
                  role="img"
                  aria-label={`Mínimo ${hours[0]} horas, primeiro quartil ${quartile(0.25)} horas, mediana ${quartile(0.5)} horas, terceiro quartil ${quartile(0.75)} horas e máximo ${hours.at(-1)} horas.`}
                >
                  <div className={styles.whisker} />
                  <div
                    className={styles.boxBody}
                    style={{
                      left: `${(quartile(0.25) / 10) * 100}%`,
                      width: `${((quartile(0.75) - quartile(0.25)) / 10) * 100}%`,
                    }}
                  >
                    <i
                      style={{
                        left: `${((quartile(0.5) - quartile(0.25)) / Math.max(1, quartile(0.75) - quartile(0.25))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className={common.muted}>
                  Mediana: {quartile(0.5)} h · Mínimo: {hours[0]} h · Máximo: {hours.at(-1)} h
                </p>
              </section>
            </div>
          </>
        ) : (
          <p className={common.empty}>Não há dados para o período selecionado.</p>
        ))}
    </div>
  )
}
