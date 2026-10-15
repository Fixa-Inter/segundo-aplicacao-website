import { useState } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import type { TechnicianCompetenciesProps } from '../../types/competency'
import { FigmaIcon } from '../FigmaIcon'
import styles from './TechnicianCompetencies.module.css'

export function TechnicianCompetencies({ technicianId }: TechnicianCompetenciesProps) {
  const { t, formatNumber } = usePreferences()
  const { items, loading, error, retry } = useTechnicianCompetencies(technicianId)
  const [expanded, setExpanded] = useState(false)
  const ranked = [...items].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.id - b.id)
  const assessed = items.filter((item) => item.rating !== null).length
  const rating = (value: number | null) => (
    <span className={styles.rating} aria-label={value === null ? t('Sem avaliação') : undefined}>
      <span className={value === null ? styles.empty : undefined}>
        {value === null ? '_' : formatNumber(value)}
      </span>
      <small>/10</small>
    </span>
  )

  return (
    <section className={styles.section} aria-labelledby="competencies-title">
      <div className={styles.header}>
        <div>
          <h2 id="competencies-title">{t('Competências')}</h2>
          {!loading && !error && (
            <p>{t('{count} de 10 avaliadas', { count: formatNumber(assessed) })}</p>
          )}
        </div>
        {!loading && !error && (
          <button
            type="button"
            className={styles.more}
            aria-expanded={expanded}
            aria-controls="competencies-list"
            onClick={() => setExpanded((value) => !value)}
          >
            {t(expanded ? 'Ver resumo' : 'Ver todas')}
            <FigmaIcon name={expanded ? 'chevron-left' : 'chevron-right'} />
          </button>
        )}
      </div>
      {loading ? (
        <p role="status">{t('Carregando competências…')}</p>
      ) : error ? (
        <div role="alert">
          <p>{t(error)}</p>
          <button className={styles.more} type="button" onClick={retry}>
            {t('Tentar novamente')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            {ranked.slice(0, 3).map((item) => (
              <article key={item.id} className={styles.card}>
                <span>{t(item.name)}</span>
                {rating(item.rating)}
              </article>
            ))}
          </div>
          <ul id="competencies-list" className={styles.list} hidden={!expanded}>
            {ranked.map((item) => (
              <li key={item.id}>
                <span className={styles.category}>{t(item.name)}</span>
                {rating(item.rating)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
