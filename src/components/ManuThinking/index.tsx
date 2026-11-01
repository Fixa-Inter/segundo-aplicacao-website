import { manuEmotionImage } from '../../assets/manuEmotions'
import { usePreferences } from '../../contexts/usePreferences'
import styles from './ManuThinking.module.css'

export function ManuThinking() {
  const { t } = usePreferences()
  return (
    <div className={styles.root} role="status">
      <span className={styles.avatar} aria-hidden="true">
        <img src={manuEmotionImage('PENSATIVO')} alt="" width="72" height="72" />
      </span>
      <div className={styles.bubble}>
        <span className={styles.label}>{t('A Manu está preparando uma resposta…')}</span>
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  )
}
