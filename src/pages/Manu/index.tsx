import { usePreferences } from '../../contexts/usePreferences'
import { FigmaIcon } from '../../components/FigmaIcon'
import manu from '../../assets/figma/manu-chat.png'
import styles from './Manu.module.css'
export default function Manu() {
  const { t } = usePreferences()
  return (
    <div className={styles.page}>
      <aside className={styles.history}>
        <h1>{t('Manu')}</h1>
        <button className={styles.newChat} type="button" disabled>
          <FigmaIcon name="edit" />
          {t('Novo chat')}
        </button>
        <h2>{t('Recentes')}</h2>
        <p>{t('Nenhuma conversa disponível.')}</p>
      </aside>
      <section className={styles.chat} aria-label={t('Manu')}>
        <div className={styles.welcome}>
          <img src={manu} alt="" width="240" height="240" />
          <h2>
            {t('A Manu ainda não está disponível. A integração depende da API de conversas.')}
          </h2>
        </div>
      </section>
    </div>
  )
}
