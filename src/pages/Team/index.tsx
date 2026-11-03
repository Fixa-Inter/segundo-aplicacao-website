import { Link } from 'react-router-dom'
import { AddRecordButton } from '../../components/AddRecordButton'
import { FigmaIcon } from '../../components/FigmaIcon'
import { FilterButton } from '../../components/FilterButton'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SuccessNotice } from '../../components/SuccessNotice'
import { Pagination } from '../../components/Pagination'
import { TechnicianDetails } from '../../components/TechnicianDetails'
import { TechnicianForm } from '../../components/TechnicianForm'
import { useTeamPage } from '../../hooks/useTeamPage'
import { teamTabs } from '../../utils/teamPresentation'
import common from '../management.module.css'
import styles from './Team.module.css'
import { TeamTable } from '../../components/TeamTable'

export default function Team() {
  const {
    t,
    institutional,
    activeAccess,
    activeTab,
    technical,
    teamTitle,
    items,
    manager,
    loading,
    setLoading,
    loadError,
    setLoadError,
    setLoadAttempt,
    notice,
    closeNotice,
    query,
    setQuery,
    filter,
    setFilter,
    unitFilter,
    setUnitFilter,
    page,
    setPage,
    editing,
    formOpen,
    details,
    closeDetails,
    cancelForm,
    memberId,
    memberNotFound,
    submitTechnician,
    memberSaved,
    showDetails,
    addButtonRef,
    filtered,
    lastPage,
    shown,
    pageSize,
    setPageSize,
    selectTab,
    moveTab,
    openForm,
  } = useTeamPage()
  if (formOpen && manager) {
    return (
      <TechnicianForm
        technician={editing}
        manager={manager}
        onSubmit={submitTechnician}
        onCancel={cancelForm}
        onSaved={memberSaved}
      />
    )
  }

  if (memberId !== undefined && loading) return <LoadingState label="Carregando equipe…" />
  if (memberId !== undefined && loadError)
    return (
      <section className={common.page}>
        <p role="alert">{t(loadError)}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError('')
            setLoading(true)
            setLoadAttempt((value) => value + 1)
          }}
        >
          {t('Tentar novamente')}
        </button>
        <Link to="/equipe">{t('Voltar à equipe')}</Link>
      </section>
    )
  if (memberNotFound)
    return (
      <section className={common.page}>
        <PageHeader title={t('Pessoa não encontrada')} />
        <p role="status">{t('Este cadastro não está disponível na sua equipe.')}</p>
        <Link to="/equipe">{t('Voltar à equipe')}</Link>
      </section>
    )

  if (details) {
    return (
      <TechnicianDetails
        technician={details}
        onBack={closeDetails}
        onEdit={
          details.accessType === 'TÉCNICO' || institutional
            ? () => {
                openForm(details)
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
            <AddRecordButton
              ref={addButtonRef}
              label={t('Adicionar técnico')}
              onClick={() => openForm()}
              disabled={loading || Boolean(loadError) || !manager}
            />
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
      {notice && <SuccessNotice notice={notice} onClose={closeNotice} />}
      <div
        id="team-content"
        className={styles.teamContent}
        role={institutional ? 'tabpanel' : undefined}
        aria-labelledby={institutional ? 'team-tab-' + activeTab.id : undefined}
        tabIndex={institutional ? 0 : undefined}
      >
        {loading ? (
          <LoadingState label="Carregando equipe…" />
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
                <TeamTable
                  members={shown}
                  institutional={institutional}
                  technical={technical}
                  onDetails={showDetails}
                  onEdit={openForm}
                />
                <Pagination
                  page={page}
                  total={lastPage}
                  onChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={(value) => {
                    setPageSize(value)
                    setPage(1)
                  }}
                />
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
    </div>
  )
}
