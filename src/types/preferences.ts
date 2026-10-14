export type Language = 'pt-BR' | 'en' | 'es' | 'zh-CN'
export type ColorTheme = 'light' | 'dark'

export interface Preferences {
  language: Language
  theme: ColorTheme
}
