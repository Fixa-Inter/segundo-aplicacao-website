import { useCallback, useState } from 'react'

export function useNotice() {
  const [notice, updateNotice] = useState<{ message: string } | null>(null)
  const setNotice = useCallback((message: string) => {
    updateNotice(message ? { message } : null)
  }, [])
  const closeNotice = useCallback(() => updateNotice(null), [])
  return { notice, setNotice, closeNotice }
}
