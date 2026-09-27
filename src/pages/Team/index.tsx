import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Modal } from '@mantine/core'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBadge } from '../../components/DemoBadge'
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
  const [items, setItems] = useState<Technician[]>([])
  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [tab, setTab] = useState<'Técnicos' | 'Gestores'>('Técnicos')
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
        if (active) setError('Não foi possível carregar a equipe.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = items.filter(
    (item) =>
      (filter === 'Todos' || item.status === filter) &&
      `${item.name} ${item.email} ${item.specialty}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR').trim()),
  )
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
        ? tab === 'Técnicos'
          ? 'Gestores'
          : 'Técnicos'
        : event.key === 'End'
          ? 'Gestores'
          : event.key === 'Home'
            ? 'Técnicos'
            : null
    if (!next) return
    event.preventDefault()
    setTab(next)
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[role="tab"][data-tab="${next}"]`)
      ?.focus()
  }
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
        onSubmit={(input) => saveTechnician(input, editing?.id)}
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
    <div className={common.page}>
      <PageHeader
        title="Minha equipe"
        action={
          tab === 'Técnicos' && (
            <button
              ref={addButtonRef}
              className={`${common.primary} ${styles.addButton}`}
              type="button"
              onClick={() => openForm()}
              disabled={loading || !manager}
            >
              + Adicionar
            </button>
          )
        }
      />
      <DemoBadge>Dados demonstrativos · alterações até recarregar</DemoBadge>
      {tab === 'Técnicos' && (
        <div className={common.toolbar}>
          <label htmlFor="team-search" className={`${common.field} ${styles.search}`}>
            <span className={styles.srOnly}>Pesquisar</span>
            <span className={styles.searchIcon} aria-hidden="true">
              <Search size={25} />
            </span>
            <input
              id="team-search"
              type="search"
              value={query}
              maxLength={120}
              placeholder="Pesquisar..."
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label htmlFor="team-status" className={common.field}>
            Situação
            <select
              id="team-status"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
            >
              <option>Todos</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </label>
        </div>
      )}
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Tipo de integrante"
        onKeyDown={moveTab}
      >
        <button
          id="team-tab-tech"
          data-tab="Técnicos"
          type="button"
          role="tab"
          aria-selected={tab === 'Técnicos'}
          aria-controls="team-panel-tech"
          tabIndex={tab === 'Técnicos' ? 0 : -1}
          onClick={() => setTab('Técnicos')}
        >
          Técnicos
        </button>
        <button
          id="team-tab-managers"
          data-tab="Gestores"
          type="button"
          role="tab"
          aria-selected={tab === 'Gestores'}
          aria-controls="team-panel-managers"
          tabIndex={tab === 'Gestores' ? 0 : -1}
          onClick={() => setTab('Gestores')}
        >
          Gestores
        </button>
      </div>
      {notice && (
        <p className={common.status} role="status">
          {notice}
        </p>
      )}
      {error && !formOpen && (
        <p className={common.error} role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando equipe…</p>
      ) : tab === 'Gestores' ? (
        <section
          id="team-panel-managers"
          className={`${common.panel} ${styles.tablePanel}`}
          role="tabpanel"
          aria-labelledby="team-tab-managers"
        >
          {manager ? (
            <div className={common.tableWrap}>
              <table className={common.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Empresa</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td data-label="Nome">{manager.name}</td>
                    <td data-label="E-mail">{manager.email}</td>
                    <td data-label="Empresa">{manager.company}</td>
                    <td data-label="Ação">
                      <Link to="/perfil">Ver perfil</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className={common.empty}>Nenhum gestor disponível nesta conta demonstrativa.</p>
          )}
          <p className={common.muted}>
            A gestão de outras contas exige regras de autorização e contrato da API.
          </p>
        </section>
      ) : (
        <section
          id="team-panel-tech"
          className={`${common.panel} ${styles.tablePanel}`}
          role="tabpanel"
          aria-labelledby="team-tab-tech"
        >
          {filtered.length ? (
            <>
              <div className={common.tableWrap}>
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Turno</th>
                      <th>Especialidade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((item) => (
                      <tr key={item.id}>
                        <td data-label="Nome">
                          <button
                            type="button"
                            className={styles.nameButton}
                            id={`tech-details-${item.id}`}
                            aria-label={`Ver detalhes de ${item.name}`}
                            onClick={() => showDetails(item)}
                          >
                            <span className={styles.initials} aria-hidden="true">
                              {item.name
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                            <span>
                              {item.name}
                              <small>{item.status}</small>
                            </span>
                          </button>
                        </td>
                        <td data-label="Turno">{item.shift}</td>
                        <td data-label="Especialidade">{item.specialty}</td>
                        <td data-label="Ações">
                          <div className={common.actions}>
                            <button
                              type="button"
                              className={styles.iconButton}
                              aria-label={`Editar ${item.name}`}
                              onClick={() => openForm(item)}
                            >
                              <Pencil size={20} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconButton} ${styles.delete}`}
                              aria-label={`Excluir ${item.name}`}
                              onClick={() => setDeleting(item)}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={common.pager}>
                <button
                  className={common.secondary}
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {page} de {lastPage}
                </span>
                <button
                  className={common.secondary}
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <p className={common.empty}>Nenhum técnico encontrado para os filtros escolhidos.</p>
          )}
        </section>
      )}
      <Modal
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir técnico?"
        closeButtonProps={{ 'aria-label': 'Fechar confirmação de exclusão do técnico' }}
        centered
      >
        <p>Excluir {deleting?.name} desta sessão de demonstração?</p>
        <div className={common.formActions}>
          <button className={common.secondary} type="button" onClick={() => setDeleting(null)}>
            Cancelar
          </button>
          <button className={common.danger} type="button" onClick={confirmDelete} disabled={busy}>
            {busy ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
