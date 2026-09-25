import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <main style={{ maxWidth: 700, margin: '16vh auto', padding: 24 }}>
      <h1>Página não encontrada</h1>
      <p>Confira o endereço ou volte para a página inicial.</p>
      <Link to="/">Voltar à Home</Link>
    </main>
  )
}
