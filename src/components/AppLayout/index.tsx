import { useState } from 'react'
import { Button, Drawer, Modal, Popover } from '@mantine/core'
import {
  Bell,
  CalendarDays,
  ChartPie,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import avatar from '../../assets/figma/avatar.png'
import { useAuth } from '../../contexts/useAuth'
import type { NavigationProps } from '../../types/ui'
import styles from './AppLayout.module.css'

const links = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: ChartPie },
  { to: '/equipe', label: 'Equipe', icon: UsersRound },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/manu', label: 'Manu', icon: MessageCircle },
]

function Navigation({ onNavigate, onLogout }: NavigationProps) {
  return (
    <>
      <nav className={styles.nav} aria-label="Navegação principal">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            aria-label={label}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.account}>
        <NavLink
          to="/perfil"
          aria-label="Perfil"
          onClick={onNavigate}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          <UserRound aria-hidden="true" />
          <span>Perfil</span>
        </NavLink>
        <button
          className={`${styles.link} ${styles.logout}`}
          aria-label="Sair"
          type="button"
          onClick={onLogout}
        >
          <LogOut aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </>
  )
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const compact = useLocation().pathname === '/manu'
  const closeMenu = () => setMenuOpen(false)
  const openLogout = () => {
    setMenuOpen(false)
    setLogoutOpen(true)
  }

  return (
    <div className={`${styles.shell} ${compact ? styles.compact : ''}`}>
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>
      <aside className={styles.sidebar}>
        <NavLink to="/" className={styles.logo} aria-label="FIXA, início">
          <Brand compact />
        </NavLink>
        <Navigation onNavigate={closeMenu} onLogout={openLogout} />
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <button
            className={styles.menuButton}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>
          <Popover position="bottom-end" width={280} withArrow shadow="sm">
            <Popover.Target>
              <button className={styles.iconButton} type="button" aria-label="Notificações">
                <Bell />
              </button>
            </Popover.Target>
            <Popover.Dropdown>
              <p className={styles.notification}>Nenhuma notificação por enquanto.</p>
            </Popover.Dropdown>
          </Popover>
          <NavLink to="/perfil" className={styles.iconButton} aria-label="Configurações do perfil">
            <Settings />
          </NavLink>
          <NavLink
            to="/perfil"
            className={styles.avatar}
            aria-label={`Abrir perfil de ${user?.name ?? 'gestor'}`}
          >
            <img src={avatar} width="50" height="50" alt="" />
          </NavLink>
        </header>
        <main id="conteudo" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
      <Drawer
        opened={menuOpen}
        onClose={closeMenu}
        title={<Brand />}
        size={280}
        classNames={{ body: styles.drawerBody }}
      >
        <Navigation onNavigate={closeMenu} onLogout={openLogout} />
      </Drawer>
      <Modal
        opened={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sair da conta?"
        centered
      >
        <p>Você voltará à tela de login.</p>
        <div className={styles.modalActions}>
          <Button variant="default" onClick={() => setLogoutOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              logout()
              setLogoutOpen(false)
              navigate('/login', { replace: true })
            }}
          >
            Sair
          </Button>
        </div>
      </Modal>
    </div>
  )
}
