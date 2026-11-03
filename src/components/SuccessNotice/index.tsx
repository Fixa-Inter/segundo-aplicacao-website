import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import type { SuccessNoticeProps } from '../../types/ui'
import styles from './SuccessNotice.module.css'

export function SuccessNotice({ notice, onClose }: SuccessNoticeProps) {
  const { t } = usePreferences()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (hovered || focused) return
    const timeout = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(timeout)
  }, [notice, onClose, hovered, focused])

  return (
    <div
      className={styles.notice}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <p role="status" aria-atomic="true">
        {t(notice.message)}
      </p>
      <button type="button" onClick={onClose} aria-label={t('Fechar aviso')}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
