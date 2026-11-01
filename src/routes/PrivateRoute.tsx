import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../contexts/useAuth'

export function PrivateRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState fullscreen label="Carregando sessão…" />
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
