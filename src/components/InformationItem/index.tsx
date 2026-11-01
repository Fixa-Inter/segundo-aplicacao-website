import type { InformationItemProps } from '../../types/ui'
import styles from './InformationItem.module.css'

export function InformationItem({ icon, label, value }: InformationItemProps) {
  return (
    <div className={styles.item}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <dl>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </dl>
    </div>
  )
}
