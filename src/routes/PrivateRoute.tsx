import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export function PrivateRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p role="status">Carregando sessão…</p>
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
