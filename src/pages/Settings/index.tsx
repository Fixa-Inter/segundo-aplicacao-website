import { Languages, Moon, Sun } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { usePreferences } from '../../contexts/usePreferences'
import type { Language } from '../../types/preferences'
import common from '../management.module.css'
import styles from './Settings.module.css'

export default function Settings() {
  const { language, languageSource, theme, setLanguage, setTheme, t } = usePreferences()
  return (
    <div className={common.page}>
      <PageHeader title={t('Configurações')} />
      <section className={`${common.panel} ${styles.panel}`} aria-labelledby="language-title">
        <h2 id="language-title">
          <Languages aria-hidden="true" /> {t('Idioma')}
        </h2>
        <label className={common.field} htmlFor="language">
          {t('Idioma da interface')}
          <select
            id="language"
            value={languageSource === 'browser' ? 'browser' : language}
            onChange={(event) => setLanguage(event.target.value as Language | 'browser')}
          >
            <option value="browser">{t('Idioma do navegador')}</option>
            <option value="pt-BR" lang="pt-BR">
              Português
            </option>
            <option value="en" lang="en">
              English
            </option>
            <option value="es" lang="es">
              Español
            </option>
            <option value="zh-CN" lang="zh-CN">
              中文（简体） · Mandarim
            </option>
          </select>
        </label>
      </section>
      <fieldset className={`${common.panel} ${styles.panel}`}>
        <legend>{t('Aparência')}</legend>
        <div className={styles.themes}>
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            />
            <Sun aria-hidden="true" /> {t('Claro')}
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />
            <Moon aria-hidden="true" /> {t('Escuro')}
          </label>
        </div>
      </fieldset>
      <p className={common.muted}>
        {t('As preferências são salvas neste navegador e aplicadas automaticamente.')}
      </p>
    </div>
  )
}
