import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { cloudinaryUploader as uploader } from '../services/cloudinaryApi'
import { validateImageFile } from '../services/cloudinaryService'
import { ApiError } from '../services/httpClient'
import { errorMessage } from '../services/manuErrors'
import type { ManuAttachment as Attachment } from '../types/manu'

export function useManuAttachments(userId: string | undefined, onError: (message: string) => void) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const uploads = useRef(new Map<string, { controller: AbortController; preview: string }>())
  const uploading = attachments.some((item) => item.status === 'uploading')
  useEffect(() => {
    const activeUploads = uploads.current
    return () => {
      activeUploads.forEach((item) => {
        item.controller.abort()
        URL.revokeObjectURL(item.preview)
      })
      activeUploads.clear()
    }
  }, [userId])
  function clearAttachments() {
    uploads.current.forEach((item) => {
      item.controller.abort()
      URL.revokeObjectURL(item.preview)
    })
    uploads.current.clear()
    setAttachments([])
  }
  async function uploadAttachment(item: Attachment) {
    const controller = new AbortController()
    uploads.current.set(item.id, { controller, preview: item.preview })
    setAttachments((values) =>
      values.map((value) =>
        value.id === item.id ? { ...value, status: 'uploading', error: undefined } : value,
      ),
    )
    try {
      const url = await uploader.upload(item.file, controller.signal)
      if (!controller.signal.aborted)
        setAttachments((values) =>
          values.map((value) =>
            value.id === item.id ? { ...value, status: 'ready', url } : value,
          ),
        )
    } catch (reason) {
      if (!controller.signal.aborted)
        setAttachments((values) =>
          values.map((value) =>
            value.id === item.id
              ? { ...value, status: 'error', error: errorMessage(reason) }
              : value,
          ),
        )
    }
  }
  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    try {
      if (attachments.length + files.length > 3) throw new ApiError('Use até 3 imagens.')
      files.forEach(validateImageFile)
      if (!uploader.configured)
        throw new ApiError('O envio de imagens está indisponível no momento.')
      const added = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading' as const,
      }))
      setAttachments((values) => [...values, ...added])
      onError('')
      added.forEach((item) => void uploadAttachment(item))
    } catch (reason) {
      onError(errorMessage(reason))
    }
  }
  function removeAttachment(id: string) {
    const item = uploads.current.get(id)
    if (item) {
      item.controller.abort()
      URL.revokeObjectURL(item.preview)
      uploads.current.delete(id)
    }
    setAttachments((values) => values.filter((value) => value.id !== id))
  }
  return {
    attachments,
    uploading,
    clearAttachments,
    uploadAttachment,
    selectFiles,
    removeAttachment,
  }
}
