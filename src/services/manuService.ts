import { ApiError, type createHttpClient } from './httpClient.ts'

export interface ManuMessage {
  id: string
  author: 'user' | 'manu'
  text: string
  images: string[]
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
}
export interface ManuReply {
  thread_id: string
  resposta: string
  emocao: string
  intencao: string | null
  confirmacao: 'sim' | 'nao'
}

export function validateImageLinks(images: string[]): string[] {
  if (images.length > 3) throw new ApiError('Use até 3 links de imagem.')
  return images.map((value) => {
    const text = value.trim()
    let url: URL
    try {
      url = new URL(text)
    } catch {
      throw new ApiError('Informe um link HTTP ou HTTPS válido para a imagem.')
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      text.length > 2048
    )
      throw new ApiError('Informe um link HTTP ou HTTPS válido para a imagem.')
    return url.href
  })
}

export function createManuService(client: ReturnType<typeof createHttpClient>, baseURL?: string) {
  let base: string | null = null
  if (baseURL) {
    try {
      const parsed = new URL(baseURL)
      if (
        ['http:', 'https:'].includes(parsed.protocol) &&
        !parsed.username &&
        !parsed.password &&
        !parsed.search &&
        !parsed.hash
      )
        base = parsed.href.replace(/\/$/, '')
    } catch {
      /* A interface informa a configuração inválida antes de enviar credenciais. */
    }
  }
  function endpoint(route: string) {
    if (!base) throw new ApiError('Configure VITE_AI_BASE_URL com o endereço do serviço da Manu.')
    return `${base}/api/v1/chat${route}`
  }
  return {
    configured: Boolean(base),
    list(signal?: AbortSignal) {
      return client.request<ManuConversation[]>(endpoint('/sessions'), { signal })
    },
    history(threadId: string, signal?: AbortSignal) {
      return client.request<ManuHistory>(endpoint(`/sessions/${encodeURIComponent(threadId)}`), {
        signal,
      })
    },
    async send(text: string, threadId: string | null, images: string[] = [], signal?: AbortSignal) {
      const message = text.trim()
      if (!message || message.length > 4000)
        throw new ApiError('A mensagem deve ter de 1 a 4000 caracteres.')
      const data = await client.request<ManuReply>(endpoint(''), {
        method: 'POST',
        timeout: 120000,
        signal,
        data: { mensagem: message, thread_id: threadId, imagens: validateImageLinks(images) },
      })
      if (
        !data.thread_id ||
        typeof data.resposta !== 'string' ||
        !['sim', 'nao'].includes(data.confirmacao)
      )
        throw new ApiError('O serviço da Manu retornou uma resposta inválida.')
      return data
    },
    close(threadId: string, signal?: AbortSignal) {
      return client.request<{ thread_id: string; status: string; mensagem: string }>(
        endpoint(`/sessions/${encodeURIComponent(threadId)}`),
        { method: 'DELETE', timeout: 120000, signal },
      )
    },
  }
}
