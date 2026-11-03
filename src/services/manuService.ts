import type { RemoteClosedConversation, RemoteConversation } from '../types/api/manu'
import type { ManuConversation, ManuHistory, ManuReply } from '../types/manu'
import { getConversationTitle, normalizeManuEmotion } from '../utils/manu.ts'
import {
  decodeHistory,
  isThreadId,
  validateImageLinks,
  visualizationFields,
} from './manuHistory.ts'
import { ApiError, type createHttpClient } from './httpClient.ts'

export { validateImageLinks } from './manuHistory.ts'
export type { ManuConversation, ManuHistory, ManuMessage, ManuReply } from '../types/manu'

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
  async function visualizationUnit(
    hasVisualization: boolean,
    signal?: AbortSignal,
  ): Promise<number | null> {
    if (!hasVisualization) return null
    try {
      const profile = await client.request<{ unidadeId?: number }>('/api/v1/perfil', { signal })
      signal?.throwIfAborted()
      return typeof profile?.unidadeId === 'number' &&
        Number.isSafeInteger(profile.unidadeId) &&
        profile.unidadeId > 0
        ? profile.unidadeId
        : null
    } catch {
      signal?.throwIfAborted()
      return null
    }
  }
  let authVersion = 0
  // Uma resposta antiga não pode repor conversas depois que a sessão terminou.
  const assertSession = (expected: number) => {
    if (expected !== authVersion)
      throw new ApiError('A sessão foi encerrada. Entre novamente.', 401)
  }
  const conversations = new Map<string, ManuHistory>()
  const removedThreadIds = new Set<string>()
  client.onTokens((tokens) => {
    if (!tokens) {
      authVersion++
      conversations.clear()
      removedThreadIds.clear()
    }
  })
  function chatEndpoint(route = '') {
    if (!base) throw new ApiError('Configure VITE_AI_BASE_URL com o endereço do serviço da Manu.')
    return `${base}/api/v1/chat${route}`
  }
  function assertCanRequest(signal?: AbortSignal) {
    chatEndpoint()
    signal?.throwIfAborted()
    if (!client.getTokens()) throw new ApiError('Entre novamente para continuar.', 401)
  }
  function cacheConversation(value: ManuHistory) {
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

    if (local.messages.length > remote.messages.length || (local.closed && !remote.closed))
      return local
    const lastRemote = remote.messages.at(-1)
    const sameLast =
      local.messages.at(-1)?.text === lastRemote?.text &&
      local.messages.at(-1)?.author === lastRemote?.author
    return {
      ...remote,

      confirmacao:
        !remote.closed && sameLast && lastRemote?.confirmation === undefined
          ? local.confirmacao
          : remote.confirmacao,
      messages: remote.messages.map((item, index) => {
        const previous = local.messages[index]
        return previous?.author === item.author && previous.text === item.text
          ? {
              ...item,
              images: item.images.length ? item.images : [...previous.images],
              confirmation: remote.closed ? false : (item.confirmation ?? previous.confirmation),
            }
          : item
      }),
    }
  }
  return {
    configured: Boolean(base),
    cachedList,
    async list(signal?: AbortSignal): Promise<ManuConversation[]> {
      assertCanRequest(signal)
      const expectedAuth = authVersion
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
      const unitId = await visualizationUnit(
        result.conversas.some(
          (c) => Array.isArray(c.mensagens) && c.mensagens.some((m) => m?.visualizacao != null),
        ),
        signal,
      )
      assertSession(expectedAuth)
      const loaded = result.conversas
        .map((value) => decodeHistory(value, unitId))
        .filter((item) => !removedThreadIds.has(item.thread_id))
        .map(mergeHistory)
      const all = new Map(loaded.map((item) => [item.thread_id, item]))
      for (const item of conversations.values()) {
        if (!all.has(item.thread_id)) {
          if (!item.closed) all.set(item.thread_id, item)
          else conversations.delete(item.thread_id)
        }
      }

      for (const item of [...all.values()].sort((a, b) => a.updated_at.localeCompare(b.updated_at)))
        cacheConversation(item)
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
      assertCanRequest(signal)
      if (!isThreadId(threadId)) throw new ApiError('Conversa inválida.')
      if (removedThreadIds.has(threadId))
        throw new ApiError('Esta conversa foi removida do histórico.', 404)
      const expectedAuth = authVersion
      const cached = conversations.get(threadId)
      if (cached) return structuredClone(cached)
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
      const unitId = await visualizationUnit(
        result.conversa?.mensagens?.some((m) => m.visualizacao != null) ?? false,
        signal,
      )
      assertSession(expectedAuth)
      const value = decodeHistory(result.conversa, unitId)
      if (value.thread_id !== threadId)
        throw new ApiError('O serviço da Manu retornou um histórico inválido.')
      cacheConversation(value)
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
      if (threadId !== null && !isThreadId(threadId)) throw new ApiError('Conversa inválida.')
      if (threadId && removedThreadIds.has(threadId))
        throw new ApiError('Esta conversa foi removida do histórico.', 404)
      if (threadId && conversations.get(threadId)?.closed)
        throw new ApiError('Esta conversa foi finalizada. Inicie uma nova conversa.', 409)
      const links = validateImageLinks(images)
      const expectedAuth = authVersion
      const data = await client.request<ManuReply & { visualizacao?: unknown }>(chatEndpoint(), {
        method: 'POST',
        expireSessionOnUnauthorized: false,
        timeout: 120000,
        signal,
        data: { mensagem: message, plataforma: 'web', thread_id: threadId, imagens: links },
      })
      signal?.throwIfAborted()
      if (
        !data ||
        !isThreadId(data.thread_id) ||
        (threadId && data.thread_id !== threadId) ||
        typeof data.resposta !== 'string' ||
        !data.resposta.trim() ||
        !['sim', 'nao'].includes(data.confirmacao ?? 'nao')
      )
        throw new ApiError('O serviço da Manu retornou uma resposta inválida.')
      const unitId = await visualizationUnit(data.visualizacao != null, signal)
      assertSession(expectedAuth)
      const result = {
        thread_id: data.thread_id,
        resposta: data.resposta,
        intencao: data.intencao,
        ...visualizationFields(data.visualizacao, unitId),
        confirmacao: data.confirmacao ?? 'nao',
        emocao: normalizeManuEmotion(data.emocao),
      }
      const previous = conversations.get(data.thread_id)
      cacheConversation({
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
            ...(result.visualization ? { visualization: result.visualization } : {}),
            ...(result.visualizationError ? { visualizationError: true } : {}),
          },
        ],
      })
      return result
    },
    async close(threadId: string, signal?: AbortSignal) {
      assertCanRequest(signal)
      if (!isThreadId(threadId)) throw new ApiError('Conversa inválida.')
      const result = await client.request<RemoteClosedConversation>(
        chatEndpoint(`/sessions/${encodeURIComponent(threadId)}`),
        {
          method: 'DELETE',
          expireSessionOnUnauthorized: false,
          timeout: 120000,
          signal,
        },
      )
      signal?.throwIfAborted()
      if (
        !result ||
        result.thread_id !== threadId ||
        result.status !== 'ENCERRADA' ||
        (result.titulo != null && typeof result.titulo !== 'string') ||
        (result.resumo != null && typeof result.resumo !== 'string')
      )
        throw new ApiError('Não foi possível confirmar a finalização da conversa.')
      const previous = conversations.get(threadId)
      if (previous)
        cacheConversation({
          ...previous,
          title: getConversationTitle(result.titulo, result.resumo, previous.title),
          summary: result.resumo,
          closed: true,
          confirmacao: 'nao',
        })
      return result
    },
    async remove(threadId: string, signal?: AbortSignal) {
      assertCanRequest(signal)
      if (!isThreadId(threadId)) throw new ApiError('Conversa inválida.')
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
