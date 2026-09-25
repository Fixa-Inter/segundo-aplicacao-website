import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@mantine/core'
import { Pencil, Trash2 } from 'lucide-react'
import { listTechnicians, removeTechnician, saveTechnician } from '../../services/managementService'
import type { Technician, TechnicianInput } from '../../types/management'
import { validateTechnician } from '../../utils/managementValidation'
import common from '../management.module.css'
import styles from './Team.module.css'

const blank: TechnicianInput = {
  name: '',
  email: '',
  phone: '',
  specialty: '',
  shift: '08:00 - 16:00',
  status: 'Ativo',
}
const pageSize = 5

export default function Team() {
  const [items, setItems] = useState<Technician[]>([])
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
  const [form, setForm] = useState<TechnicianInput>(blank)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TechnicianInput, string>>>({})
  const [details, setDetails] = useState<Technician | null>(null)
  const [deleting, setDeleting] = useState<Technician | null>(null)

  useEffect(() => {
    let active = true
    listTechnicians()
      .then((data) => {
        if (active) setItems(data)
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
  function openForm(item?: Technician) {
    setEditing(item ?? null)
    setForm(
      item
        ? {
            name: item.name,
            email: item.email,
            phone: item.phone,
            specialty: item.specialty,
            shift: item.shift,
            status: item.status,
          }
        : blank,
    )
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }
  function update<K extends keyof TechnicianInput>(key: K, value: TechnicianInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateTechnician(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError('')
    try {
      await saveTechnician(
        {
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          specialty: form.specialty.trim(),
        },
        editing?.id,
      )
      setItems(await listTechnicians())
      setNotice(
        editing
          ? 'Técnico atualizado nesta sessão de demonstração.'
          : 'Técnico cadastrado nesta sessão de demonstração.',
      )
      setFormOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o técnico.')
    } finally {
      setBusy(false)
    }
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o técnico.')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={common.page}>
      <div className={common.heading}>
        <h1>Minha equipe</h1>
        <button className={common.primary} type="button" onClick={() => openForm()}>
          + Adicionar
        </button>
      </div>
      <span className={common.demo}>Dados demonstrativos · alterações até recarregar</span>
      <div className={common.toolbar}>
        <label className={`${common.field} ${styles.search}`}>
          Pesquisar
          <input
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
        <label className={common.field}>
          Situação
          <select
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
      <div className={styles.tabs} role="tablist" aria-label="Tipo de integrante">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'Técnicos'}
          onClick={() => setTab('Técnicos')}
        >
          Técnicos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'Gestores'}
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
      {tab === 'Gestores' ? (
        <section className={common.panel} role="tabpanel" aria-label="Gestores">
          <p>Raphaely Sales · Gestora da conta demonstrativa</p>
          <p className={common.muted}>
            O cadastro e a gestão de outros gestores dependem das regras de acesso da API.
          </p>
        </section>
      ) : loading ? (
        <p role="status">Carregando equipe…</p>
      ) : (
        <section
          className={`${common.panel} ${styles.tablePanel}`}
          role="tabpanel"
          aria-label="Lista de técnicos"
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
                      <th>Situação</th>
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
                            onClick={() => setDetails(item)}
                          >
                            {item.name}
                          </button>
                        </td>
                        <td data-label="Turno">{item.shift}</td>
                        <td data-label="Especialidade">{item.specialty}</td>
                        <td data-label="Situação">{item.status}</td>
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
        opened={formOpen}
        onClose={() => {
          if (!busy) setFormOpen(false)
        }}
        title={editing ? 'Editar técnico' : 'Cadastrar técnico'}
        centered
        size="lg"
      >
        <form onSubmit={submit} noValidate aria-busy={busy}>
          <div className={common.formGrid}>
            <label className={common.field}>
              Nome
              <input
                value={form.name}
                maxLength={81}
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(event) => update('name', event.target.value)}
              />
              {fieldErrors.name && (
                <span role="alert" className={common.error}>
                  {fieldErrors.name}
                </span>
              )}
            </label>
            <label className={common.field}>
              E-mail
              <input
                type="email"
                value={form.email}
                maxLength={121}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(event) => update('email', event.target.value)}
              />
              {fieldErrors.email && (
                <span role="alert" className={common.error}>
                  {fieldErrors.email}
                </span>
              )}
            </label>
            <label className={common.field}>
              Telefone
              <input
                type="tel"
                value={form.phone}
                maxLength={20}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(event) => update('phone', event.target.value)}
              />
              {fieldErrors.phone && (
                <span role="alert" className={common.error}>
                  {fieldErrors.phone}
                </span>
              )}
            </label>
            <label className={common.field}>
              Especialidade
              <input
                value={form.specialty}
                maxLength={61}
                aria-invalid={Boolean(fieldErrors.specialty)}
                onChange={(event) => update('specialty', event.target.value)}
              />
              {fieldErrors.specialty && (
                <span role="alert" className={common.error}>
                  {fieldErrors.specialty}
                </span>
              )}
            </label>
            <label className={common.field}>
              Turno
              <input
                value={form.shift}
                placeholder="08:00 - 16:00"
                aria-invalid={Boolean(fieldErrors.shift)}
                onChange={(event) => update('shift', event.target.value)}
              />
              {fieldErrors.shift && (
                <span role="alert" className={common.error}>
                  {fieldErrors.shift}
                </span>
              )}
            </label>
            <label className={common.field}>
              Situação
              <select
                value={form.status}
                onChange={(event) =>
                  update('status', event.target.value as TechnicianInput['status'])
                }
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className={common.error}>
              {error}
            </p>
          )}
          <div className={common.formActions}>
            <button
              className={common.secondary}
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button className={common.primary} type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        opened={Boolean(details)}
        onClose={() => setDetails(null)}
        title="Detalhes do técnico"
        centered
      >
        {details && (
          <dl>
            <dt>Nome</dt>
            <dd>{details.name}</dd>
            <dt>E-mail</dt>
            <dd>{details.email}</dd>
            <dt>Telefone</dt>
            <dd>{details.phone}</dd>
            <dt>Turno</dt>
            <dd>{details.shift}</dd>
            <dt>Especialidade</dt>
            <dd>{details.specialty}</dd>
            <dt>Situação</dt>
            <dd>{details.status}</dd>
          </dl>
        )}
      </Modal>
      <Modal
        opened={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir técnico?"
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
