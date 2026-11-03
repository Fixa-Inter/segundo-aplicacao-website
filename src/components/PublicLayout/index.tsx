import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LANDING_PAGE_URL } from '../../constants/links'
import { usePreferences } from '../../contexts/usePreferences'
import { AppFooter } from '../AppFooter'
import styles from './PublicLayout.module.css'

export function PublicLayout() {
  const { t } = usePreferences()
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [pathname])
  return (
    <>
      <header className="sr-only">FIXA</header>
      <nav className={styles.shortcuts} aria-label={t('Navegação principal')}>
        <a href="#conteudo">{t('Pular para o conteúdo')}</a>
        <Link to="/login">{t('Login')}</Link>
        <a href={LANDING_PAGE_URL}>{t('Conheça o projeto')}</a>
      </nav>
      <Outlet />
      <AppFooter />
    </>
  )
}
