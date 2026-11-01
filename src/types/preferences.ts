export type Language = 'pt-BR' | 'en' | 'es' | 'zh-CN'
export type ColorTheme = 'light' | 'dark'

export interface Preferences {
  language: Language
  languageSource: 'browser' | 'manual'
  theme: ColorTheme
}

export interface StoredPreferences extends Preferences {
  _versao: 1
}

export interface PreferencesContextValue extends Preferences {
  setLanguage: (language: Language | 'browser') => void
  setTheme: (theme: ColorTheme) => void
  t: (text: string, values?: Record<string, string | number>) => string
  formatDate: (date: string, options: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}
