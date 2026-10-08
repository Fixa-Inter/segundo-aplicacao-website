import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { UnsavedFormState } from '../types/unsavedChanges'
import { UnsavedChangesContext } from './unsavedChangesContextValue'

const clean: UnsavedFormState = { isDirty: false, busy: false }

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState(clean)
  const [exitAction, setExitAction] = useState<(() => void) | null>(null)
  const discardAccepted = useRef(false)
  const register = useCallback((state: UnsavedFormState) => {
    discardAccepted.current = false
    setForm(state)
    return () => setForm(clean)
  }, [])
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      form.isDirty &&
      !discardAccepted.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search ||
        currentLocation.hash !== nextLocation.hash),
  )

  useEffect(() => {
    if (!form.isDirty && blocker.state === 'blocked') blocker.proceed()
  }, [form.isDirty, blocker])

  useEffect(() => {
    if (!form.isDirty) return
    function beforeUnload(event: BeforeUnloadEvent) {
      if (discardAccepted.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [form.isDirty])

  const requestExit = useCallback(
    (action: () => void) => {
      if (form.busy) return
      if (form.isDirty) setExitAction(() => action)
      else action()
    },
    [form],
  )
  const value = useMemo(() => ({ register, requestExit }), [register, requestExit])

  function stay() {
    if (form.busy) return
    setExitAction(null)
    if (blocker.state === 'blocked') blocker.reset()
  }
  function discard() {
    if (form.busy) return
    discardAccepted.current = true
    setExitAction(null)
    if (blocker.state === 'blocked') blocker.proceed()
    else exitAction?.()
  }

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <ConfirmDialog
        opened={Boolean(exitAction) || blocker.state === 'blocked'}
        variant="discard"
        confirmLabel="Descartar"
        busy={form.busy}
        onClose={stay}
        onConfirm={discard}
      />
    </UnsavedChangesContext.Provider>
  )
}
