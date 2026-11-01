import { useContext, useLayoutEffect } from 'react'
import { UnsavedChangesContext } from './unsavedChangesContextValue'

export function useUnsavedChanges() {
  const value = useContext(UnsavedChangesContext)
  if (!value) throw new Error('useUnsavedChanges precisa estar dentro de UnsavedChangesProvider')
  return value
}

export function useUnsavedForm(isDirty: boolean, busy: boolean) {
  const { register, requestExit } = useUnsavedChanges()

  useLayoutEffect(() => register({ isDirty, busy }), [register, isDirty, busy])
  return requestExit
}
