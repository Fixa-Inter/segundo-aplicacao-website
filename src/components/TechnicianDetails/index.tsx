import { useEffect, useRef } from 'react'
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone } from 'lucide-react'
import { DemoBadge } from '../DemoBadge'
import type { PerformancePeriod } from '../../types/management'
import type { TechnicianDetailsProps } from '../../types/ui'
import { formatDate } from '../../utils/calendar'
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
        onClick={onBack}
        aria-label="Voltar para equipe"
      >
        <ArrowLeft size={28} />
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
          <p>Técnico · {technician.specialty}</p>
        </div>
        <button type="button" className={styles.edit} onClick={onEdit}>
          Editar técnico
        </button>
      </div>
      <DemoBadge>Cadastro e desempenho demonstrativos</DemoBadge>
      <section className={styles.information} aria-label="Informações do técnico">
        <h2>Informações</h2>
        <div>
          <p>
            <Mail aria-hidden="true" />
            {technician.email}
          </p>
          <p>
            <Phone aria-hidden="true" />
            {technician.phone}
          </p>
          <p>
            <CalendarDays aria-hidden="true" />
            {formatDate(technician.birthDate, { dateStyle: 'long' })}
          </p>
          <p>
            <MapPin aria-hidden="true" />
            {address} · CEP {technician.postalCode}
            {technician.complement && ` · ${technician.complement}`}
          </p>
        </div>
        <p className={styles.note}>
          Acesso: {technician.accessType} · Turno: {technician.shift} · Situação:{' '}
          {technician.status}. Endereço herdado do gestor.
        </p>
      </section>
      <section className={styles.performance} aria-labelledby="performance-title">
        <div className={styles.toolbar}>
          <h2 id="performance-title">Desempenho</h2>
          <label htmlFor="technician-performance-period">
            Período
            <select
              id="technician-performance-period"
              value={period}
              onChange={(event) => {
                onPeriodChange(event.currentTarget.value as PerformancePeriod)
              }}
            >
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status">Carregando desempenho…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : points.length ? (
          <>
            <div
              className={styles.chart}
              role="img"
              aria-label={points
                .map(
                  (point) =>
                    `${point.label}: ${point.completed} concluídas, ${point.active} em andamento e ${point.late} atrasadas`,
                )
                .join('; ')}
            >
              {points.map((point) => (
                <div className={styles.column} key={point.label}>
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
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.legend}>
              <span>
                <i className={styles.completed} />
                Concluídas
              </span>
              <span>
                <i className={styles.active} />
                Em andamento
              </span>
              <span>
                <i className={styles.late} />
                Atrasadas
              </span>
            </div>
            <p className={styles.note}>
              Fixture sintética, sem vínculo com chamados reais ou eventos do calendário.
            </p>
          </>
        ) : (
          <p>Nenhum registro de desempenho neste período.</p>
        )}
      </section>
    </div>
  )
}
