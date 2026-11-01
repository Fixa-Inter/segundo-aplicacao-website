export const manuEmotions = [
  'NEUTRO',
  'CURIOSO',
  'PENSATIVO',
  'CONFIRMACAO',
  'SUCESSO',
  'EMPATICO',
  'ALERTA',
  'ERRO',
  'BLOQUEADO',
  'CONSELHEIRO',
  'AGUARDANDO',
  'CELEBRACAO',
] as const
export type ManuEmotion = (typeof manuEmotions)[number]

export function normalizeManuEmotion(value: unknown): ManuEmotion {
  const normalized =
    typeof value === 'string'
      ? value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .toUpperCase()
      : ''
  return manuEmotions.includes(normalized as ManuEmotion) ? (normalized as ManuEmotion) : 'NEUTRO'
}

export function resolveManuBaseURL(value: string | undefined, origin: string): string | undefined {
  const base = value?.trim() || '/api/ia'
  if (base === '/api/ia') return new URL(base, origin).href
  if (base.startsWith('/')) return undefined
  return base
}

export function getSummaryTitle(summary: unknown): string | null {
  if (!summary || typeof summary !== 'string') return null
  try {
    const parsed: unknown = JSON.parse(summary)
    if (
      parsed &&
      typeof parsed === 'object' &&
      'titulo' in parsed &&
      typeof parsed.titulo === 'string'
    )
      return parsed.titulo.trim().slice(0, 100) || null
  } catch {
    /* Resumos em texto continuam disponíveis sem inventar um título. */
  }
  const match = summary.match(/^(?:#{1,3}\s+|T[ií]tulo:\s*)([^\n]+)/im)
  return match?.[1].trim().slice(0, 100) || null
}

export function getConversationTitle(title: unknown, summary: unknown, firstMessage = ''): string {
  const structuredTitle = getSummaryTitle(title)
  if (structuredTitle) return structuredTitle
  const candidate = typeof title === 'string' ? title.trim() : ''

  if (
    candidate &&
    candidate.length <= 100 &&
    !/[\r\n]/.test(candidate) &&
    candidate.split(/\s+/).length <= 12
  )
    return candidate
  return getSummaryTitle(summary) ?? (firstMessage.trim().slice(0, 80) || 'Conversa sem título')
}
