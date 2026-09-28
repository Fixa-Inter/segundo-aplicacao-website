import { useReducer } from 'react'
import type { AuthProviderProps } from '../types/ui'
import { loginMock } from '../services/authService'
import { clearDemoManagement } from '../services/managementService'
import { clearDemoConversations } from '../services/manuService'
import type { AuthAction, AuthState, LoginCredentials } from '../types/auth'

import { AuthContext } from './authContextValue'
const initialState: AuthState = { user: null, loading: false, error: null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { user: action.user, loading: false, error: null }
    case 'LOGIN_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'LOGOUT':
      return initialState
    case 'UPDATE_NAME':
      return { ...state, user: state.user ? { ...state.user, name: action.name } : null }
  }
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  async function login(credentials: LoginCredentials): Promise<boolean> {
    dispatch({ type: 'LOGIN_START' })
    try {
      const user = await loginMock(credentials)
      clearDemoManagement()
      clearDemoConversations()
      dispatch({ type: 'LOGIN_SUCCESS', user })
      return true
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        error: error instanceof Error ? error.message : 'Não foi possível entrar.',
      })
      return false
    }
  }
  function logout() {
    clearDemoManagement()
    clearDemoConversations()
    dispatch({ type: 'LOGOUT' })
  }
  function updateName(name: string) {
    dispatch({ type: 'UPDATE_NAME', name })
  }
  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}
