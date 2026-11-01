import avatar from '../../assets/figma/avatar.png'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FigmaIcon } from '../../components/FigmaIcon'
import { InformationItem } from '../../components/InformationItem'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { useProfilePage } from '../../hooks/useProfilePage'
import { formatDate as formatDateInput } from '../../utils/calendar'
import { truncateText } from '../../utils/presentation'
import common from '../management.module.css'
import styles from './Profile.module.css'

const fields: {
  key: 'name' | 'email' | 'birthDate'
  label: string
  type?: string
  maxLength: number
}[] = [
  { key: 'name', label: 'Nome', maxLength: 100 },
  { key: 'email', label: 'E-mail', type: 'email', maxLength: 100 },
  { key: 'birthDate', label: 'Data de nascimento', maxLength: 10 },
]

export default function Profile() {
  const {
    t,
    formatDate,
    navigate,
    pending,
    setPending,
    user,
    profile,
    setProfile,
    loading,
    setLoading,
    loadError,
    setLoadError,
    setLoadAttempt,
    busy,
    editing,
    setEditing,
    error,
    setError,
    notice,
    fieldErrors,
    setFieldErrors,
    birthDateText,
    setBirthDateText,
    editButtonRef,
    formRef,
    cancel,
    save,
    confirmSave,
    address,
  } = useProfilePage()
  return (
    <div className={`${common.page} ${styles.page}`}>
      <PageHeader title={t(editing ? 'Editar Perfil' : 'Perfil')} />
      {notice && (
        <p role="status" className={common.status}>
          {t(notice)}
        </p>
      )}
      {error && (
        <p role="alert" className={common.error}>
          {t(error)}
        </p>
      )}
      {loading ? (
        <LoadingState label="Carregando perfil…" />
      ) : loadError ? (
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
      ) : (
        <>
          <div className={styles.identity}>
            <img src={avatar} width="88" height="88" alt={t('Avatar ilustrativo do perfil')} />
            <div className={styles.identityText}>
              <h2 title={profile.name} aria-label={profile.name}>
                {truncateText(profile.name) || t('Não informado')}
              </h2>
              <p>
                {t(user?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Gestor')} ·{' '}
                {profile.company || t('Não informado')}
              </p>
            </div>
            {!editing && (
              <button
                className={common.primary}
                type="button"
                onClick={() => {
                  navigate('/alterar-senha')
                }}
              >
                {t('Alterar senha')}
              </button>
            )}
          </div>
          {editing ? (
            <form ref={formRef} className={styles.form} onSubmit={save} noValidate aria-busy={busy}>
              <div className={styles.profileGrid}>
                {fields.map((field) => (
                  <div className={common.field} key={field.key}>
                    <label htmlFor={`profile-${field.key}`}>{t(field.label)}</label>
                    <input
                      id={`profile-${field.key}`}
                      disabled={busy}
                      type={field.type ?? 'text'}
                      maxLength={field.maxLength}
                      value={field.key === 'birthDate' ? birthDateText : profile[field.key]}
                      placeholder={field.key === 'birthDate' ? t('DD/MM/AAAA') : undefined}
                      inputMode={field.key === 'birthDate' ? 'numeric' : undefined}
                      aria-invalid={Boolean(fieldErrors[field.key])}
                      aria-describedby={
                        fieldErrors[field.key] ? `profile-${field.key}-error` : undefined
                      }
                      onChange={(event) => {
                        const value = event.target.value
                        if (field.key === 'birthDate') setBirthDateText(value)
                        else setProfile((current) => ({ ...current, [field.key]: value }))
                        setFieldErrors((current) => ({ ...current, [field.key]: undefined }))
                      }}
                    />
                    {fieldErrors[field.key] && (
                      <span id={`profile-${field.key}-error`} role="alert" className={common.error}>
                        {t(fieldErrors[field.key] ?? '')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <section className={styles.locationInfo} aria-label={t('Localização')}>
                <InformationItem
                  icon={<FigmaIcon name="location" />}
                  label={t('Localização')}
                  value={address || t('Não informado')}
                />
              </section>
              <div className={common.formActions}>
                <button className={common.secondary} type="button" onClick={cancel} disabled={busy}>
                  {t('Cancelar')}
                </button>
                <button className={common.primary} type="submit" disabled={busy}>
                  {t(busy ? 'Salvando…' : 'Salvar')}
                </button>
              </div>
            </form>
          ) : (
            <section className={styles.information} aria-label={t('Informações do perfil')}>
              <h3>{t('Informações')}</h3>
              <div>
                <InformationItem
                  icon={<FigmaIcon name="location" />}
                  label={t('Localização')}
                  value={address || t('Não informado')}
                />
                <InformationItem
                  icon={<FigmaIcon name="mail" />}
                  label={t('E-mail')}
                  value={profile.email || t('Não informado')}
                />
                <InformationItem
                  icon={<FigmaIcon name="profile-calendar" />}
                  label={t('Data de nascimento')}
                  value={
                    profile.birthDate
                      ? formatDate(profile.birthDate, { dateStyle: 'long' })
                      : t('Não informado')
                  }
                />
              </div>
              <button
                ref={editButtonRef}
                className={common.secondary}
                type="button"
                onClick={() => {
                  setError('')
                  setBirthDateText(
                    profile.birthDate
                      ? formatDateInput(profile.birthDate, { dateStyle: 'short' })
                      : '',
                  )
                  setEditing(true)
                }}
              >
                <FigmaIcon name="profile-edit" /> {t('Editar perfil')}
              </button>
            </section>
          )}
        </>
      )}
      <ConfirmDialog
        opened={Boolean(pending)}
        variant="save"
        subject={profile.name}
        confirmLabel="Salvar"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmSave}
      />
    </div>
  )
}
