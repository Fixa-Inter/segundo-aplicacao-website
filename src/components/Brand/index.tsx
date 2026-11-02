import logo from '../../assets/figma/fixa-logo.svg'
import darkLogo from '../../assets/figma/fixa-logo-dark.svg'
import darkSidebarLogo from '../../assets/figma/sidebar-logo-dark.svg'
import { usePreferences } from '../../contexts/usePreferences'
import sidebarLogo from '../../assets/figma/sidebar-logo.svg'
import type { BrandProps } from '../../types/ui'
import styles from './Brand.module.css'

export function Brand({ compact = false, collapsed = false, className = '' }: BrandProps) {
  const { theme } = usePreferences()
  const fullLogo = theme === 'dark' ? darkLogo : logo
  const symbol = theme === 'dark' ? darkSidebarLogo : sidebarLogo
  const source = compact ? symbol : fullLogo
  return (
    <span className={`${styles.brand} ${compact ? styles.compact : ''} ${className}`}>
      {compact ? (
        <img
          src={source}
          className={collapsed ? styles.collapsed : undefined}
          width="100"
          height="116"
          alt="FIXA"
        />
      ) : (
        <img src={source} width="200" height="76" alt="FIXA" />
      )}
    </span>
  )
}
