import { useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n/messages'
import type { PreferencesProviderProps } from '../types/ui'
import { formatDate } from '../utils/calendar'
import {
  detectBrowserLanguage,
  parsePreferences,
  preferencesStorageKey,
} from '../utils/preferences'
import { PreferencesContext } from './preferencesContextValue'

function browserLanguages() {
  return navigator.languages.length ? navigator.languages : [navigator.language]
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState(() => {
    try {
      return parsePreferences(localStorage.getItem(preferencesStorageKey), browserLanguages())
    } catch {
      return parsePreferences(null, browserLanguages())
    }
  })

  useEffect(() => {
    document.documentElement.lang = preferences.language
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.style.colorScheme = preferences.theme
    try {
      localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences))
    } catch {
      // Preferências continuam funcionando quando o navegador bloqueia o armazenamento.
    }
  }, [preferences])

  useEffect(() => {
    function updateLanguage() {
      const language = detectBrowserLanguage(browserLanguages())
      setPreferences((current) =>
        current.languageSource === 'browser' && current.language !== language
          ? { ...current, language }
          : current,
      )
    }
    window.addEventListener('languagechange', updateLanguage)
    return () => window.removeEventListener('languagechange', updateLanguage)
  }, [])

  const value = useMemo(
    () => ({
      ...preferences,
      setLanguage: (language: typeof preferences.language | 'browser') =>
        setPreferences((current) => ({
          ...current,
          language: language === 'browser' ? detectBrowserLanguage(browserLanguages()) : language,
          languageSource: language === 'browser' ? 'browser' : 'manual',
        })),
      setTheme: (theme: typeof preferences.theme) =>
        setPreferences((current) => ({ ...current, theme })),
      t: (text: string, values?: Record<string, string | number>) =>
        translate(preferences.language, text, values),
      formatDate: (date: string, options: Intl.DateTimeFormatOptions) =>
        formatDate(date, options, preferences.language),
      formatNumber: (number: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(preferences.language, options).format(number),
    }),
    [preferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
