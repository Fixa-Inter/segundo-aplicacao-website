import type { LoadingStateProps } from '../../types/ui'
import logo from '../../assets/figma/sidebar-logo.svg'
import { usePreferences } from '../../contexts/usePreferences'
import styles from './LoadingState.module.css'

export function LoadingState({
  label = 'Carregando página…',
  fullscreen = false,
  compact = false,
}: LoadingStateProps) {
  const { t } = usePreferences()
  return (
    <div
      className={`${styles.root} ${fullscreen ? styles.fullscreen : ''} ${compact ? styles.compact : ''}`}
      role="status"
    >
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.ring} />
        <img src={logo} alt="" width="32" height="36" />
      </span>
      <span>{t(label)}</span>
    </div>
  )
}
