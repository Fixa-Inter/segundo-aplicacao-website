import type { AuthAction, AuthState } from '../types/auth'

export const initialAuthState: AuthState = { status: 'checking', user: null, error: null }

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { status: 'signing-in', user: null, error: null }
    case 'LOGIN_SUCCESS':
      return { status: 'authenticated', user: action.user, error: null }
    case 'LOGIN_ERROR':
      return { status: 'error', user: null, error: action.error }
    case 'LOGOUT':
      return { status: 'anonymous', user: null, error: null }
    case 'UPDATE_NAME':
      return state.status === 'authenticated'
        ? { ...state, user: { ...state.user, name: action.name } }
        : state
  }
}
