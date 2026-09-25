import type { StatCardProps } from '../../types/ui'
import styles from './StatCard.module.css'

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <article className={styles.card}>
      <h2>
        <span className={styles.prefix}>Tarefas</span>
        {label}
      </h2>
      <strong className={styles[tone]}>{value}</strong>
    </article>
  )
}
