import { useEffect, useMemo, useState } from 'react'
import { PreferencesContext } from './preferencesContextValue'
import { parsePreferences, preferencesStorageKey } from '../utils/preferences'
import { translate } from '../i18n/messages'
import { formatDate } from '../utils/calendar'
import type { PreferencesProviderProps } from '../types/ui'

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState(() => {
    try {
      return parsePreferences(localStorage.getItem(preferencesStorageKey))
    } catch {
      return parsePreferences(null)
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

  const value = useMemo(
    () => ({
      ...preferences,
      setLanguage: (language: typeof preferences.language) =>
        setPreferences((current) => ({ ...current, language })),
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
