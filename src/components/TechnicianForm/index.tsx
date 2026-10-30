import { ConfirmDialog } from '../ConfirmDialog'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import { Eye, EyeOff } from 'lucide-react'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import { useTechnicianFormController } from '../../hooks/useTechnicianFormController'
import type { Address, TechnicianInput } from '../../types/management'
import type { TechnicianFormProps, TechnicianFormFieldsProps } from '../../types/ui'
import type { TechnicianFieldDefinition } from '../../types/technicianForm'
import { truncateText } from '../../utils/presentation'
import styles from './TechnicianForm.module.css'
const fields: TechnicianFieldDefinition[] = [
  { key: 'name', label: 'Nome completo', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 100 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
  { key: 'jobTitle', label: 'Função', maxLength: 100 },
  { key: 'specialty', label: 'Especialidade', maxLength: 60 },
  { key: 'shift', label: 'Turno', maxLength: 13 },
]
const addressFields: { key: keyof Address; label: string }[] = [
  { key: 'postalCode', label: 'CEP' },
  { key: 'address', label: 'Logradouro' },
  { key: 'district', label: 'Bairro' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'number', label: 'Número' },
  { key: 'complement', label: 'Complemento' },
]
export function TechnicianForm(props: TechnicianFormProps) {
  const { t } = usePreferences()
  const { items, loading, error, retry } = useTechnicianCompetencies(props.technician?.id)
  if (loading || error)
    return (
      <div className={styles.page}>
        <button
          className={styles.back}
          type="button"
          onClick={props.onCancel}
          aria-label={t('Voltar para equipe')}
        >
          <FigmaIcon name="back" />
        </button>
        <h1 className={styles.title}>{t('Competências')}</h1>
        {loading ? (
          <p role="status">{t('Carregando competências…')}</p>
        ) : (
          <div role="alert">
            <p>{t(error)}</p>
            <button className={styles.retry} type="button" onClick={retry}>
              {t('Tentar novamente')}
            </button>
          </div>
        )}
      </div>
    )
  // O formulário só é montado após a leitura, preservando a base real do isDirty.
  return <TechnicianFormFields {...props} initialCompetencies={items} />
}
function TechnicianFormFields(props: TechnicianFormFieldsProps) {
  const { t } = usePreferences()
  const { technician, manager, initialCompetencies } = props
  const {
    form,
    institutional,
    cnpj,
    workUnits,
    unitError,
    unitsLoading,
    shifts,
    shiftError,
    shiftsLoading,
    retryUnits,
    retryShifts,
    addressSource,
    birthDate,
    ratings,
    draftSpecialty,
    ratingErrors,
    password,
    passwordVisible,
    passwordError,
    errors,
    error,
    pending,
    busy,
    formRef,
    updateField,
    selectUnit,
    selectShift,
    updateStatus,
    updatePassword,
    togglePassword,
    updateRating,
    submit,
    confirmSave,
    closeConfirmation,
    cancel,
  } = useTechnicianFormController(props)
  function renderField(field: (typeof fields)[number]) {
    const id = `technician-${field.key}`
    return (
      <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
        <label htmlFor={id}>{t(field.label)} *</label>
        <input
          id={id}
          type={field.type ?? 'text'}
          value={field.key === 'birthDate' ? birthDate : String(form[field.key] ?? '')}
          autoComplete="off"
          autoFocus={field.key === 'name'}
          required
          maxLength={field.maxLength}
          inputMode={field.key === 'birthDate' ? 'numeric' : undefined}
          placeholder={
            field.key === 'birthDate'
              ? t('DD/MM/AAAA')
              : field.key === 'shift'
                ? '08:00 - 16:00'
                : undefined
          }
          aria-invalid={Boolean(errors[field.key])}
          aria-describedby={errors[field.key] ? `${id}-error` : undefined}
          onChange={(event) => updateField(field.key, event.currentTarget.value)}
        />
        {errors[field.key] && (
          <span id={`${id}-error`} className={styles.error} role="alert">
            {t(errors[field.key] ?? '')}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className={styles.page}>
      <button
        className={styles.back}
        type="button"
        onClick={cancel}
        disabled={busy}
        aria-label={t('Voltar para equipe')}
      >
        <FigmaIcon name="back" />
      </button>
      <h1 className={styles.title} title={technician?.name}>
        <span>{t(technician ? 'Edite' : 'Adicione um novo')}</span>{' '}
        {technician ? truncateText(technician.name) : t('funcionário')}
      </h1>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className={styles.srOnly}>{t('Informações do técnico')}</legend>
          <div className={styles.grid}>
            {fields.slice(0, 3).map(renderField)}
            {renderField(fields[3])}
            <div className={`${styles.field} ${styles.access}`}>
              <label htmlFor="technician-access">{t('Cargo')}</label>
              <input id="technician-access" value={t('Técnico')} readOnly />
            </div>
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
                      disabled={!unit.active && unit.id !== technician?.unitId}
                    >
                      {unit.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="technician-unit"
                  value={
                    technician?.unitName || manager.company || t('Unidade do CNPJ {cnpj}', { cnpj })
                  }
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
            <div className={[styles.field, styles.specialty].join(' ')}>
              <label htmlFor="technician-specialty">{t('Especialidade')}</label>
              <input id="technician-specialty" value={t(draftSpecialty || 'Sem notas')} readOnly />
            </div>
            <div className={`${styles.field} ${styles.shift}`}>
              <label htmlFor="technician-shift">{t('Turno')} *</label>
              <select
                id="technician-shift"
                value={form.shiftId ?? ''}
                required
                disabled={busy || !shifts.length || (institutional && !form.unitId)}
                aria-invalid={Boolean(errors.shiftId)}
                aria-describedby={errors.shiftId ? 'technician-shift-error' : undefined}
                onChange={(event) => selectShift(event.currentTarget.value)}
              >
                <option value="" disabled>
                  {t('Selecione um turno')}
                </option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
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
            <div className={`${styles.field} ${styles.status}`}>
              <label htmlFor="technician-status">{t('Situação')}</label>
              <select
                id="technician-status"
                value={form.status}
                onChange={(event) =>
                  updateStatus(event.currentTarget.value as TechnicianInput['status'])
                }
              >
                <option value="Ativo">{t('Ativo')}</option>
                <option value="Inativo">{t('Inativo')}</option>
              </select>
            </div>
            {!technician && (
              <div className={`${styles.field} ${styles.password}`}>
                <label htmlFor="technician-password">{t('Senha inicial *')}</label>
                <span className={styles.passwordField}>
                  <input
                    id="technician-password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    autoComplete="off"
                    maxLength={100}
                    required
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'technician-password-error' : undefined}
                    onChange={(event) => updatePassword(event.currentTarget.value)}
                  />
                  <button
                    type="button"
                    aria-label={t(passwordVisible ? 'Ocultar senha' : 'Mostrar senha')}
                    aria-pressed={passwordVisible}
                    onClick={togglePassword}
                  >
                    {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
                <span
                  id="technician-password-error"
                  className={styles.error}
                  role={passwordError ? 'alert' : undefined}
                >
                  {t(passwordError ?? '')}
                </span>
              </div>
            )}
            {(addressSource.address ? addressFields : []).map((field) => (
              <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
                <label htmlFor={`technician-${field.key}`}>{t(field.label)}</label>
                <input id={`technician-${field.key}`} value={addressSource[field.key]} readOnly />
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset
          disabled={busy}
          className={styles.competencies}
          aria-describedby="technician-competencies-help"
        >
          <legend>{t('Competências')}</legend>
          <p id="technician-competencies-help" className={styles.srOnly}>
            {t(
              'Use uma nota de 0 a 10, com até duas casas decimais. Deixe em branco para remover a avaliação.',
            )}
          </p>
          <div className={styles.competencyGrid}>
            {initialCompetencies.map((item) => {
              const id = `technician-competency-${item.id}`
              return (
                <div className={styles.competencyField} key={item.id}>
                  <label htmlFor={id}>{t(item.name)}</label>
                  <div className={styles.scoreInput}>
                    <input
                      id={id}
                      type="text"
                      inputMode="decimal"
                      maxLength={5}
                      value={ratings[item.id]}
                      aria-invalid={Boolean(ratingErrors[item.id])}
                      aria-describedby={
                        ratingErrors[item.id]
                          ? `${id}-error technician-competencies-help`
                          : 'technician-competencies-help'
                      }
                      onChange={(event) => updateRating(item.id, event.currentTarget.value)}
                    />
                    <span aria-hidden="true">/10</span>
                  </div>
                  {ratingErrors[item.id] && (
                    <p id={`${id}-error`} className={styles.error} role="alert">
                      {t(ratingErrors[item.id])}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className={styles.error}>
            {t(error)}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={cancel} disabled={busy}>
            {t('Cancelar')}
          </button>
          <button className={styles.save} type="submit" disabled={busy}>
            {t(busy ? 'Salvando…' : 'Salvar')}
          </button>
        </div>
      </form>
      <ConfirmDialog
        opened={Boolean(pending)}
        variant="save"
        subject={form.name}
        confirmLabel="Salvar"
        busy={busy}
        onClose={closeConfirmation}
        onConfirm={confirmSave}
      />
    </div>
  )
}
