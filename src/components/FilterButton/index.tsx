import { Popover } from '@mantine/core'
import { usePreferences } from '../../contexts/usePreferences'
import { FigmaIcon } from '../FigmaIcon'
import type { FilterButtonProps } from '../../types/ui'
import styles from './FilterButton.module.css'

export function FilterButton({ children, active = false, onClear }: FilterButtonProps) {
  const { t } = usePreferences()
  return (
    <Popover position="bottom-end" shadow="md" trapFocus returnFocus withinPortal>
      <Popover.Target>
        <button
          className={styles.trigger}
          type="button"
          aria-label={t(active ? 'Filtrar, filtros ativos' : 'Filtrar')}
        >
          <span>{t('Filtrar')}</span>
          <FigmaIcon name="filter" />
          {active && <i aria-hidden="true" />}
        </button>
      </Popover.Target>
      <Popover.Dropdown className={styles.dropdown}>
        {children}
        <button className={styles.clear} type="button" disabled={!active} onClick={onClear}>
          {t('Limpar filtros')}
        </button>
      </Popover.Dropdown>
    </Popover>
  )
}
