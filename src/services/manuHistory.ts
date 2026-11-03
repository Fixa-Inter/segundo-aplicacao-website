import type { RemoteConversation } from '../types/api/manu'
import type { ManuHistory } from '../types/manu'
import { getConversationTitle, normalizeManuEmotion } from '../utils/manu.ts'
import { decodeVisualization } from '../utils/visualization.ts'
import { ApiError } from './httpClient.ts'

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
      url.hash ||
      value.trim().length > 255 ||
      url.href.length > 255 ||
      [...value.trim()].some(
        (character) =>
          character.charCodeAt(0) < 33 || character.charCodeAt(0) === 127 || character === '\\',
      )
    )
      throw new ApiError('Informe um link HTTP ou HTTPS válido para a imagem.')
    return url.href
  })
}

function historyImageLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((link) => {
      if (typeof link !== 'string') return []
      try {
        return validateImageLinks([link])
      } catch {
        return []
      }
    })
    .slice(0, 3)
}

export function isThreadId(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 100 && value.trim() === value
  )
}

export function decodeHistory(
  value: RemoteConversation,
  unitId: number | null = null,
): ManuHistory {
  if (
    !value ||
    !isThreadId(value.session_id) ||
    typeof value.titulo !== 'string' ||
    typeof value.resumo !== 'string' ||
    typeof value.atualizada_em !== 'string' ||
    Number.isNaN(Date.parse(value.atualizada_em)) ||
    !Array.isArray(value.mensagens) ||
    value.mensagens.some(
      (item) =>
        !item ||
        !['human', 'assistant'].includes(item.role) ||
        typeof item.mensagem !== 'string' ||
        (item.confirmacao !== undefined && !['sim', 'nao'].includes(item.confirmacao)),
    )
  )
    throw new ApiError('O serviço da Manu retornou um histórico inválido.')
  const summary = value.resumo.trim()
  const title = value.titulo.trim()
  const closed = Boolean(title || summary)
  const lastMessage = value.mensagens.at(-1)
  return {
    thread_id: value.session_id,
    title: getConversationTitle(
      title,
      summary,
      value.mensagens.find((item) => item.role === 'human')?.mensagem,
    ),
    updated_at: new Date(value.atualizada_em).toISOString(),
    closed,
    summary: summary || null,
    confirmacao:
      !closed && lastMessage?.role === 'assistant' && lastMessage.confirmacao === 'sim'
        ? 'sim'
        : 'nao',
    messages: value.mensagens.map((item, index) => ({
      id: value.session_id + ':' + index,
      author: item.role === 'human' ? 'user' : 'manu',
      text: item.mensagem,
      images: historyImageLinks(item.imagens),
      ...(item.role === 'assistant'
        ? {
            ...visualizationFields(item.visualizacao, unitId),
            emotion: normalizeManuEmotion(item.emocao),
            ...(item.confirmacao !== undefined
              ? { confirmation: !closed && item.confirmacao === 'sim' }
              : {}),
          }
        : {}),
    })),
  }
}
export function visualizationFields(raw: unknown, unitId: number | null) {
  if (raw == null) return {}
  const visualization = decodeVisualization(raw, unitId)
  return visualization ? { visualization } : { visualizationError: true }
}
