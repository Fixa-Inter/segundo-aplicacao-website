import { Eye } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
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
  listTeamMembers,
  removeTechnician,
  saveTechnician,
} from '../../services/managementService'
import type {
  ManagerProfile,
  PerformancePeriod,
  PerformancePoint,
  Technician,
  TeamMember,
} from '../../types/management'
import { truncateText } from '../../utils/presentation'
import common from '../management.module.css'
import styles from './Team.module.css'

const pageSize = 4

export default function Team() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const institutional = user?.role === 'ADMINISTRADOR'
  const teamTitle = t(institutional ? 'Técnicos e gestores' : 'Técnicos')

  const [items, setItems] = useState<TeamMember[]>([])
  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [accessFilter, setAccessFilter] = useState('Todos')
  const [unitFilter, setUnitFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [details, setDetails] = useState<TeamMember | null>(null)
  const [period, setPeriod] = useState<PerformancePeriod>('week')
  const [performance, setPerformance] = useState<PerformancePoint[]>([])
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [performanceError, setPerformanceError] = useState('')
  const detailsId = details?.accessType === 'TÉCNICO' ? details.id : undefined
  useEffect(() => {
    if (!detailsId) return
    let active = true
    getTechnicianPerformance(detailsId, period)
      .then((points) => {
        if (active) setPerformance(points)
      })
      .catch((reason) => {
        if (active)
          setPerformanceError(
            reason instanceof Error ? reason.message : 'Não foi possível carregar o desempenho.',
          )
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
  function showDetails(item: TeamMember) {
    setPeriod('week')
    setPerformanceLoading(item.accessType === 'TÉCNICO')
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
    Promise.all([listTeamMembers(), getProfile()])
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
  }, [loadAttempt, user?.id])

  const filtered = items.filter(
    (item) =>
      (filter === 'Todos' || item.status === filter) &&
      (accessFilter === 'Todos' || item.accessType === accessFilter) &&
      (unitFilter === 'Todos' || item.unitId === unitFilter) &&
      `${item.name} ${item.email} ${item.unitName ?? ''} ${t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')} ${item.accessType === 'TÉCNICO' ? t(item.assessedSpecialty ?? 'Sem notas') : ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR').trim()),
  )
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  function openForm(item?: TeamMember) {
    if (item && item.accessType !== 'TÉCNICO') return
    setEditing(item ? { ...item, accessType: 'TÉCNICO' } : null)
    setError('')
    setFormOpen(true)
  }
  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError('')
    try {
      await removeTechnician(deleting.id)
      setItems(await listTeamMembers())
      setPage(1)
      setNotice('Técnico desativado com sucesso.')
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
        onSubmit={(input, competencies, persistedId) =>
          saveTechnician(input, persistedId ?? editing?.id, competencies)
        }
        onCancel={() => {
          setFormOpen(false)
          setLoadAttempt((value) => value + 1)
        }}
        onSaved={() => {
          setLoadAttempt((value) => value + 1)
          setNotice(editing ? 'Técnico atualizado com sucesso.' : 'Técnico cadastrado com sucesso.')
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
        onEdit={
          details.accessType === 'TÉCNICO'
            ? () => {
                openForm(details)
                setDetails(null)
              }
            : undefined
        }
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
        <h2>{teamTitle}</h2>
        <FilterButton
          active={
            filter !== 'Todos' ||
            accessFilter !== 'Todos' ||
            unitFilter !== 'Todos' ||
            Boolean(query)
          }
          onClear={() => {
            setFilter('Todos')
            setAccessFilter('Todos')
            setUnitFilter('Todos')
            setQuery('')
            setPage(1)
          }}
        >
          {institutional && (
            <>
              <label htmlFor="team-access" className={common.field}>
                {t('Tipo de acesso')}
                <select
                  id="team-access"
                  value={accessFilter}
                  onChange={(event) => {
                    setAccessFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="Todos">{t('Todos')}</option>
                  <option value="TÉCNICO">{t('Técnicos')}</option>
                  <option value="GESTOR">{t('Gestores')}</option>
                </select>
              </label>
              <label htmlFor="team-unit" className={common.field}>
                {t('Unidade')}
                <select
                  id="team-unit"
                  value={unitFilter}
                  onChange={(event) => {
                    setUnitFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="Todos">{t('Todas as unidades')}</option>
                  {[
                    ...new Map(
                      items
                        .filter((item) => item.unitId)
                        .map((item) => [item.unitId, item.unitName]),
                    ).entries(),
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name || t('Não informado')}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
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
        <section aria-label={teamTitle}>
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
          className={`${common.panel} ${styles.tablePanel} ${institutional ? styles.institutionTable : ''}`}
          aria-label={teamTitle}
        >
          {filtered.length ? (
            <>
              <div className={common.tableWrap}>
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>{t('Nome')}</th>
                      {institutional && <th>{t('Unidade')}</th>}
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
                            <span className={styles.memberText}>
                              <span
                                className={styles.memberName}
                                title={item.name}
                                aria-label={item.name}
                              >
                                {truncateText(item.name, 40)}
                              </span>
                              <small>
                                {institutional && (
                                  <>{t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')} · </>
                                )}
                                {t(item.status)}
                              </small>
                            </span>
                          </div>
                        </td>
                        {institutional && (
                          <td data-label={t('Unidade')} title={item.unitName}>
                            {truncateText(item.unitName || t('Não informado'), 28)}
                          </td>
                        )}
                        <td data-label={t('Turno')}>
                          {item.accessType === 'TÉCNICO'
                            ? item.shift || t('Não informado')
                            : t('Não se aplica')}
                        </td>
                        <td data-label={t('Especialidade')}>
                          {t(
                            item.accessType === 'TÉCNICO'
                              ? (item.assessedSpecialty ?? 'Sem notas')
                              : 'Não se aplica',
                          )}
                        </td>
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
                            {item.accessType === 'TÉCNICO' && (
                              <>
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
                                  aria-label={t('Desativar {name}', { name: item.name })}
                                  disabled={item.status === 'Inativo'}
                                  onClick={() => setDeleting({ ...item, accessType: 'TÉCNICO' })}
                                >
                                  <FigmaIcon name="trash" />
                                </button>
                              </>
                            )}
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
              {t(
                institutional
                  ? 'Nenhum funcionário encontrado para os filtros escolhidos.'
                  : 'Nenhum técnico encontrado para os filtros escolhidos.',
              )}
            </p>
          )}
        </section>
      )}
      <ConfirmDialog
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        variant="deactivate"
        subject={deleting?.name}
        confirmLabel="Desativar"
        busy={busy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
