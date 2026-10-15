import { FigmaIcon } from '../FigmaIcon'
import { TechnicianCompetencies } from '../TechnicianCompetencies'
import { useUnsavedChanges } from '../../contexts/useUnsavedChanges'
import { usePreferences } from '../../contexts/usePreferences'
import { useEffect, useRef } from 'react'
import type { PerformancePeriod } from '../../types/management'
import type { TechnicianDetailsProps } from '../../types/ui'
import styles from './TechnicianDetails.module.css'

export function TechnicianDetails({
  technician,
  onBack,
  onEdit,
  period,
  points,
  loading,
  error,
  onPeriodChange,
}: TechnicianDetailsProps) {
  const { t, formatDate } = usePreferences()
  const { requestExit } = useUnsavedChanges()

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  const max = Math.max(1, ...points.map((point) => point.completed + point.active + point.late))
  const address = [
    technician.address,
    technician.number,
    technician.district,
    technician.city,
    technician.state,
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.back}
        onClick={() => requestExit(onBack)}
        aria-label={t('Voltar para equipe')}
      >
        <FigmaIcon name="back" />
      </button>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {technician.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </span>
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            {technician.name}
          </h1>
          <p>
            {t('Técnico ·')} {technician.specialty}
          </p>
        </div>
        <button type="button" className={styles.edit} onClick={() => requestExit(onEdit)}>
          {t('Editar técnico')}
        </button>
      </div>
      <section className={styles.information} aria-label={t('Informações do técnico')}>
        <h2>{t('Informações')}</h2>
        <div>
          <p>
            <FigmaIcon name="mail" />
            {technician.email}
          </p>
          <p>
            <FigmaIcon name="phone" />
            {technician.phone}
          </p>
          <p>
            <FigmaIcon name="profile-calendar" />
            {formatDate(technician.birthDate, { dateStyle: 'long' })}
          </p>
          <p>
            <FigmaIcon name="location" />
            {address} {t('· CEP')} {technician.postalCode}
            {technician.complement && ` · ${technician.complement}`}
          </p>
        </div>
        <p className={styles.note}>
          {t('Acesso:')}
          {t(technician.accessType)} {t('· Turno:')} {technician.shift} {t('· Situação:')}{' '}
          {t(technician.status)}
          {t('. Endereço herdado do gestor.')}
        </p>
      </section>
      <TechnicianCompetencies key={technician.id} technicianId={technician.id} />
      <section className={styles.performance} aria-labelledby="performance-title">
        <div className={styles.toolbar}>
          <h2 id="performance-title">{t('Desempenho')}</h2>
          <label htmlFor="technician-performance-period">
            {t('Período')}
            <select
              id="technician-performance-period"
              value={period}
              onChange={(event) => {
                onPeriodChange(event.currentTarget.value as PerformancePeriod)
              }}
            >
              <option value="week">{t('Última semana')}</option>
              <option value="month">{t('Último mês')}</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status">{t('Carregando desempenho…')}</p>
        ) : error ? (
          <p role="alert">{t(error)}</p>
        ) : points.length ? (
          <>
            <div
              className={styles.chart}
              role="img"
              aria-label={points
                .map(
                  (point) =>
                    `${t(point.label)}: ${point.completed} concluídas, ${point.active} em andamento e ${point.late} atrasadas`,
                )
                .join('; ')}
            >
              {points.map((point) => (
                <div className={styles.column} key={t(point.label)}>
                  <span className={styles.total}>
                    {point.completed + point.active + point.late}
                  </span>
                  <div
                    className={styles.stack}
                    style={{
                      height: `${((point.completed + point.active + point.late) / max) * 200}px`,
                    }}
                  >
                    <div className={styles.late} style={{ flex: point.late }} />
                    <div className={styles.active} style={{ flex: point.active }} />
                    <div className={styles.completed} style={{ flex: point.completed }} />
                  </div>
                  <span>{t(point.label)}</span>
                </div>
              ))}
            </div>
            <div className={styles.legend}>
              <span>
                <i className={styles.completed} />
                {t('Concluídas')}
              </span>
              <span>
                <i className={styles.active} />
                {t('Em andamento')}
              </span>
              <span>
                <i className={styles.late} />
                {t('Atrasadas')}
              </span>
            </div>
            <p className={styles.note}>
              {t('Fixture sintética, sem vínculo com chamados reais ou eventos do calendário.')}
            </p>
          </>
        ) : (
          <p>{t('Nenhum registro de desempenho neste período.')}</p>
        )}
      </section>
    </div>
  )
}
