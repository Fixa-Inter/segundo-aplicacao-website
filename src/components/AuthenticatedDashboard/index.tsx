import { DatabricksDashboard } from '@databricks/aibi-client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/useAuth'
import { usePreferences } from '../../contexts/usePreferences'
import { useDashboardAccess } from '../../hooks/useDashboardAccess'
import { LoadingState } from '../LoadingState'
import styles from './AuthenticatedDashboard.module.css'

export function AuthenticatedDashboard({
  title,
  widget,
  technician,
}: {
  title: string
  widget?: string
  technician?: string
}) {
  const { user } = useAuth()
  const getAccess = useDashboardAccess()
  const { t, theme } = usePreferences()
  const container = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const element = container.current
    if (!element || !user) return
    const target: HTMLDivElement = element
    const controller = new AbortController()
    let dashboard: DatabricksDashboard | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let frame: HTMLIFrameElement | null = null
    let instanceOrigin = ''
    const ready = (event: MessageEvent) => {
      if (
        !controller.signal.aborted &&
        event.source === frame?.contentWindow &&
        event.origin === instanceOrigin &&
        event.data?.type === 'DATABRICKS_EMBED_READY'
      ) {
        clearTimeout(timer)
        setStatus('ready')
      }
    }
    window.addEventListener('message', ready)
    const destroy = () => {
      const current = dashboard
      dashboard = undefined
      current?.destroy()
    }
    const fail = () => {
      if (controller.signal.aborted) return
      clearTimeout(timer)
      destroy()
      target.replaceChildren()
      setStatus('error')
    }
    async function load() {
      try {
        const access = await getAccess(controller.signal)
        if (controller.signal.aborted) return
        instanceOrigin = access.instanceUrl
        dashboard = new DatabricksDashboard({
          ...access,
          container: target,
          colorScheme: theme,
          config: { version: 1, globalFilterVisibility: 'disabled', hideDatabricksLogo: true },
          getNewToken: async () => {
            try {
              const fresh = await getAccess(controller.signal)
              if (
                fresh.instanceUrl !== access.instanceUrl ||
                fresh.dashboardId !== access.dashboardId ||
                fresh.workspaceId !== access.workspaceId
              )
                throw new Error('Dashboard alterado.')
              return fresh.token
            } catch (reason) {
              fail()
              throw reason
            }
          },
        })
        dashboard.onFiltersReady(() => {
          if (!controller.signal.aborted) {
            clearTimeout(timer)
            setStatus('ready')
          }
        })
        dashboard.initialize()
        frame = target.querySelector('iframe')
        if (!frame) throw new Error('Dashboard indisponível.')
        if (new URL(frame.src).origin !== access.instanceUrl)
          throw new Error('Dashboard indisponível.')
        frame.title = title
        frame.referrerPolicy = 'strict-origin-when-cross-origin'

        if (widget && /^[A-Za-z0-9_-]+~[A-Za-z0-9_-]+$/.test(widget)) {
          const url = new URL(frame.src)
          url.searchParams.set('fullscreenWidget', widget)
          if (technician) {
            const filter = import.meta.env.VITE_DATABRICKS_TECHNICIAN_FILTER
            if (!filter || !/^f_[A-Za-z0-9_-]+~[A-Za-z0-9_-]+\.s$/.test(filter))
              throw new Error('Filtro indisponível.')
            url.pathname = url.pathname.replace(/\/$/, '') + '/pages/' + widget.split('~')[0]
            url.searchParams.set(filter, encodeURIComponent(technician))
          }
          frame.src = url.href
        } else if (technician) throw new Error('Gráfico indisponível.')
        timer = setTimeout(fail, 45000)
      } catch {
        fail()
      }
    }
    void load()
    return () => {
      controller.abort()
      clearTimeout(timer)
      window.removeEventListener('message', ready)
      destroy()
      target.replaceChildren()
    }
  }, [user, theme, widget, technician, title, attempt, getAccess])
  return (
    <div className={styles.root} data-dashboard-state={status}>
      {status === 'loading' && (
        <div className={styles.loading}>
          <LoadingState label="Carregando dashboard…" />
        </div>
      )}
      {status === 'error' && (
        <div className={styles.error} role="alert">
          <p>{t('Não foi possível carregar o dashboard da sua unidade.')}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading')
              setAttempt((n) => n + 1)
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      )}
      <div
        key={user?.id}
        ref={container}
        className={styles.container}
        aria-label={title}
        hidden={status === 'error'}
      />
    </div>
  )
}
