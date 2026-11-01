import type { FigmaIconProps } from '../../types/ui'
import styles from './FigmaIcon.module.css'

const icons = import.meta.glob<string>('../../assets/figma/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function FigmaIcon({ name, active = false }: FigmaIconProps) {
  const activePath = `../../assets/figma/icons/${name}-active.svg`
  const source = icons[activePath] && active ? activePath : `../../assets/figma/icons/${name}.svg`
  return <img className={styles.icon} src={icons[source]} alt="" aria-hidden="true" />
}
