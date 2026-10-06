import { useOutletContext } from 'react-router-dom'
import { createPortal } from 'react-dom'
import type { PageHeaderProps } from '../../types/ui'
import styles from './PageHeader.module.css'

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const actionsTarget = useOutletContext<HTMLElement | null>()
  return (
    <div className={styles.heading}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && (actionsTarget ? createPortal(action, actionsTarget) : action)}
    </div>
  )
}
