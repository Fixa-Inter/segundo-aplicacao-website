import { PinInput } from '@mantine/core'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import manuChange from '../../assets/figma/manu-change-password.png'
import manuCode from '../../assets/figma/manu-recovery-code.png'
import manuPassword from '../../assets/figma/manu-recovery-password.png'
import manuSuccess from '../../assets/figma/manu-recovery-success.png'
import manu from '../../assets/figma/manu-recovery.png'
import { AuthField } from '../../components/AuthField'
import { FigmaIcon } from '../../components/FigmaIcon'
import { useRecoveryPage } from '../../hooks/useRecoveryPage'
import type { RecoveryStep } from '../../types/recovery'
import styles from './Recovery.module.css'

const titles: Record<RecoveryStep, string> = {
  email: 'Esqueceu sua senha?',
  code: 'Verifique seu e-mail',
  password: 'Defina uma nova senha',
  change: 'Troque sua senha',
  success: 'Senha alterada!',
}
const artByStep: Record<RecoveryStep, string> = {
  email: manu,
  code: manuCode,
  password: manuPassword,
  change: manuChange,
  success: manuSuccess,
}

const submitLabels: Record<RecoveryStep, string> = {
  email: 'Enviar e-mail',
  code: 'Continuar',
  password: 'Continuar',
  change: 'Alterar',
  success: 'Continuar',
}

export default function Recovery() {
  const {
    t,
    user,
    logout,
    changing,
    returnTo,
    step,
    form,
    setForm,
    error,
    setError,
    notice,
    busy,
    visible,
    setVisible,
    headingRef,
    formRef,
    back,
    submit,
    resend,
    description,
  } = useRecoveryPage()
  return (
    <main className={styles.page}>
      {step !== 'success' &&
        (step === 'email' || step === 'change' ? (
          <Link
            to={returnTo}
            className={styles.back}
            aria-label={t(user ? 'Voltar ao perfil' : 'Voltar ao login')}
          >
            <FigmaIcon name="back" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={busy}
            className={styles.back}
            onClick={back}
            aria-label={t('Voltar à etapa anterior')}
          >
            <FigmaIcon name="back" />
          </button>
        ))}
      <section className={styles.content} aria-labelledby="recovery-title">
        <header className={styles.heading}>
          <img
            className={styles.manu}
            src={artByStep[step]}
            width="760"
            height="760"
            alt={t('Manu ajudando na recuperação da senha')}
          />
          <h1 ref={headingRef} id="recovery-title" tabIndex={-1}>
            {t(titles[step])}
          </h1>
          {description && <p className={styles.description}>{t(description)}</p>}
        </header>
        {step === 'success' ? (
          <>
            <Link
              className={styles.primary}
              to={changing ? '/login' : returnTo}
              onClick={changing ? logout : undefined}
            >
              {t(changing || !user ? 'Ir para o login' : 'Voltar ao perfil')}
            </Link>
          </>
        ) : (
          <>
            <form
              ref={formRef}
              className={styles.form}
              onSubmit={submit}
              noValidate
              aria-busy={busy}
            >
              {step === 'email' && (
                <>
                  <AuthField
                    id="recovery-email"
                    label={t('Email')}
                    placeholder={t('Digite o seu e-mail')}
                    type="email"
                    autoComplete="off"
                    maxLength={120}
                    disabled={busy}
                    value={form.email}
                    error={error || undefined}
                    onChange={(event) => {
                      const email = event.currentTarget.value
                      setForm((current) => ({ ...current, email }))
                      setError(null)
                    }}
                  />
                </>
              )}
              {step === 'code' && (
                <div className={styles.codeGroup}>
                  <p className={styles.codeLabel}>{t('Código')}</p>
                  {Array.from({ length: 6 }, (_, index) => (
                    <label
                      className={styles.srOnly}
                      htmlFor={`recovery-code-${index + 1}`}
                      key={`code-${index + 1}`}
                    >
                      {t('Dígito')}
                      {index + 1} {t('do código')}
                    </label>
                  ))}
                  <PinInput
                    type="number"
                    length={6}
                    value={form.code}
                    onChange={(code) => {
                      setForm((current) => ({ ...current, code }))
                      setError(null)
                    }}
                    placeholder=""
                    oneTimeCode
                    disabled={busy}
                    ariaLabel={t('Dígito do código de recuperação')}
                    error={Boolean(error)}
                    classNames={{ root: styles.pinRoot, input: styles.pinInput }}
                    getInputProps={(index) => ({
                      id: `recovery-code-${index + 1}`,
                      'aria-label': t('Dígito {number} do código', { number: index + 1 }),
                    })}
                  />
                </div>
              )}
              {(step === 'password' || step === 'change') && (
                <div className={styles.passwordFields}>
                  {step === 'change' && (
                    <AuthField
                      id="current-password"
                      label={t('Senha antiga')}
                      type="password"
                      autoComplete="off"
                      maxLength={100}
                      value={form.current}
                      disabled={busy}
                      onChange={(event) => {
                        const current = event.currentTarget.value
                        setForm((form) => ({ ...form, current }))
                      }}
                    />
                  )}

                  <AuthField
                    id="new-password"
                    label={t('Nova senha')}
                    type={visible ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder={t('Digite sua nova senha')}
                    maxLength={100}
                    disabled={busy}
                    value={form.password}
                    onChange={(event) => {
                      const password = event.currentTarget.value
                      setForm((current) => ({ ...current, password }))
                    }}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setVisible((current) => !current)}
                        aria-label={t(visible ? 'Ocultar nova senha' : 'Mostrar nova senha')}
                      >
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    }
                  />
                  {step === 'password' && (
                    <AuthField
                      id="confirm-password"
                      label={t('Confirme a nova senha')}
                      type={visible ? 'text' : 'password'}
                      autoComplete="off"
                      placeholder={t('Repita sua nova senha')}
                      maxLength={100}
                      disabled={busy}
                      value={form.confirmation}
                      onChange={(event) => {
                        const confirmation = event.currentTarget.value
                        setForm((current) => ({ ...current, confirmation }))
                      }}
                    />
                  )}
                </div>
              )}
              {step !== 'email' && error && (
                <p className={styles.error} role="alert">
                  {t(error)}
                </p>
              )}
              <button className={styles.primary} disabled={busy} type="submit">
                {t(busy ? 'Aguarde…' : submitLabels[step])}
              </button>
            </form>
            {step === 'change' && (
              <p className={styles.resend}>
                {t('Não lembra sua senha?')} <Link to="/recuperar-senha">{t('Enviar código')}</Link>
              </p>
            )}
            {step === 'email' && (
              <Link className={styles.secondary} to="/login">
                {t('Voltar ao login')}
              </Link>
            )}
            {step === 'code' && (
              <p className={styles.resend}>
                {t('Não recebeu o código?')}{' '}
                <button type="button" disabled={busy} onClick={resend}>
                  {t('Reenviar')}
                </button>
              </p>
            )}
            {notice && (
              <p className={styles.demoNote} role="status">
                {t(notice)}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}
