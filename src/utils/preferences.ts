import type { Preferences } from '../types/preferences'

export const preferencesStorageKey = 'fixa.preferences'

export function parsePreferences(value: string | null): Preferences {
  const defaults: Preferences = { language: 'pt-BR', theme: 'light' }
  try {
    const parsed: unknown = JSON.parse(value ?? 'null')
    if (!parsed || typeof parsed !== 'object') return defaults
    const { language, theme } = parsed as Record<string, unknown>
    return {
      language: language === 'en' || language === 'es' || language === 'zh-CN' ? language : 'pt-BR',
      theme: theme === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return defaults
  }
}
