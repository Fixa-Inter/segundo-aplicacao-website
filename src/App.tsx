import { LoadingState } from './components/LoadingState'
import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './routes/PrivateRoute'

const Login = lazy(() => import('./pages/Login'))
const About = lazy(() => import('./pages/About'))
const Recovery = lazy(() => import('./pages/Recovery'))
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Team = lazy(() => import('./pages/Team'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Profile = lazy(() => import('./pages/Profile'))
const Manu = lazy(() => import('./pages/Manu'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Settings = lazy(() => import('./pages/Settings'))
const AppLayout = lazy(() =>
  import('./components/AppLayout').then((module) => ({ default: module.AppLayout })),
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/sobre" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-senha" element={<Recovery key="recover" />} />
      <Route element={<PrivateRoute />}>
        <Route path="/alterar-senha" element={<Recovery key="change" />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipe" element={<Team />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/manu" element={<Manu />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </>,
  ),
)

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingState fullscreen />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  )
}
export default App
