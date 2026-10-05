import { usePreferences } from '../../contexts/usePreferences'
import type { StatCardProps } from '../../types/ui'
import styles from './StatCard.module.css'

export function StatCard({ label, value, tone }: StatCardProps) {
  const { t } = usePreferences()

  return (
    <article className={styles.card}>
      <h2>
        <span className={styles.prefix}>{t('Tarefas')}</span>
        {t(label)}
      </h2>
      <strong className={styles[tone]}>{value}</strong>
    </article>
  )
}
