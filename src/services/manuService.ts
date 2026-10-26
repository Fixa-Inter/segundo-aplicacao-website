import { ApiError, type createHttpClient } from './httpClient.ts'
import {
  getSummaryTitle,
  getConversationTitle,
  normalizeManuEmotion,
  type ManuEmotion,
} from '../utils/manu.ts'
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
interface RemoteConversation {
  session_id: string
  iniciada_em: string
  atualizada_em: string
  titulo: string
  resumo: string
  mensagens: { role: 'human' | 'assistant'; mensagem: string; emocao?: string | null }[]
}
function decodeHistory(value: RemoteConversation): ManuHistory {
  if (
    !value ||
    typeof value.session_id !== 'string' ||
    !value.session_id ||
    value.session_id.length > 100 ||
    typeof value.titulo !== 'string' ||
    typeof value.resumo !== 'string' ||
    typeof value.atualizada_em !== 'string' ||
    Number.isNaN(Date.parse(value.atualizada_em)) ||
    !Array.isArray(value.mensagens) ||
    value.mensagens.some(
      (item) =>
        !item || !['human', 'assistant'].includes(item.role) || typeof item.mensagem !== 'string',
    )
  )
    throw new ApiError('O serviço da Manu retornou um histórico inválido.')
  const summary = value.resumo.trim()
  // O histórico separa a primeira linha do resumo em titulo; o restante pode estar vazio.
  const title = value.titulo.trim()
  return {
    thread_id: value.session_id,
    title: getConversationTitle(
      title,
      summary,
      value.mensagens.find((item) => item.role === 'human')?.mensagem,
    ),
    updated_at: new Date(value.atualizada_em).toISOString(),
    closed: Boolean(title || summary),
    summary: summary || null,
    confirmacao: 'nao',
    messages: value.mensagens.map((item, index) => ({
      id: value.session_id + ':' + index,
      author: item.role === 'human' ? 'user' : 'manu',
      text: item.mensagem,
      images: [],
      ...(item.role === 'assistant' ? { emotion: normalizeManuEmotion(item.emocao) } : {}),
    })),
  }
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
  const removedThreadIds = new Set<string>()
  client.onTokens((tokens) => {
    if (!tokens) {
      conversations.clear()
      removedThreadIds.clear()
    }
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
    if (removedThreadIds.has(value.thread_id)) return
    conversations.delete(value.thread_id)
    conversations.set(value.thread_id, value)
    if (conversations.size > 50) conversations.delete(conversations.keys().next().value!)
  }
  const cachedList = () =>
    [...conversations.values()]
      .map(({ thread_id, title, updated_at, closed }) => ({ thread_id, title, updated_at, closed }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  function mergeHistory(remote: ManuHistory): ManuHistory {
    const local = conversations.get(remote.thread_id)
    if (!local) return remote
    // A leitura pode chegar antes da persistência da última resposta. Preserva anexos e confirmações que ainda existem na sessão.
    if (local.messages.length > remote.messages.length || (local.closed && !remote.closed))
      return local
    const sameLast = local.messages.at(-1)?.text === remote.messages.at(-1)?.text
    return {
      ...remote,
      confirmacao: !remote.closed && sameLast ? local.confirmacao : 'nao',
      messages: remote.messages.map((item, index) => {
        const previous = local.messages[index]
        return previous?.author === item.author && previous.text === item.text
          ? {
              ...item,
              images: [...previous.images],
              confirmation: remote.closed ? false : previous.confirmation,
            }
          : item
      }),
    }
  }
  return {
    configured: Boolean(base),
    cachedList,
    async list(signal?: AbortSignal): Promise<ManuConversation[]> {
      check(signal)
      const result = await client.request<{
        status: 'SUCESSO' | 'SEM_DADOS'
        conversas: RemoteConversation[]
      }>(base + '/api/v1/sessoes', { expireSessionOnUnauthorized: false, signal })
      signal?.throwIfAborted()
      if (
        !result ||
        !['SUCESSO', 'SEM_DADOS'].includes(result.status) ||
        !Array.isArray(result.conversas)
      )
        throw new ApiError('O serviço da Manu retornou um histórico inválido.')
      const loaded = result.conversas
        .map(decodeHistory)
        .filter((item) => !removedThreadIds.has(item.thread_id))
        .map(mergeHistory)
      const all = new Map(loaded.map((item) => [item.thread_id, item]))
      for (const item of conversations.values()) {
        if (!all.has(item.thread_id)) {
          if (!item.closed) all.set(item.thread_id, item)
          else conversations.delete(item.thread_id)
        }
      }
      for (const item of loaded) remember(item)
      return [...all.values()]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map(({ thread_id, title, updated_at, closed }) => ({
          thread_id,
          title,
          updated_at,
          closed,
        }))
    },
    async history(threadId: string, signal?: AbortSignal): Promise<ManuHistory> {
      check(signal)
      if (removedThreadIds.has(threadId))
        throw new ApiError('Esta conversa foi removida do histórico.', 404)
      const cached = conversations.get(threadId)
      if (cached) return structuredClone(cached)
      if (!threadId || threadId.length > 100) throw new ApiError('Conversa inválida.')
      const result = await client.request<{ status: 'SUCESSO'; conversa: RemoteConversation }>(
        base + '/api/v1/sessoes/conversa',
        {
          method: 'POST',
          expireSessionOnUnauthorized: false,
          signal,
          data: { session_id: threadId },
        },
      )
      signal?.throwIfAborted()
      if (!result || result.status !== 'SUCESSO')
        throw new ApiError('O serviço da Manu retornou um histórico inválido.')
      if (removedThreadIds.has(threadId))
        throw new ApiError('Esta conversa foi removida do histórico.', 404)
      const value = decodeHistory(result.conversa)
      if (value.thread_id !== threadId)
        throw new ApiError('O serviço da Manu retornou um histórico inválido.')
      remember(value)
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
      if (threadId && removedThreadIds.has(threadId))
        throw new ApiError('Esta conversa foi removida do histórico.', 404)
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
      check(signal)
      if (!threadId || threadId.length > 100) throw new ApiError('Conversa inválida.')
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
      if (!result || result.thread_id !== threadId || result.status !== 'ENCERRADA')
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
    async remove(threadId: string, signal?: AbortSignal) {
      check(signal)
      if (!threadId || threadId.length > 100) throw new ApiError('Conversa inválida.')
      const result = await client.request<{ session_id: string; status: string; mensagem: string }>(
        base + '/api/v1/sessoes/conversa/' + encodeURIComponent(threadId),
        { method: 'DELETE', expireSessionOnUnauthorized: false, timeout: 120000, signal },
      )
      signal?.throwIfAborted()
      if (!result || result.session_id !== threadId || result.status !== 'EXCLUIDA')
        throw new ApiError('Não foi possível confirmar a exclusão da conversa.')
      removedThreadIds.add(threadId)
      conversations.delete(threadId)
      return result
    },
  }
}
