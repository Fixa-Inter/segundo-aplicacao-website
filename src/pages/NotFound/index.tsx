import { usePreferences } from '../../contexts/usePreferences'
import { Link } from 'react-router-dom'
export default function NotFound() {
  const { t } = usePreferences()

  return (
    <main style={{ maxWidth: 700, margin: '16vh auto', padding: 24 }}>
      <h1>{t('Página não encontrada')}</h1>
      <p>{t('Confira o endereço ou volte para a página inicial.')}</p>
      <Link to="/">{t('Voltar à Home')}</Link>
    </main>
  )
}
