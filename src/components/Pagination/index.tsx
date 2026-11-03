import { usePreferences } from '../../contexts/usePreferences'
import type { PaginationProps } from '../../types/ui'
import { FigmaIcon } from '../FigmaIcon'
import styles from './Pagination.module.css'

export function Pagination({ page, total, pageSize, onPageSizeChange, onChange }: PaginationProps) {
  const { t, formatNumber } = usePreferences()
  const pages = Array.from(new Set([1, page - 1, page, page + 1, total]))
    .filter((number) => number >= 1 && number <= total)
    .sort((a, b) => a - b)
  return (
    <div className={styles.footer} data-pagination>
      <label className={styles.size}>
        <span>{t('Linhas por página')}</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[3, 5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {formatNumber(size)}
            </option>
          ))}
        </select>
      </label>
      <nav className={styles.pager} aria-label={t('Paginação')}>
        <button
          type="button"
          aria-label={t('Anterior')}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <FigmaIcon name="chevron-left" />
        </button>
        <div className={styles.numbers}>
          {pages.map((number, index) => (
            <span className={styles.pageItem} key={number}>
              {index > 0 && number > pages[index - 1] + 1 && (
                <span className={styles.ellipsis} aria-hidden="true">
                  …
                </span>
              )}
              <button
                type="button"
                aria-label={t('Página {number}', { number })}
                aria-current={number === page ? 'page' : undefined}
                onClick={() => onChange(number)}
              >
                {formatNumber(number)}
              </button>
            </span>
          ))}
        </div>
        <div className={styles.mobilePage}>
          <select
            aria-label={t('Página')}
            value={page}
            onChange={(event) => onChange(Number(event.target.value))}
          >
            {Array.from({ length: total }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {formatNumber(index + 1)}
              </option>
            ))}
          </select>
          <span>{t('de {total}', { total: formatNumber(total) })}</span>
        </div>
        <button
          type="button"
          aria-label={t('Próxima')}
          disabled={page === total}
          onClick={() => onChange(page + 1)}
        >
          <FigmaIcon name="chevron-right" />
        </button>
      </nav>
    </div>
  )
}
