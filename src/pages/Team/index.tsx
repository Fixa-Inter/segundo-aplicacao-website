import { Eye } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FigmaIcon } from '../../components/FigmaIcon'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FilterButton } from '../../components/FilterButton'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { TechnicianDetails } from '../../components/TechnicianDetails'
import { TechnicianForm } from '../../components/TechnicianForm'
import {
  getProfile,
  listTeamMembers,
  removeTechnician,
  saveTechnician,
} from '../../services/managementService'
import type { ManagerProfile, Technician, TeamMember } from '../../types/management'
import { truncateText } from '../../utils/presentation'
import common from '../management.module.css'
import styles from './Team.module.css'

const pageSize = 4
const teamTabs = [
  { accessType: 'GESTOR', label: 'Gestores', id: 'managers' },
  { accessType: 'TÉCNICO', label: 'Técnicos', id: 'technicians' },
] as const

export default function Team() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const institutional = user?.role === 'ADMINISTRADOR'
  const [selectedAccess, setSelectedAccess] = useState<TeamMember['accessType']>(
    institutional ? 'GESTOR' : 'TÉCNICO',
  )
  const activeAccess = institutional ? selectedAccess : 'TÉCNICO'
  const activeTab = teamTabs.find((tab) => tab.accessType === activeAccess)!
  const technical = activeAccess === 'TÉCNICO'
  const teamTitle = t(activeTab.label)

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
  const [unitFilter, setUnitFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [details, setDetails] = useState<TeamMember | null>(null)
  function showDetails(item: TeamMember) {
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
      item.accessType === activeAccess &&
      (unitFilter === 'Todos' || item.unitId === unitFilter) &&
      `${item.name} ${item.email} ${item.unitName ?? ''} ${t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')} ${item.accessType === 'TÉCNICO' ? t(item.assessedSpecialty ?? 'Sem notas') : ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR').trim()),
  )
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  function selectTab(accessType: TeamMember['accessType']) {
    setSelectedAccess(accessType)
    setPage(1)
  }
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const index = teamTabs.findIndex((tab) => tab.accessType === activeAccess)
    const next = {
      ArrowRight: (index + 1) % teamTabs.length,
      ArrowLeft: (index + teamTabs.length - 1) % teamTabs.length,
      Home: 0,
      End: teamTabs.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    selectTab(teamTabs[next].accessType)
    document.getElementById('team-tab-' + teamTabs[next].id)?.focus()
  }
  function openForm(item?: TeamMember) {
    if (item && item.accessType !== 'TÉCNICO') return
    setEditing(item ? { ...item, accessType: 'TÉCNICO' } : null)
    setError('')
    setFormOpen(true)
  }
  async function confirmDelete() {
    if (!deleting || busy) return
    setBusy(true)
    setError('')
    try {
      await removeTechnician(deleting.id)
      setItems((values) =>
        values.map((item) => (item.id === deleting.id ? { ...item, status: 'Inativo' } : item)),
      )
      setPage(1)
      setNotice('Técnico desativado com sucesso.')
      setDeleting(null)
      requestAnimationFrame(() => addButtonRef.current?.focus())
      try {
        setItems(await listTeamMembers())
      } catch {
        setError('O técnico foi desativado, mas não foi possível atualizar a lista.')
      }
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
          technical && (
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
          )
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
        {institutional ? (
          <div
            className={styles.tabs}
            role="tablist"
            aria-label={t('Minha equipe')}
            onKeyDown={moveTab}
          >
            {teamTabs.map((tab) => (
              <button
                key={tab.id}
                id={'team-tab-' + tab.id}
                className={styles.tab}
                type="button"
                role="tab"
                aria-selected={activeAccess === tab.accessType}
                aria-controls="team-content"
                tabIndex={activeAccess === tab.accessType ? 0 : -1}
                onClick={() => selectTab(tab.accessType)}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>
        ) : (
          <h2>{teamTitle}</h2>
        )}
        <FilterButton
          active={filter !== 'Todos' || unitFilter !== 'Todos' || Boolean(query)}
          onClear={() => {
            setFilter('Todos')
            setUnitFilter('Todos')
            setQuery('')
            setPage(1)
          }}
        >
          {institutional && (
            <>
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
      <div
        id="team-content"
        className={styles.teamContent}
        role={institutional ? 'tabpanel' : undefined}
        aria-labelledby={institutional ? 'team-tab-' + activeTab.id : undefined}
        tabIndex={institutional ? 0 : undefined}
      >
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
            className={`${common.panel} ${styles.tablePanel} ${institutional ? (technical ? styles.institutionTable : styles.managersTable) : ''}`}
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
                        {technical && <th>{t('Turno')}</th>}
                        {technical && <th>{t('Especialidade')}</th>}
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
                                <span className={styles.memberName} title={item.name}>
                                  <span aria-hidden="true">{truncateText(item.name, 40)}</span>
                                  <span className={styles.srOnly}>{item.name}</span>
                                </span>
                                <small>
                                  {institutional && (
                                    <>
                                      {t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')}{' '}
                                      ·{' '}
                                    </>
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
                          {technical && (
                            <>
                              <td data-label={t('Turno')}>{item.shift || t('Não informado')}</td>
                              <td data-label={t('Especialidade')}>
                                {t(item.assessedSpecialty ?? 'Sem notas')}
                              </td>
                            </>
                          )}
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
                  technical
                    ? 'Nenhum técnico encontrado para os filtros escolhidos.'
                    : 'Nenhum gestor encontrado para os filtros escolhidos.',
                )}
              </p>
            )}
          </section>
        )}
      </div>
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
