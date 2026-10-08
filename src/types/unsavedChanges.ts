export interface UnsavedFormState {
  isDirty: boolean
  busy: boolean
}

export interface UnsavedChangesContextValue {
  register: (state: UnsavedFormState) => () => void
  requestExit: (action: () => void) => void
}
