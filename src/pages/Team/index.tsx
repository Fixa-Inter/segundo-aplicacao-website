import { Eye } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState } from 'react'
import { FigmaIcon } from '../../components/FigmaIcon'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FilterButton } from '../../components/FilterButton'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { TechnicianDetails } from '../../components/TechnicianDetails'
import { TechnicianForm } from '../../components/TechnicianForm'
import {
  getProfile,
  getTechnicianPerformance,
  listTechnicians,
  removeTechnician,
  saveTechnician,
} from '../../services/managementService'
import type {
  ManagerProfile,
  PerformancePeriod,
  PerformancePoint,
  Technician,
} from '../../types/management'
import common from '../management.module.css'
import styles from './Team.module.css'

const pageSize = 4

export default function Team() {
  const { t } = usePreferences()

  const [items, setItems] = useState<Technician[]>([])
  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [details, setDetails] = useState<Technician | null>(null)
  const [period, setPeriod] = useState<PerformancePeriod>('week')
  const [performance, setPerformance] = useState<PerformancePoint[]>([])
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [performanceError, setPerformanceError] = useState('')
  const detailsId = details?.id
  useEffect(() => {
    if (!detailsId) return
    let active = true
    getTechnicianPerformance(detailsId, period)
      .then((points) => {
        if (active) setPerformance(points)
      })
      .catch(() => {
        if (active) setPerformanceError('Não foi possível carregar o desempenho.')
      })
      .finally(() => {
        if (active) setPerformanceLoading(false)
      })
    return () => {
      active = false
    }
  }, [detailsId, period])
  function changePeriod(next: PerformancePeriod) {
    if (next === period) return
    setPeriod(next)
    setPerformanceLoading(true)
    setPerformanceError('')
  }
  function showDetails(item: Technician) {
    setPeriod('week')
    setPerformanceLoading(true)
    setPerformanceError('')
    setDetails(item)
  }
  const [deleting, setDeleting] = useState<Technician | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasFormOpen = useRef(false)

  useEffect(() => {
    if (wasFormOpen.current && !formOpen) addButtonRef.current?.focus()
    wasFormOpen.current = formOpen
  }, [formOpen])

  useEffect(() => {
    let active = true
    Promise.all([listTechnicians(), getProfile()])
      .then(([technicians, profile]) => {
        if (active) {
          setItems(technicians)
          setManager(profile)
        }
      })
      .catch(() => {
        if (active) setLoadError('Não foi possível carregar a equipe.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadAttempt])

  const filtered = items.filter(
    (item) =>
      (filter === 'Todos' || item.status === filter) &&
      `${item.name} ${item.email} ${item.specialty}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR').trim()),
  )
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  function openForm(item?: Technician) {
    setEditing(item ?? null)
    setError('')
    setFormOpen(true)
  }
  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError('')
    try {
      await removeTechnician(deleting.id)
      setItems(await listTechnicians())
      setPage(1)
      setNotice('Técnico excluído nesta sessão de demonstração.')
      setDeleting(null)
      requestAnimationFrame(() => addButtonRef.current?.focus())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o técnico.')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  if (formOpen && manager) {
    return (
      <TechnicianForm
        technician={editing}
        manager={manager}
        onSubmit={(input, competencies) => saveTechnician(input, editing?.id, competencies)}
        onCancel={() => setFormOpen(false)}
        onSaved={(saved) => {
          setItems((current) =>
            editing
              ? current.map((item) => (item.id === saved.id ? saved : item))
              : [...current, saved],
          )
          setNotice(
            editing
              ? 'Técnico atualizado nesta sessão de demonstração.'
              : 'Técnico cadastrado nesta sessão de demonstração. Nenhuma conta real foi criada.',
          )
          setPage(1)
          setFormOpen(false)
        }}
      />
    )
  }

  if (details) {
    return (
      <TechnicianDetails
        technician={details}
        period={period}
        points={performance}
        loading={performanceLoading}
        error={performanceError}
        onPeriodChange={changePeriod}
        onBack={() => {
          const id = details.id
          setDetails(null)
          requestAnimationFrame(() => document.getElementById(`tech-details-${id}`)?.focus())
        }}
        onEdit={() => {
          openForm(details)
          setDetails(null)
        }}
      />
    )
  }

  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader
        title={t('Minha equipe')}
        action={
          <button
            ref={addButtonRef}
            className={`${common.primary} ${common.addButton}`}
            type="button"
            onClick={() => openForm()}
            disabled={loading || Boolean(loadError) || !manager}
          >
            <FigmaIcon name="plus" />
            {t('Adicionar técnico')}
          </button>
        }
      />
      <div className={common.toolbar}>
        <label htmlFor="team-search" className={`${common.field} ${styles.search}`}>
          <span className={styles.srOnly}>{t('Pesquisar')}</span>
          <span className={styles.searchIcon} aria-hidden="true">
            <FigmaIcon name="search" />
          </span>
          <input
            id="team-search"
            type="search"
            value={query}
            maxLength={120}
            placeholder={t('Pesquisar...')}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>
      <div className={styles.sectionHeading}>
        <h2>{t('Técnicos')}</h2>
        <FilterButton
          active={filter !== 'Todos' || Boolean(query)}
          onClear={() => {
            setFilter('Todos')
            setQuery('')
            setPage(1)
          }}
        >
          {' '}
          <label htmlFor="team-status" className={common.field}>
            {t('Situação')}
            <select
              id="team-status"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
            >
              <option value="Todos">{t('Todos')}</option>
              <option value="Ativo">{t('Ativo')}</option>
              <option value="Inativo">{t('Inativo')}</option>
            </select>
          </label>
        </FilterButton>
      </div>
      {notice && (
        <p className={common.status} role="status">
          {t(notice)}
        </p>
      )}
      {error && !formOpen && (
        <p className={common.error} role="alert">
          {t(error)}
        </p>
      )}
      {loading ? (
        <p role="status">{t('Carregando equipe…')}</p>
      ) : loadError ? (
        <section aria-label={t('Técnicos')}>
          <div role="alert" className={common.error}>
            <p>{t(loadError)}</p>
            <button
              className={common.secondary}
              type="button"
              onClick={() => {
                setLoadError('')
                setLoading(true)
                setLoadAttempt((current) => current + 1)
              }}
            >
              {t('Tentar novamente')}
            </button>
          </div>
        </section>
      ) : (
        <section
          id="team-panel-tech"
          className={`${common.panel} ${styles.tablePanel}`}
          aria-label={t('Técnicos')}
        >
          {filtered.length ? (
            <>
              <div className={common.tableWrap}>
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>{t('Nome')}</th>
                      <th>{t('Turno')}</th>
                      <th>{t('Especialidade')}</th>
                      <th>{t('Ações')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t('Nome')}>
                          <div className={styles.member}>
                            <span className={styles.initials} aria-hidden="true">
                              {item.name
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                            <span>
                              {item.name}
                              <small>{t(item.status)}</small>
                            </span>
                          </div>
                        </td>
                        <td data-label={t('Turno')}>{item.shift}</td>
                        <td data-label={t('Especialidade')}>{item.specialty}</td>
                        <td data-label={t('Ações')}>
                          <div className={common.actions}>
                            <button
                              type="button"
                              className={styles.iconButton}
                              id={`tech-details-${item.id}`}
                              aria-label={t('Ver detalhes de {name}', { name: item.name })}
                              onClick={() => showDetails(item)}
                            >
                              <Eye aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className={styles.iconButton}
                              aria-label={t('Editar {name}', { name: item.name })}
                              onClick={() => openForm(item)}
                            >
                              <FigmaIcon name="edit" />
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconButton} ${styles.delete}`}
                              aria-label={t('Excluir {name}', { name: item.name })}
                              onClick={() => setDeleting(item)}
                            >
                              <FigmaIcon name="trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={lastPage} onChange={setPage} />
            </>
          ) : (
            <p className={common.empty}>
              {t('Nenhum técnico encontrado para os filtros escolhidos.')}
            </p>
          )}
        </section>
      )}
      <ConfirmDialog
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        variant="delete"
        subject={deleting?.name}
        confirmLabel="Excluir"
        busy={busy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
