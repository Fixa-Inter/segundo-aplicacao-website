import { usePreferences } from '../../contexts/usePreferences'
import { UnsavedChangesProvider } from '../../contexts/UnsavedChangesContext'
import { useUnsavedChanges } from '../../contexts/useUnsavedChanges'
import { Suspense, useEffect, useRef, useState } from 'react'
import { LoadingState } from '../LoadingState'
import { Drawer } from '@mantine/core'
import { FigmaIcon } from '../FigmaIcon'
import { ConfirmDialog } from '../ConfirmDialog'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import avatar from '../../assets/figma/avatar.png'
import { useAuth } from '../../contexts/useAuth'
import type { NavigationProps } from '../../types/ui'
import styles from './AppLayout.module.css'

const links = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/equipe', label: 'Equipe', icon: 'team' },
  { to: '/calendario', label: 'Calendário', icon: 'calendar' },
  { to: '/manu', label: 'Manu', icon: 'manu' },
] as const

function Navigation({ onNavigate, onLogout }: NavigationProps) {
  const { t } = usePreferences()

  return (
    <>
      <nav className={styles.nav} aria-label={t('Navegação principal')}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            aria-label={t(label)}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {({ isActive }) => (
              <>
                <FigmaIcon name={icon} active={isActive} />
                <span>{t(label)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={styles.account}>
        <NavLink
          to="/perfil"
          aria-label={t('Perfil')}
          onClick={onNavigate}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <FigmaIcon name="profile" active={isActive} />
              <span>{t('Perfil')}</span>
            </>
          )}
        </NavLink>
        <button
          className={`${styles.link} ${styles.logout}`}
          aria-label={t('Sair')}
          type="button"
          onClick={onLogout}
        >
          <FigmaIcon name="logout" />
          <span>{t('Sair')}</span>
        </button>
      </div>
    </>
  )
}

export function AppLayout() {
  return (
    <UnsavedChangesProvider>
      <Layout />
    </UnsavedChangesProvider>
  )
}

function Layout() {
  const { t } = usePreferences()
  const { requestExit } = useUnsavedChanges()

  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarPreference, setSidebarPreference] = useState<boolean | null>(null)
  const compact = sidebarPreference ?? pathname === '/manu'
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  const closeMenu = () => setMenuOpen(false)
  const openLogout = () => {
    setMenuOpen(false)
    setLogoutOpen(true)
  }

  return (
    <div
      className={`${styles.shell} ${compact ? styles.compact : ''} ${pathname === '/manu' ? styles.manu : ''}`}
    >
      <a className={styles.skipLink} href="#conteudo">
        {t('Pular para o conteúdo')}
      </a>
      <aside id="primary-sidebar" className={styles.sidebar}>
        <NavLink to="/" className={styles.logo} aria-label={t('FIXA, início')}>
          <Brand compact collapsed={compact} />
        </NavLink>
        <button
          className={styles.collapseButton}
          type="button"
          aria-label={t(compact ? 'Expandir menu lateral' : 'Recolher menu lateral')}
          title={t(compact ? 'Expandir menu lateral' : 'Recolher menu lateral')}
          aria-controls="primary-sidebar"
          aria-expanded={!compact}
          onClick={() => setSidebarPreference(!compact)}
        >
          {compact ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </button>
        <Navigation onNavigate={closeMenu} onLogout={openLogout} />
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <button
              className={styles.menuButton}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('Abrir menu')}
            >
              <Menu />
            </button>
            <NavLink
              to="/configuracoes"
              className={styles.iconButton}
              aria-label={t('Configurações')}
            >
              <FigmaIcon name="settings" />
            </NavLink>
            <NavLink
              to="/perfil"
              className={styles.avatar}
              aria-label={t('Abrir perfil de {name}', { name: user?.name ?? 'gestor' })}
            >
              <img src={avatar} width="50" height="50" alt="" />
            </NavLink>
          </div>
        </header>
        <main ref={mainRef} id="conteudo" tabIndex={-1} className={styles.main}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Drawer
        closeButtonProps={{ 'aria-label': t('Fechar menu') }}
        opened={menuOpen}
        onClose={closeMenu}
        title={<Brand />}
        size={280}
        classNames={{ body: styles.drawerBody }}
      >
        <Navigation onNavigate={closeMenu} onLogout={openLogout} />
      </Drawer>
      <ConfirmDialog
        opened={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        variant="logout"
        confirmLabel="Sair"
        onConfirm={() => {
          setLogoutOpen(false)
          requestExit(() => {
            logout()
            navigate('/login', { replace: true })
          })
        }}
      />
    </div>
  )
}
