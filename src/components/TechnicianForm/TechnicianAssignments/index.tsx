import { MultiSelect } from '@mantine/core'
import { usePreferences } from '../../../contexts/usePreferences'
import type { TechnicianInput } from '../../../types/management'
import type { TechnicianAssignmentsProps } from '../../../types/technicianForm'
import styles from '../TechnicianForm.module.css'

export function TechnicianAssignments({
  controller,
  unitName,
  initialUnitId,
}: TechnicianAssignmentsProps) {
  const { t } = usePreferences()
  const {
    form,
    institutional,
    technical,
    cnpj,
    workUnits,
    unitError,
    unitsLoading,
    shifts,
    shiftError,
    shiftsLoading,
    retryUnits,
    retryShifts,
    draftSpecialty,
    errors,
    busy,
    selectUnit,
    selectShifts,
    updateStatus,
  } = controller
  return (
    <>
      <div className={[styles.field, styles.workUnit].join(' ')}>
        <label htmlFor="technician-unit">
          {t('Unidade de trabalho')}
          {institutional ? ' *' : ''}
        </label>
        {institutional ? (
          <select
            id="technician-unit"
            value={form.unitId ?? ''}
            disabled={busy || !workUnits.length}
            aria-invalid={Boolean(errors.unitId)}
            aria-describedby={errors.unitId ? 'technician-unit-error' : undefined}
            onChange={(event) => selectUnit(event.currentTarget.value)}
          >
            <option value="" disabled>
              {t('Selecione uma unidade de trabalho')}
            </option>
            {workUnits.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
                disabled={!unit.active && unit.id !== initialUnitId}
              >
                {unit.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="technician-unit"
            value={unitName || t('Unidade do CNPJ {cnpj}', { cnpj })}
            readOnly
            title={t('Definida pelo RH')}
          />
        )}
        {errors.unitId && (
          <span id="technician-unit-error" className={styles.error} role="alert">
            {t(errors.unitId)}
          </span>
        )}
        {unitsLoading && <p role="status">{t('Carregando unidades…')}</p>}
        {unitError && (
          <div role="alert">
            <p>{t(unitError)}</p>
            <button type="button" className={styles.retry} onClick={retryUnits}>
              {t('Tentar novamente')}
            </button>
          </div>
        )}
      </div>
      {technical && (
        <>
          <div className={[styles.field, styles.specialty].join(' ')}>
            <label htmlFor="technician-specialty">{t('Especialidade')}</label>
            <input id="technician-specialty" value={t(draftSpecialty || 'Sem notas')} readOnly />
          </div>
          <div className={`${styles.field} ${styles.shift}`}>
            <label htmlFor="technician-shift">{t('Turnos')} *</label>
            <MultiSelect
              id="technician-shift"
              classNames={{ input: styles.shiftInput, inputField: styles.shiftSearch }}
              data={shifts.map((shift) => ({ value: shift.id, label: shift.name }))}
              value={form.shiftIds ?? []}
              onChange={selectShifts}
              placeholder={form.shiftIds?.length ? undefined : t('Selecione os turnos')}
              nothingFoundMessage={t('Nenhum turno encontrado para os filtros escolhidos.')}
              searchable
              hidePickedOptions
              disabled={
                busy ||
                shiftsLoading ||
                Boolean(shiftError) ||
                !shifts.length ||
                (institutional && !form.unitId)
              }
              aria-invalid={Boolean(errors.shiftId)}
              aria-describedby={errors.shiftId ? 'technician-shift-error' : undefined}
              comboboxProps={{ withinPortal: true }}
            />
            {!shiftsLoading && !shifts.length && !shiftError && (
              <p>{t('Nenhum turno ativo cadastrado na unidade.')}</p>
            )}
            {shiftsLoading && <p role="status">{t('Carregando turnos…')}</p>}
            {shiftError && (
              <div role="alert">
                <p>{t(shiftError)}</p>
                <button type="button" onClick={retryShifts}>
                  {t('Tentar novamente')}
                </button>
              </div>
            )}
            {errors.shiftId && (
              <p id="technician-shift-error" role="alert" className={styles.error}>
                {t(errors.shiftId)}
              </p>
            )}
          </div>
        </>
      )}
      <div className={`${styles.field} ${styles.status}`}>
        <label htmlFor="technician-status">{t('Situação')}</label>
        <select
          id="technician-status"
          value={form.status}
          onChange={(event) => updateStatus(event.currentTarget.value as TechnicianInput['status'])}
        >
          <option value="Ativo">{t('Ativo')}</option>
          <option value="Inativo">{t('Inativo')}</option>
        </select>
      </div>
    </>
  )
}
