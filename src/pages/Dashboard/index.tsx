import { useState } from 'react'
import { BarChart3, ExternalLink } from 'lucide-react'
import { usePreferences } from '../../contexts/usePreferences'
import { PageHeader } from '../../components/PageHeader'
import common from '../management.module.css'
import styles from './Dashboard.module.css'
import { dashboardEmbedURL } from '../../utils/dashboardEmbed'
export default function Dashboard() {
  const { t } = usePreferences()
  const url = dashboardEmbedURL(import.meta.env.VITE_DATABRICKS_DASHBOARD_URL)
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`${common.page} ${styles.embedPage}`}>
      <PageHeader title={t('Dashboard')} />
      {url ? (
        <>
          <div className={styles.embedToolbar}>
            <p>{t('O acesso segue as permissões do Databricks.')}</p>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {t('Abrir em nova aba')}
              <ExternalLink size={16} />
            </a>
          </div>
          {!loaded && <p role="status">{t('Carregando dashboard…')}</p>}
          <iframe
            className={styles.embedFrame}
            src={url}
            title={t('Dashboard de manutenção')}
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <section className={styles.embedEmpty}>
          <BarChart3 size={44} aria-hidden="true" />
          <h2>{t('Seus indicadores em um só lugar')}</h2>
          <p>
            {t(
              'O dashboard estará disponível assim que a integração com o Databricks for liberada.',
            )}
          </p>
        </section>
      )}
    </div>
  )
}
