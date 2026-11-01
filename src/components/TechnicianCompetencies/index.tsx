import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import type { TechnicianCompetenciesProps } from '../../types/competency'
import { getCompetencyPresentation } from '../../utils/competencies'
import styles from './TechnicianCompetencies.module.css'

export function TechnicianCompetencies({ technicianId }: TechnicianCompetenciesProps) {
  const { t, formatNumber } = usePreferences()
  const { items, loading, error, retry } = useTechnicianCompetencies(technicianId)
  const [expanded, setExpanded] = useState(false)
  const { highlights, remaining, assessed } = getCompetencyPresentation(items)
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
        {!loading && !error && remaining.length > 0 && (
          <button
            type="button"
            className={styles.more}
            aria-expanded={expanded}
            aria-controls="competencies-list"
            onClick={() => setExpanded((value) => !value)}
          >
            {t(expanded ? 'Ver resumo' : 'Ver todas')}
            <ChevronDown aria-hidden="true" size={18} />
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
          {highlights.length ? (
            <div className={styles.summary}>
              {highlights.map((item) => (
                <article key={item.id} className={styles.card}>
                  <span>{t(item.name)}</span>
                  {rating(item.rating)}
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>{t('Sem notas')}</p>
          )}
          <ul id="competencies-list" className={styles.list} hidden={!expanded}>
            {remaining.map((item) => (
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
