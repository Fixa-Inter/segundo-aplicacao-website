import { createContext } from 'react'
import type { ColorTheme, Language, Preferences } from '../types/preferences'

export interface PreferencesContextValue extends Preferences {
  setLanguage: (language: Language | 'browser') => void
  setTheme: (theme: ColorTheme) => void
  t: (text: string, values?: Record<string, string | number>) => string
  formatDate: (date: string, options: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
