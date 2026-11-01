import { useEffect, useReducer } from 'react'
import { api } from '../services/api'
import { login as loginApi, logout as logoutApi, restoreSession } from '../services/authService'
import type { LoginCredentials } from '../types/auth'
import { authReducer, initialAuthState } from '../utils/authReducer'
import type { AuthProviderProps } from '../types/ui'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  useEffect(() => {
    let active = true
    const unsubscribe = api.onExpired(() => dispatch({ type: 'LOGOUT' }))
    void restoreSession()
      .then((user) => {
        if (active) dispatch(user ? { type: 'LOGIN_SUCCESS', user } : { type: 'LOGOUT' })
      })
      .catch((reason: unknown) => {
        if (active)
          dispatch({
            type: 'LOGIN_ERROR',
            error:
              reason instanceof Error
                ? reason.message
                : 'Não foi possível verificar sua sessão. Tente novamente.',
          })
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
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.status === 'checking' || state.status === 'signing-in',
        error: state.error,
        login,
        logout,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
