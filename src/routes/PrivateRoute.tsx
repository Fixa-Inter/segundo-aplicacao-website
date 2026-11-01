import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { LoadingState } from '../components/LoadingState'

export function PrivateRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState fullscreen label="Carregando sessão…" />
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
