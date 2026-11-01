import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink } from 'lucide-react'
import { usePreferences } from '../../../contexts/usePreferences'
import type { ManuLinkProps, ManuResponseProps } from '../../../types/manuComponents'
import styles from './ManuResponse.module.css'

function webUrl(value: string) {
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) {
      return url.href
    }
  } catch {
    return ''
  }
  return ''
}

function MessageLink({ href, children }: ManuLinkProps) {
  const { t } = usePreferences()
  if (!href) return <>{children}</>
  const domain = new URL(href).hostname.replace(/^www\./, '')
  const isUrl = typeof children === 'string' && /^https?:\/\//i.test(children)
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer" title={href}>
      <span className={styles.linkText}>
        <span>{isUrl ? domain : children}</span>
        {!isUrl && <small>{domain}</small>}
      </span>
      <ExternalLink size={16} aria-label={t('Abrir em nova aba')} />
    </a>
  )
}

export function ManuResponse({ text }: ManuResponseProps) {
  const { t } = usePreferences()
  return (
    <div className={styles.content}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={webUrl}
        components={{
          h1: 'h3',
          h2: 'h3',
          h4: 'h4',
          h5: 'h4',
          h6: 'h4',
          a: ({ href, children }) => <MessageLink href={href}>{children}</MessageLink>,
          img: ({ src, alt }) => (
            <MessageLink href={typeof src === 'string' ? src : undefined}>{alt || src}</MessageLink>
          ),
          table: ({ children }) => (
            <div
              className={styles.table}
              role="region"
              aria-label={t('Dados da resposta')}
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
