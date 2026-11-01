import logo from '../../assets/figma/fixa-logo.png'
import sidebarLogo from '../../assets/figma/sidebar-logo.svg'
import type { BrandProps } from '../../types/ui'
import styles from './Brand.module.css'

export function Brand({ compact = false, collapsed = false, className = '' }: BrandProps) {
  return (
    <span className={`${styles.brand} ${compact ? styles.compact : ''} ${className}`}>
      {compact ? (
        <img
          src={sidebarLogo}
          className={collapsed ? styles.collapsed : undefined}
          width="100"
          height="116"
          alt="FIXA"
        />
      ) : (
        <img src={logo} width="200" height="76" alt="FIXA" />
      )}
    </span>
  )
}
