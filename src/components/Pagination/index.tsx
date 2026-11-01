import { usePreferences } from '../../contexts/usePreferences'
import type { PaginationProps } from '../../types/ui'
import { FigmaIcon } from '../FigmaIcon'
import styles from './Pagination.module.css'

export function Pagination({ page, total, onChange }: PaginationProps) {
  const { t } = usePreferences()
  return (
    <nav className={styles.pager} aria-label={t('Paginação da equipe')}>
      <button
        type="button"
        aria-label={t('Anterior')}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <FigmaIcon name="chevron-left" />
      </button>
      {Array.from({ length: total }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={t('Página {number}', { number })}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label={t('Próxima')}
        disabled={page === total}
        onClick={() => onChange(page + 1)}
      >
        <FigmaIcon name="chevron-right" />
      </button>
    </nav>
  )
}
