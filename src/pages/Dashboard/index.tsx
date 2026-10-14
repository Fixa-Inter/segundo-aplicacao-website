import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useState } from 'react'
import { Menu } from '@mantine/core'
import { ChevronDown, Check } from 'lucide-react'
import { DataChart } from '../../components/DataChart'
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
  const [technicianMenuOpen, setTechnicianMenuOpen] = useState(false)

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
  const formatHour = (value: number) => formatNumber(value, { maximumFractionDigits: 2 })
  const histogram = buildHistogram(hours)
  const scatter = visible.flatMap((item) => {
    const monthlySummary = summarizeHours(item.hours)
    return monthlySummary ? [{ ...item, mean: monthlySummary.mean }] : []
  })
  function selectTechnician(id: string) {
    if (id === technicianId) return
    setLoading(true)
    setError('')
    setTechnicianId(id)
  }
  const selectedTechnician = technicians.find((item) => item.id === technicianId)

  return (
    <div className={common.page}>
      <PageHeader title={t('Dashboard')} />
      <div className={styles.controls}>
        <div className={common.toolbar}>
          <Menu
            opened={technicianMenuOpen}
            onChange={setTechnicianMenuOpen}
            position="bottom-start"
            width={260}
            shadow="md"
            radius="lg"
            returnFocus
          >
            <Menu.Target>
              <button
                type="button"
                className={styles.technicianButton}
                aria-label={
                  selectedTechnician
                    ? t('Técnico: {name}', { name: selectedTechnician.name })
                    : t('Técnico')
                }
              >
                <ChevronDown
                  aria-hidden="true"
                  className={technicianMenuOpen ? styles.arrowOpen : ''}
                />
                <span>{selectedTechnician?.name ?? t('Técnico')}</span>
              </button>
            </Menu.Target>
            <Menu.Dropdown className={styles.technicianMenu}>
              <Menu.RadioGroup value={technicianId} onChange={selectTechnician}>
                {[{ id: '', name: t('Técnico') }, ...technicians].map((item) => (
                  <Menu.RadioItem
                    key={item.id}
                    value={item.id}
                    closeMenuOnClick
                    checkIcon={<Check size={16} aria-hidden="true" />}
                    className={styles.technicianOption}
                    data-selected={technicianId === item.id || undefined}
                  >
                    {item.name}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Dropdown>
          </Menu>
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
                  <ul className={styles.legend} aria-label={t('Legenda')}>
                    <li>
                      <i style={{ background: '#2cc64d' }} aria-hidden="true" />
                      {t('Concluídas')} <strong>{completed}</strong>
                    </li>
                    <li>
                      <i style={{ background: '#0b5805' }} aria-hidden="true" />
                      {t('Pendentes')} <strong>{pending}</strong>
                    </li>
                  </ul>
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
                  <ul className={styles.legend} aria-label={t('Legenda')}>
                    <li>
                      <i style={{ background: '#5ad1f8' }} aria-hidden="true" />
                      {t('Pendentes')} <strong>{pending}</strong>
                    </li>
                    <li>
                      <i style={{ background: '#153d7d' }} aria-hidden="true" />
                      {t('Concluídas')} <strong>{completed}</strong>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
            <div className={styles.charts}>
              <section className={common.panel} aria-labelledby="bar-title">
                <h2 id="bar-title">{t('Solicitações por mês')}</h2>
                <DataChart
                  data={visible.map((item) => ({ label: t(item.month), value: item[metric] }))}
                  label={visible
                    .map(
                      (item) =>
                        `${t(item.month)}: ${item[metric]} ${t(metric === 'opened' ? 'Abertas' : 'Concluídas')}`,
                    )
                    .join('; ')}
                />
              </section>
              <section className={common.panel} aria-labelledby="scatter-title">
                <h2 id="scatter-title">{t('Solicitações abertas × tempo médio')}</h2>
                {scatter.length ? (
                  <>
                    <DataChart
                      kind="scatter"
                      xLabel={t('Abertas (quantidade)')}
                      yLabel={t('Tempo médio (h)')}
                      data={scatter.map((item) => ({
                        label: t(item.month),
                        x: item.opened,
                        value: item.mean,
                      }))}
                      label={scatter
                        .map((item) =>
                          t('{month}: {opened} abertas e média de {mean} horas', {
                            month: t(item.month),
                            opened: item.opened,
                            mean: formatHour(item.mean),
                          }),
                        )
                        .join('; ')}
                    />
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
                <DataChart
                  kind="line"
                  data={visible.map((item) => ({ label: t(item.month), value: item.completed }))}
                  label={visible.map((item) => `${t(item.month)}: ${item.completed}`).join('; ')}
                />
              </section>
              <section className={common.panel} aria-labelledby="hist-title">
                <h2 id="hist-title">{t('Distribuição do tempo de atendimento')}</h2>
                <DataChart
                  data={histogram.map((bin) => ({
                    label: `${bin.from}–${bin.to}${t('h')}`,
                    value: bin.count,
                  }))}
                  label={histogram
                    .map(
                      (bin, index) =>
                        `De ${bin.from} horas inclusive a ${bin.to} horas ${index === 4 ? 'inclusive' : 'exclusive'}: ${bin.count} atendimentos`,
                    )
                    .join('; ')}
                />
                <p className={common.muted}>
                  {t('Intervalos incluem o início e excluem o fim; o último inclui ambos.')}
                </p>
              </section>
              <section className={common.panel} aria-labelledby="box-title">
                <h2 id="box-title">{t('Variação do tempo')}</h2>
                {summary ? (
                  <>
                    <DataChart
                      kind="box"
                      box={summary}
                      xLabel={t('Tempo de atendimento (h)')}
                      label={t(
                        'Mínimo {value1} horas, primeiro quartil {value2} horas, mediana {value3} horas, terceiro quartil {value4} horas e máximo {value5} horas.',
                        {
                          value1: formatHour(summary.min),
                          value2: formatHour(summary.q1),
                          value3: formatHour(summary.median),
                          value4: formatHour(summary.q3),
                          value5: formatHour(summary.max),
                        },
                      )}
                    />
                    <p className={common.muted}>
                      {t('Mediana:')} {formatHour(summary.median)} {t('h · Mínimo:')}{' '}
                      {formatHour(summary.min)} {t('h · Máximo:')} {formatHour(summary.max)}{' '}
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
