import { createContext } from 'react'
import type { PreferencesContextValue } from '../types/preferences'

export type { PreferencesContextValue } from '../types/preferences'
export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
