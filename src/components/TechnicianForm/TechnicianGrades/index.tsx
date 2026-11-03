import { usePreferences } from '../../../contexts/usePreferences'
import type { TechnicianGradesProps } from '../../../types/technicianForm'
import styles from '../TechnicianForm.module.css'

export function TechnicianGrades({ controller, items }: TechnicianGradesProps) {
  const { t } = usePreferences()
  const { busy, ratings, ratingErrors, updateRating } = controller
  return (
    <fieldset
      disabled={busy}
      className={styles.competencies}
      aria-describedby="technician-competencies-help"
    >
      <legend>{t('Competências')}</legend>
      <p id="technician-competencies-help" className={styles.srOnly}>
        {t(
          'Use uma nota de 0 a 10, com até duas casas decimais. Deixe em branco para remover a avaliação.',
        )}
      </p>
      <div className={styles.competencyGrid}>
        {items.map((item) => {
          const id = `technician-competency-${item.id}`
          return (
            <div className={styles.competencyField} key={item.id}>
              <label htmlFor={id}>{t(item.name)}</label>
              <div className={styles.scoreInput}>
                <input
                  id={id}
                  type="text"
                  inputMode="decimal"
                  maxLength={5}
                  value={ratings[item.id]}
                  aria-invalid={Boolean(ratingErrors[item.id])}
                  aria-describedby={
                    ratingErrors[item.id]
                      ? `${id}-error technician-competencies-help`
                      : 'technician-competencies-help'
                  }
                  onChange={(event) => updateRating(item.id, event.currentTarget.value)}
                />
                <span aria-hidden="true">/10</span>
              </div>
              {ratingErrors[item.id] && (
                <p id={`${id}-error`} className={styles.error} role="alert">
                  {t(ratingErrors[item.id])}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
