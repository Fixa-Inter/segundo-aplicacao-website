import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './components/AppLayout'
import { PrivateRoute } from './routes/PrivateRoute'

const Login = lazy(() => import('./pages/Login'))
const Recovery = lazy(() => import('./pages/Recovery'))
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Team = lazy(() => import('./pages/Team'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Profile = lazy(() => import('./pages/Profile'))
const Manu = lazy(() => import('./pages/Manu'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <p className="page-loading" role="status">
              Carregando página…
            </p>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<Recovery />} />
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/equipe" element={<Team />} />
                <Route path="/calendario" element={<Calendar />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/manu" element={<Manu />} />
              </Route>
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
export default App
