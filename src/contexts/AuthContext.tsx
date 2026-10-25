import { useEffect, useReducer } from 'react'
import type { AuthProviderProps } from '../types/ui'
import { login as loginApi, logout as logoutApi, restoreSession } from '../services/authService'
import { api } from '../services/api'
import type { AuthAction, AuthState, LoginCredentials } from '../types/auth'
import { AuthContext } from './authContextValue'
const empty: AuthState = { user: null, loading: false, error: null }
function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { user: action.user, loading: false, error: null }
    case 'LOGIN_ERROR':
      return { user: null, loading: false, error: action.error }
    case 'LOGOUT':
      return empty
    case 'UPDATE_NAME':
      return { ...state, user: state.user ? { ...state.user, name: action.name } : null }
  }
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(reducer, { ...empty, loading: true })
  useEffect(() => {
    let active = true
    const unsubscribe = api.onExpired(() => dispatch({ type: 'LOGOUT' }))
    void restoreSession().then((user) => {
      if (active) dispatch(user ? { type: 'LOGIN_SUCCESS', user } : { type: 'LOGOUT' })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  async function login(credentials: LoginCredentials): Promise<boolean> {
    dispatch({ type: 'LOGIN_START' })
    try {
      const user = await loginApi(credentials)
      dispatch({ type: 'LOGIN_SUCCESS', user })
      return true
    } catch (reason) {
      dispatch({
        type: 'LOGIN_ERROR',
        error: reason instanceof Error ? reason.message : 'Não foi possível entrar.',
      })
      return false
    }
  }
  function logout() {
    logoutApi()
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
