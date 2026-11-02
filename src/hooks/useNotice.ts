import { useCallback, useState } from 'react'
import type { NoticeMessage } from '../types/ui'

export function useNotice() {
  const [notice, updateNotice] = useState<NoticeMessage | null>(null)
  // Um novo objeto reinicia o prazo do aviso mesmo quando o texto se repete.
  const setNotice = useCallback((message: string) => {
    updateNotice(message ? { message } : null)
  }, [])
  const closeNotice = useCallback(() => updateNotice(null), [])
  return { notice, setNotice, closeNotice }
}
