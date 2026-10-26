import { useState } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import { dashboardFilteredWidgetURL } from '../../utils/dashboardEmbed'
import styles from './TechnicianPerformance.module.css'

export function TechnicianPerformance({ name }: { name: string }) {
  const { t } = usePreferences()
  const [loadedURL, setLoadedURL] = useState('')
  const filter = import.meta.env.VITE_DATABRICKS_TECHNICIAN_FILTER ?? ''
  const url = dashboardFilteredWidgetURL(
    import.meta.env.VITE_DATABRICKS_DASHBOARD_URL,
    import.meta.env.VITE_DATABRICKS_TECHNICIAN_WIDGET,
    { [filter]: name },
  )
  return (
    <section className={styles.panel} aria-labelledby="performance-title">
      <div className={styles.toolbar}>
        <h2 id="performance-title">{t('Desempenho')}</h2>
      </div>
      {url ? (
        <>
          {loadedURL !== url && <p role="status">{t('Carregando dashboard…')}</p>}
          <iframe
            key={url}
            className={styles.frame}
            src={url}
            title={t('Desempenho de {name}', { name })}
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allowFullScreen
            onLoad={() => setLoadedURL(url)}
          />
        </>
      ) : (
        <p>{t('O desempenho deste técnico ainda não está disponível.')}</p>
      )}
    </section>
  )
}
