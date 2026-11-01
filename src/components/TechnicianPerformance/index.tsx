import { usePreferences } from '../../contexts/usePreferences'
import type { TechnicianPerformanceProps } from '../../types/ui'
import { AuthenticatedDashboard } from '../AuthenticatedDashboard'
import styles from './TechnicianPerformance.module.css'

export function TechnicianPerformance({ name }: TechnicianPerformanceProps) {
  const { t } = usePreferences()
  return (
    <section className={styles.panel} aria-labelledby="performance-title">
      <div className={styles.toolbar}>
        <h2 id="performance-title">{t('Desempenho')}</h2>
      </div>
      <div className={styles.frame}>
        <AuthenticatedDashboard
          title={t('Desempenho de {name}', { name })}
          widget={import.meta.env.VITE_DATABRICKS_TECHNICIAN_WIDGET}
          technician={name}
        />
      </div>
    </section>
  )
}
