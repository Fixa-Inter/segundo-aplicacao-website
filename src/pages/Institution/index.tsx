import { Eye } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { AddRecordButton } from '../../components/AddRecordButton'
import { FigmaIcon } from '../../components/FigmaIcon'
import { FilterButton } from '../../components/FilterButton'
import { InstitutionForm } from '../../components/InstitutionForm'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SuccessNotice } from '../../components/SuccessNotice'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../contexts/useAuth'
import { useInstitutionPage } from '../../hooks/useInstitutionPage'
import { locationTypes } from '../../utils/institution'
import common from '../management.module.css'
import tableStyles from '../Team/Team.module.css'
import styles from './Institution.module.css'

export default function Institution() {
  const { user } = useAuth()
  return user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR' ? (
    <InstitutionPage />
  ) : (
    <Navigate to="/" replace />
  )
}
function InstitutionPage() {
  const {
    t,
    data,
    tab,
    screen,
    entry,
    loading,
    loadError,
    addButton,
    openForm,
    query,
    setQuery,
    setPage,
    tabs,
    moveTab,
    selectTab,
    status,
    setStatus,
    unitId,
    setUnitId,
    notice,
    closeNotice,
    retry,
    shown,
    pageSize,
    setPageSize,
    page,
    total,
    save,
    setScreen,
  } = useInstitutionPage()
  const local = tab === 'locations'
  const showUnits = data.units.length > 1
  if (screen !== 'list')
    return (
      <InstitutionForm
        key={screen + (entry?.id ?? 'new') + tab}
        kind={tab}
        entry={entry}
        units={data.units}
        readOnly={screen === 'details'}
        onEdit={() => setScreen('form')}
        onCancel={() => setScreen('list')}
        onSubmit={save}
      />
    )
  return (
    <div className={`${common.page} ${tableStyles.page}`}>
      <PageHeader
        title={t('Instituição')}
        action={
          <AddRecordButton
            ref={addButton}
            label={t(local ? 'Adicionar local' : 'Adicionar turno')}
            onClick={() => openForm()}
            disabled={loading || Boolean(loadError) || !data.units.some((unit) => unit.active)}
          />
        }
      />
      <div className={common.toolbar}>
        <label className={`${common.field} ${tableStyles.search}`} htmlFor="institution-search">
          <span className="sr-only">{t('Pesquisar')}</span>
          <span className={tableStyles.searchIcon} aria-hidden="true">
            <FigmaIcon name="search" />
          </span>
          <input
            id="institution-search"
            type="search"
            maxLength={120}
            placeholder={t('Pesquisar...')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>
      <div className={tableStyles.sectionHeading}>
        <div
          className={tableStyles.tabs}
          role="tablist"
          aria-label={t('Instituição')}
          onKeyDown={moveTab}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              id={'institution-tab-' + item.id}
              className={tableStyles.tab}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="institution-content"
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => selectTab(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <FilterButton
          active={status !== 'Todos' || unitId !== 'Todos' || Boolean(query)}
          onClear={() => {
            setQuery('')
            setStatus('Todos')
            setUnitId('Todos')
            setPage(1)
          }}
        >
          {showUnits && (
            <label className={common.field} htmlFor="institution-unit-filter">
              {t('Unidade')}
              <select
                id="institution-unit-filter"
                value={unitId}
                onChange={(event) => {
                  setUnitId(event.target.value)
                  setPage(1)
                }}
              >
                <option value="Todos">{t('Todas as unidades')}</option>
                {data.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={common.field} htmlFor="institution-status">
            {t('Situação')}
            <select
              id="institution-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
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
        id="institution-content"
        role="tabpanel"
        aria-labelledby={'institution-tab-' + tab}
        tabIndex={0}
      >
        {loading ? (
          <LoadingState label={local ? 'Carregando locais…' : 'Carregando turnos…'} />
        ) : loadError ? (
          <div className={common.error} role="alert">
            <p>{t(loadError)}</p>
            <button className={common.secondary} type="button" onClick={retry}>
              {t('Tentar novamente')}
            </button>
          </div>
        ) : (
          <section
            className={`${common.panel} ${tableStyles.tablePanel} ${styles.tablePanel} ${showUnits ? '' : styles.singleUnit}`}
            aria-label={t(local ? 'Locais' : 'Turnos')}
          >
            {shown.length ? (
              <>
                <div className={common.tableWrap}>
                  <table className={common.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('Nome')}</th>
                        {showUnits && <th scope="col">{t('Unidade')}</th>}
                        <th scope="col">{t(local ? 'Tipo de local' : 'Horário')}</th>
                        <th scope="col">{t('Situação')}</th>
                        <th scope="col">{t('Ações')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((item) => (
                        <tr key={item.id}>
                          <td data-label={t('Nome')}>
                            <span className={styles.entryName}>{item.name}</span>
                          </td>
                          {showUnits && (
                            <td data-label={t('Unidade')}>
                              {data.units.find((unit) => unit.id === item.unitId)?.name}
                            </td>
                          )}
                          <td data-label={t(local ? 'Tipo de local' : 'Horário')}>
                            {local ? (
                              t(
                                locationTypes.find((type) => type.value === item.locationType)
                                  ?.label ?? 'Não informado',
                              )
                            ) : (
                              <>
                                {item.startTime} – {item.endTime}
                                {item.endTime &&
                                  item.startTime &&
                                  item.endTime < item.startTime && (
                                    <small className={styles.nextDay}>
                                      {t('Término no dia seguinte')}
                                    </small>
                                  )}
                              </>
                            )}
                          </td>
                          <td data-label={t('Situação')}>{t(item.active ? 'Ativo' : 'Inativo')}</td>
                          <td data-label={t('Ações')}>
                            <div className={common.actions}>
                              <button
                                className={tableStyles.iconButton}
                                type="button"
                                aria-label={t('Ver detalhes de {name}', { name: item.name })}
                                onClick={() => openForm(item, true)}
                              >
                                <Eye aria-hidden="true" />
                              </button>
                              <button
                                className={tableStyles.iconButton}
                                type="button"
                                aria-label={t('Editar {name}', { name: item.name })}
                                onClick={() => openForm(item)}
                              >
                                <FigmaIcon name="edit" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={page}
                  total={total}
                  onChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={(value) => {
                    setPageSize(value)
                    setPage(1)
                  }}
                />
              </>
            ) : (
              <p className={`${common.empty} ${styles.empty}`}>
                {t(
                  local
                    ? 'Nenhum local encontrado para os filtros escolhidos.'
                    : 'Nenhum turno encontrado para os filtros escolhidos.',
                )}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
