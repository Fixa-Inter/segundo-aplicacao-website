import { Link } from 'react-router-dom'
import { usePreferences } from '../../contexts/usePreferences'

export default function NotFound() {
  const { t } = usePreferences()

  return (
    <main id="conteudo" tabIndex={-1} style={{ maxWidth: 700, margin: '16vh auto', padding: 24 }}>
      <h1>{t('Página não encontrada')}</h1>
      <p>{t('Confira o endereço ou volte para a página inicial.')}</p>
      <Link to="/">{t('Voltar à Home')}</Link>
    </main>
  )
}
