import logo from '../../assets/figma/fixa-logo.png'
import type { BrandProps } from '../../types/ui'
import styles from './Brand.module.css'
export function Brand({ compact = false, className = '' }: BrandProps) {
  return (
    <span className={`${styles.brand} ${compact ? styles.compact : ''} ${className}`}>
      <img src={logo} width="200" height="76" alt="FIXA" />
    </span>
  )
}
