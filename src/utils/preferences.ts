import type { Language, Preferences } from '../types/preferences'

export const preferencesStorageKey = 'fixa.preferences'

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
    if (!parsed || typeof parsed !== 'object') return defaults
    const { language, languageSource, theme } = parsed as Record<string, unknown>
    // O formato antigo usava português como padrão e não registrava a origem.
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
