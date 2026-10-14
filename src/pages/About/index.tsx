import { usePreferences } from '../../contexts/usePreferences'
import { ArrowRight, BarChart3, CalendarDays, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import manu from '../../assets/figma/manu-chat.png'
import styles from './About.module.css'

const features = [
  {
    icon: Users,
    title: 'Equipe',
    description: 'Consulte técnicos, turnos e especialidades em uma visão organizada.',
  },
  {
    icon: CalendarDays,
    title: 'Calendário',
    description: 'Visualize os compromissos da equipe e planeje novos eventos.',
  },
  {
    icon: BarChart3,
    title: 'Indicadores',
    description: 'Acompanhe métricas e gráficos para apoiar decisões de gestão.',
  },
]

export default function About() {
  const { t } = usePreferences()

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <Link to="/login" className={styles.headerLink}>
          {t('Acessar demonstração')}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="about-title">
        <div>
          <span className={styles.eyebrow}>{t('Gestão de manutenção')}</span>
          <h1 id="about-title">{t('Sua equipe e suas tarefas em um só lugar.')}</h1>
          <p>
            {t(
              'O FIXA reúne informações de equipe, agenda e indicadores em uma interface para o gestor acompanhar a rotina de manutenção.',
            )}
          </p>
          <Link to="/login" className={styles.primary}>
            {t('Explorar o protótipo')}
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.art}>
          <img src={manu} alt={t('Manu, assistente ilustrada do FIXA')} width="420" height="420" />
        </div>
      </section>

      <section className={styles.features} aria-labelledby="features-title">
        <h2 id="features-title">{t('O que você pode conhecer')}</h2>
        <div className={styles.grid}>
          {features.map(({ icon: Icon, title, description }) => (
            <article key={t(title)}>
              <Icon size={29} strokeWidth={1.8} aria-hidden="true" />
              <h3>{t(title)}</h3>
              <p>{t(description)}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          {t(
            'Protótipo acadêmico: os dados e o acesso são demonstrativos. A API e a inteligência da Manu ainda não estão conectadas.',
          )}
        </p>
      </footer>
    </main>
  )
}
