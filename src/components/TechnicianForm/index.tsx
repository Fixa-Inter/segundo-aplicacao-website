import { Eye, EyeOff } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import { useTechnicianFormController } from '../../hooks/useTechnicianFormController'
import type { Address } from '../../types/management'
import type { TechnicianFieldDefinition } from '../../types/technicianForm'
import type { TechnicianFormFieldsProps, TechnicianFormProps } from '../../types/ui'
import { truncateText } from '../../utils/presentation'
import { ConfirmDialog } from '../ConfirmDialog'
import { FigmaIcon } from '../FigmaIcon'
import styles from './TechnicianForm.module.css'
import { TechnicianAssignments } from './TechnicianAssignments'
import { TechnicianGrades } from './TechnicianGrades'

const fields: TechnicianFieldDefinition[] = [
  { key: 'name', label: 'Nome completo', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 100 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
  { key: 'jobTitle', label: 'Função', maxLength: 100 },
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
  if (props.technician?.accessType === 'GESTOR')
    return <TechnicianFormFields {...props} initialCompetencies={[]} />
  return <TechnicianCompetencyForm {...props} />
}
function TechnicianCompetencyForm(props: TechnicianFormProps) {
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

  return <TechnicianFormFields {...props} initialCompetencies={items} />
}
function TechnicianFormFields(props: TechnicianFormFieldsProps) {
  const { t } = usePreferences()
  const { technician, manager, initialCompetencies } = props
  const controller = useTechnicianFormController(props)
  const {
    form,
    technical,
    addressSource,
    birthDate,
    password,
    passwordVisible,
    passwordError,
    errors,
    error,
    pending,
    busy,
    formRef,
    updateField,
    updatePassword,
    togglePassword,
    submit,
    confirmSave,
    closeConfirmation,
    cancel,
  } = controller
  let layoutClass = ''
  if (!technical) layoutClass = styles.manager
  else if (technician) layoutClass = styles.editTechnician

  function renderField(field: (typeof fields)[number]) {
    const id = `technician-${field.key}`
    return (
      <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
        <label htmlFor={id}>{t(field.label)} *</label>
        <input
          id={id}
          type={field.type ?? 'text'}
          value={field.key === 'birthDate' ? birthDate : (form[field.key] ?? '')}
          autoComplete="off"
          autoFocus={field.key === 'name'}
          required
          maxLength={field.maxLength}
          inputMode={field.key === 'birthDate' ? 'numeric' : undefined}
          placeholder={field.key === 'birthDate' ? t('DD/MM/AAAA') : undefined}
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
          <legend className={styles.srOnly}>
            {t(technical ? 'Informações do técnico' : 'Informações do gestor')}
          </legend>
          <div className={`${styles.grid} ${layoutClass}`}>
            {fields.map(renderField)}
            <div className={`${styles.field} ${styles.access}`}>
              <label htmlFor="technician-access">{t('Cargo')}</label>
              <input id="technician-access" value={t(technical ? 'Técnico' : 'Gestor')} readOnly />
            </div>
            <TechnicianAssignments
              controller={controller}
              unitName={technician?.unitName || manager.company}
              initialUnitId={technician?.unitId}
            />
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
          </div>
          {addressSource.address && (
            <div className={`${styles.grid} ${styles.addressGrid}`}>
              {addressFields.map((field) => (
                <div className={`${styles.field} ${styles[field.key]}`} key={field.key}>
                  <label htmlFor={`technician-${field.key}`}>{t(field.label)}</label>
                  <input id={`technician-${field.key}`} value={addressSource[field.key]} readOnly />
                </div>
              ))}
            </div>
          )}
        </fieldset>
        {technical && <TechnicianGrades controller={controller} items={initialCompetencies} />}
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
