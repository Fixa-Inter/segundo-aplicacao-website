import type { Language, Preferences, StoredPreferences } from '../types/preferences'

export const preferencesStorageKey = 'fixa.preferences'
export const preferencesVersion = 1

export function serializePreferences(preferences: Preferences): string {
  const stored: StoredPreferences = {
    _versao: preferencesVersion,
    language: preferences.language,
    languageSource: preferences.languageSource,
    theme: preferences.theme,
  }
  return JSON.stringify(stored)
}

export function detectBrowserLanguage(languages: readonly string[] = []): Language {
  for (const language of languages) {
    const locale = language.toLowerCase().replaceAll('_', '-')
    if (locale === 'pt' || locale.startsWith('pt-')) return 'pt-BR'
    if (locale === 'en' || locale.startsWith('en-')) return 'en'
    if (locale === 'es' || locale.startsWith('es-')) return 'es'
    if (/^zh(?:$|-(?:cn|sg|hans)(?:-|$))/.test(locale)) return 'zh-CN'
  }
  return 'pt-BR'
}

export function parsePreferences(
  value: string | null,
  browserLanguages: readonly string[] = [],
): Preferences {
  const defaults: Preferences = {
    language: detectBrowserLanguage(browserLanguages),
    languageSource: 'browser',
    theme: 'light',
  }
  try {
    const parsed: unknown = JSON.parse(value ?? 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults
    if ('_versao' in parsed && parsed._versao !== preferencesVersion) return defaults
    const { language, languageSource, theme } = parsed as Record<string, unknown>

    const manual =
      (languageSource === 'manual' || (languageSource === undefined && language !== 'pt-BR')) &&
      (language === 'pt-BR' || language === 'en' || language === 'es' || language === 'zh-CN')
    return {
      language: manual ? language : defaults.language,
      languageSource: manual ? 'manual' : 'browser',
      theme: theme === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return defaults
  }
}
