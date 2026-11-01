import { createContext } from 'react'
import type { UnsavedChangesContextValue } from '../types/unsavedChanges'

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)
