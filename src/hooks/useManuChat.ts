import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import { usePreferences } from '../contexts/usePreferences'
import { cloudinaryUploader as uploader } from '../services/cloudinaryApi'
import { ApiError } from '../services/httpClient'
import { manuApi } from '../services/manuApi'
import { errorMessage, historyErrorMessage } from '../services/manuErrors'
import type { ManuConversation, ManuHistory, ManuMessage } from '../types/manu'
import { normalizeManuEmotion } from '../utils/manu'
import { useManuAttachments } from './useManuAttachments'

export function useManuChat() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ManuConversation[]>([])
  const [current, setCurrent] = useState<ManuHistory | null>(null)
  const [messages, setMessages] = useState<ManuMessage[]>([])
  const [question, setQuestion] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [closing, setClosing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [deleting, setDeleting] = useState<ManuConversation | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [error, setError] = useState('')
  const {
    attachments,
    uploading,
    clearAttachments,
    uploadAttachment,
    selectFiles,
    removeAttachment,
  } = useManuAttachments(user?.id, setError)
  const [historyError, setHistoryError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(manuApi.configured)
  const [correcting, setCorrecting] = useState(false)
  const [correction, setCorrection] = useState('')
  const request = useRef<AbortController | null>(null)
  const historyRequest = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const busyRef = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const newChatButton = useRef<HTMLButtonElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const busy = sending || loadingConversation || closing || removing || uploading
  const pendingConfirmation = current?.confirmacao === 'sim' && !current.closed
  const lastReply = messages.findLast((item) => item.author === 'manu')

  const loadConversations = useCallback((controller: AbortController) => {
    return manuApi
      .list(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setConversations(data)
        setHistoryError('')
      })
      .catch((reason) => {
        if (controller.signal.aborted) return
        setConversations(manuApi.cachedList())
        setHistoryError(historyErrorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false)
      })
  }, [])
  const refreshConversations = useCallback(
    (background = false) => {
      historyRequest.current?.abort()
      const controller = new AbortController()
      historyRequest.current = controller
      if (background) setConversations(manuApi.cachedList())
      setHistoryLoading(!background)
      return loadConversations(controller)
    },
    [loadConversations],
  )

  useEffect(() => {
    if (!manuApi.configured) return
    const controller = new AbortController()
    historyRequest.current = controller
    void loadConversations(controller)
    return () => {
      historyRequest.current?.abort()
      request.current?.abort()
    }
  }, [user?.id, loadConversations])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, sending, correcting])
  function resetChat() {
    generation.current++
    setCurrent(null)
    setMessages([])
    setQuestion('')
    setError('')
    setCorrecting(false)
    setCorrection('')
    clearAttachments()
  }
  async function selectConversation(id: string) {
    if (busyRef.current || uploading) return
    const expected = ++generation.current
    const controller = new AbortController()
    request.current = controller
    busyRef.current = true
    setLoadingConversation(true)
    setError('')
    try {
      const data = await manuApi.history(id, controller.signal)
      if (controller.signal.aborted || expected !== generation.current) return
      setCurrent(data)
      setMessages(data.messages)
      setQuestion('')
      setError('')
      setCorrecting(false)
      setCorrection('')
      clearAttachments()
    } catch (reason) {
      if (!controller.signal.aborted && expected === generation.current)
        setError(errorMessage(reason))
    } finally {
      if (expected === generation.current) {
        busyRef.current = false
        setLoadingConversation(false)
      }
    }
  }
  async function send(
    text = question,
    mode: 'message' | 'confirmation' | 'correction' = 'message',
  ) {
    if (busyRef.current || uploading || current?.closed || !text.trim() || !manuApi.configured)
      return
    if (
      mode === 'message' &&
      (pendingConfirmation || attachments.some((item) => item.status !== 'ready'))
    )
      return
    busyRef.current = true
    setSending(true)
    setError('')
    const expected = generation.current
    const controller = new AbortController()
    request.current = controller
    const pending: ManuMessage = {
      id: crypto.randomUUID(),
      author: 'user',
      text: text.trim(),
      images: mode === 'message' ? attachments.flatMap((item) => (item.url ? [item.url] : [])) : [],
    }
    setMessages((values) => [...values, pending])
    const originalQuestion = question
    if (mode === 'message') setQuestion('')
    try {
      const data = await manuApi.send(
        pending.text,
        current?.thread_id ?? null,
        pending.images,
        controller.signal,
      )
      if (controller.signal.aborted || expected !== generation.current) return
      const reply: ManuMessage = {
        id: crypto.randomUUID(),
        author: 'manu',
        text: data.resposta,
        images: [],
        emotion: normalizeManuEmotion(data.emocao),
        confirmation: data.confirmacao === 'sim',
        visualization: data.visualization,
        visualizationError: data.visualizationError,
      }
      setMessages((values) => [...values, reply])
      setCurrent({
        thread_id: data.thread_id,
        title: current?.title ?? pending.text.slice(0, 80),
        updated_at: new Date().toISOString(),
        closed: false,
        confirmacao: data.confirmacao,
        messages: [],
      })
      setCorrecting(false)
      setCorrection('')
      if (mode === 'message') clearAttachments()
      void refreshConversations(true)
    } catch (reason) {
      if (controller.signal.aborted || expected !== generation.current) return
      setMessages((values) => values.filter((value) => value.id !== pending.id))
      if (mode === 'message') setQuestion(originalQuestion)
      setError(
        `${t(errorMessage(reason))} ${t('Não reenviamos automaticamente: o servidor pode ter recebido a mensagem.')}`,
      )
    } finally {
      if (expected === generation.current) {
        busyRef.current = false
        setSending(false)
      }
    }
  }
  async function newChat() {
    if (busyRef.current || uploading) return
    if (!current || current.closed) {
      resetChat()
      return
    }
    busyRef.current = true
    setClosing(true)
    setError('')
    const controller = new AbortController()
    request.current = controller
    const expected = generation.current
    try {
      await manuApi.close(current.thread_id, controller.signal)
      if (controller.signal.aborted || expected !== generation.current) return
      resetChat()
      await refreshConversations()
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof ApiError && (reason.status === 0 || reason.status >= 500)
            ? 'Não foi possível confirmar o encerramento da conversa. Suas mensagens continuam disponíveis.'
            : errorMessage(reason),
        )
    } finally {
      busyRef.current = false
      setClosing(false)
    }
  }
  async function deleteConversation() {
    if (!deleting || busyRef.current || uploading) return
    const targetId = deleting.thread_id
    const expected = generation.current
    const controller = new AbortController()
    request.current = controller
    busyRef.current = true
    setRemoving(true)
    setDeleteError('')
    try {
      await manuApi.remove(targetId, controller.signal)
      if (controller.signal.aborted || expected !== generation.current) return
      setConversations((values) => values.filter((item) => item.thread_id !== targetId))
      if (current?.thread_id === targetId) resetChat()
      setDeleting(null)
      await refreshConversations()
      requestAnimationFrame(() => newChatButton.current?.focus())
    } catch (reason) {
      if (!controller.signal.aborted)
        setDeleteError(
          reason instanceof ApiError && (reason.status === 0 || reason.status >= 500)
            ? 'Não foi possível excluir a conversa. Tente novamente.'
            : errorMessage(reason),
        )
    } finally {
      busyRef.current = false
      setRemoving(false)
    }
  }
  const filtered = conversations.filter((item) =>
    item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )

  return {
    configured: manuApi.configured,
    uploadConfigured: uploader.configured,
    t,
    user,
    current,
    messages,
    question,
    setQuestion,
    search,
    setSearch,
    attachments,
    sending,
    loadingConversation,
    closing,
    removing,
    deleting,
    setDeleting,
    deleteError,
    setDeleteError,
    error,
    setError,
    historyError,
    historyLoading,
    correcting,
    setCorrecting,
    correction,
    setCorrection,
    busyRef,
    fileInput,
    newChatButton,
    end,
    uploading,
    busy,
    pendingConfirmation,
    lastReply,
    refreshConversations,
    selectConversation,
    uploadAttachment,
    selectFiles,
    removeAttachment,
    send,
    newChat,
    deleteConversation,
    filtered,
  }
}

export type ManuChatController = ReturnType<typeof useManuChat>
