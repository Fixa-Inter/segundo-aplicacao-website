import { usePreferences } from '../../contexts/usePreferences'
import { PageHeader } from '../../components/PageHeader'
import { AuthenticatedDashboard } from '../../components/AuthenticatedDashboard'
import common from '../management.module.css'
import styles from './Dashboard.module.css'
export default function Dashboard() {
  const { t } = usePreferences()
  return (
    <div className={`${common.page} ${styles.embedPage}`}>
      <PageHeader title={t('Dashboard')} />
      <div className={styles.embedFrame}>
        <AuthenticatedDashboard title={t('Dashboard de manutenção')} />
      </div>
    </div>
  )
}
