import type { DemoBadgeProps } from '../../types/ui'
import styles from './DemoBadge.module.css'

export function DemoBadge({ children }: DemoBadgeProps) {
  return <span className={styles.badge}>{children}</span>
}
