import type { PageHeaderProps } from '../../types/ui'
import styles from './PageHeader.module.css'

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className={styles.heading}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  )
}
