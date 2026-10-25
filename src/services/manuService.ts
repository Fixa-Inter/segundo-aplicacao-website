import { ApiError, type createHttpClient } from './httpClient.ts'
import { getSummaryTitle, normalizeManuEmotion, type ManuEmotion } from '../utils/manu.ts'
export interface ManuMessage {
  id: string
  author: 'user' | 'manu'
  text: string
  images: string[]
  emotion?: ManuEmotion
  confirmation?: boolean
}
export interface ManuConversation {
  thread_id: string
  title: string
  updated_at: string
  closed: boolean
}
export interface ManuHistory extends ManuConversation {
  messages: ManuMessage[]
  confirmacao: 'sim' | 'nao'
  summary?: string | null
}
export interface ManuReply {
  thread_id: string
  resposta: string
  emocao: string
  intencao: string | null
  confirmacao: 'sim' | 'nao'
}
export function validateImageLinks(images: string[]): string[] {
  if (images.length > 3) throw new ApiError('Use até 3 imagens.')
  return images.map((value) => {
    let url: URL
    try {
      url = new URL(value.trim())
    } catch {
      throw new ApiError('Informe um link HTTP ou HTTPS válido para a imagem.')
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      value.length > 2048
    )
      throw new ApiError('Informe um link HTTP ou HTTPS válido para a imagem.')
    return url.href
  })
}
export function createManuService(client: ReturnType<typeof createHttpClient>, baseURL?: string) {
  let base: string | null = null
  try {
    const parsed = new URL(baseURL ?? '')
    if (
      ['http:', 'https:'].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    )
      base = parsed.href.replace(/\/$/, '')
  } catch {
    /* Configuração validada antes do envio de credenciais. */
  }
  const conversations = new Map<string, ManuHistory>()
  client.onTokens((tokens) => {
    if (!tokens) conversations.clear()
  })
  function endpoint(route = '') {
    if (!base) throw new ApiError('Configure VITE_AI_BASE_URL com o endereço do serviço da Manu.')
    return `${base}/api/v1/chat${route}`
  }
  function check(signal?: AbortSignal) {
    endpoint()
    signal?.throwIfAborted()
    if (!client.getTokens()) throw new ApiError('Entre novamente para continuar.', 401)
  }
  function remember(value: ManuHistory) {
    conversations.delete(value.thread_id)
    conversations.set(value.thread_id, value)
    if (conversations.size > 50) conversations.delete(conversations.keys().next().value!)
  }
  return {
    configured: Boolean(base),
    async list(signal?: AbortSignal): Promise<ManuConversation[]> {
      check(signal)
      return [...conversations.values()]
        .reverse()
        .map(({ thread_id, title, updated_at, closed }) => ({
          thread_id,
          title,
          updated_at,
          closed,
        }))
    },
    async history(threadId: string, signal?: AbortSignal): Promise<ManuHistory> {
      check(signal)
      const value = conversations.get(threadId)
      if (!value) throw new ApiError('Esta conversa não está disponível nesta sessão.', 404)
      return structuredClone(value)
    },
    async send(
      text: string,
      threadId: string | null,
      images: string[] = [],
      signal?: AbortSignal,
    ): Promise<ManuReply> {
      const message = text.trim()
      if (!message || message.length > 4000)
        throw new ApiError('A mensagem deve ter de 1 a 4000 caracteres.')
      if (threadId && conversations.get(threadId)?.closed)
        throw new ApiError('Esta conversa foi finalizada. Inicie uma nova conversa.', 409)
      const links = validateImageLinks(images)
      const data = await client.request<ManuReply>(endpoint(), {
        method: 'POST',
        expireSessionOnUnauthorized: false,
        timeout: 120000,
        signal,
        data: { mensagem: message, thread_id: threadId, imagens: links },
      })
      signal?.throwIfAborted()
      if (
        !data ||
        typeof data.thread_id !== 'string' ||
        !data.thread_id ||
        (threadId && data.thread_id !== threadId) ||
        typeof data.resposta !== 'string' ||
        !['sim', 'nao'].includes(data.confirmacao ?? 'nao')
      )
        throw new ApiError('O serviço da Manu retornou uma resposta inválida.')
      const result = {
        ...data,
        confirmacao: data.confirmacao ?? 'nao',
        emocao: normalizeManuEmotion(data.emocao),
      }
      const previous = conversations.get(data.thread_id)
      remember({
        thread_id: data.thread_id,
        title: previous?.title ?? message.slice(0, 80),
        updated_at: new Date().toISOString(),
        closed: false,
        confirmacao: result.confirmacao,
        messages: [
          ...(previous?.messages ?? []),
          { id: crypto.randomUUID(), author: 'user', text: message, images: links },
          {
            id: crypto.randomUUID(),
            author: 'manu',
            text: result.resposta,
            images: [],
            emotion: normalizeManuEmotion(result.emocao),
            confirmation: result.confirmacao === 'sim',
          },
        ],
      })
      return result
    },
    async close(threadId: string, signal?: AbortSignal) {
      const result = await client.request<{
        thread_id: string
        status: string
        mensagem: string
        resumo?: string | null
      }>(endpoint(`/sessions/${encodeURIComponent(threadId)}`), {
        method: 'DELETE',
        expireSessionOnUnauthorized: false,
        timeout: 120000,
        signal,
      })
      signal?.throwIfAborted()
      if (result.status !== 'ENCERRADA')
        throw new ApiError('Não foi possível confirmar a finalização da conversa.')
      const previous = conversations.get(threadId)
      if (previous)
        remember({
          ...previous,
          title: getSummaryTitle(result.resumo) ?? previous.title,
          summary: result.resumo,
          closed: true,
          confirmacao: 'nao',
        })
      return result
    },
  }
}
