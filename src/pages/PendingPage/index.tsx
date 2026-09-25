import { Link } from 'react-router-dom'
import styles from './PendingPage.module.css'

export default function PendingPage({ title }: { title: string }) {
  return (
    <section className={styles.panel}>
      <h1>{title}</h1>
      <p>
        Esta seção está na próxima etapa de desenvolvimento. O menu e as rotas já funcionam, mas os
        dados e as ações desta página ainda não foram implementados.
      </p>
      <Link to="/">Voltar à Home</Link>
    </section>
  )
}
