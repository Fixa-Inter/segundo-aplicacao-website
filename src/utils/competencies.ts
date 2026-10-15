import type {
  CompetencyDefinition,
  CompetencyInput,
  CompetencyPresentation,
  TechnicianCompetency,
} from '../types/competency'

export const competencyCategories: readonly CompetencyDefinition[] = [
  { id: 1, code: 'ELETRICA', name: 'Elétrica' },
  { id: 2, code: 'HIDRAULICA', name: 'Hidráulica' },
  { id: 3, code: 'MECANICA', name: 'Mecânica' },
  { id: 4, code: 'INFORMATICA', name: 'Informática' },
  { id: 5, code: 'MOBILIARIO', name: 'Mobiliário' },
  { id: 6, code: 'CLIMATIZACAO', name: 'Climatização' },
  { id: 7, code: 'REDE_CONECTIVIDADE', name: 'Rede e Conectividade' },
  { id: 8, code: 'SEGURANCA', name: 'Segurança' },
  { id: 9, code: 'ILUMINACAO', name: 'Iluminação' },
  { id: 10, code: 'LIMPEZA_CONSERVACAO', name: 'Limpeza e Conservação' },
]

export function getCompetencyPresentation(
  items: readonly TechnicianCompetency[],
): CompetencyPresentation {
  const ranked = [...items].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.id - b.id)
  const assessed = ranked.filter((item) => item.rating !== null)
  const highlights = assessed.slice(0, 3)
  const highlightedIds = new Set(highlights.map((item) => item.id))
  return {
    highlights,
    remaining: ranked.filter((item) => !highlightedIds.has(item.id)),
    assessed: assessed.length,
  }
}

export function parseCompetencyRating(value: string): number | null | undefined {
  if (!value.trim()) return null
  if (!/^\d{1,2}$/.test(value.trim())) return undefined
  const rating = Number(value)
  return Number.isInteger(rating) && rating >= 0 && rating <= 10 ? rating : undefined
}

export function validateCompetency(input: CompetencyInput): string | null {
  if (!competencyCategories.some((item) => item.id === input.competencyId))
    return 'Competência inválida.'
  if (
    input.rating !== null &&
    (!Number.isInteger(input.rating) || input.rating < 0 || input.rating > 10)
  )
    return 'Informe uma nota inteira de 0 a 10.'
  return null
}
