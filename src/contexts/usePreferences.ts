import { useContext } from 'react'
import { PreferencesContext } from './preferencesContextValue'

export function usePreferences() {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('usePreferences precisa estar dentro de PreferencesProvider')
  return value
}
