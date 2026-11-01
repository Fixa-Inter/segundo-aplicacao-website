import type { ApiGrade } from '../types/api/competencies'
import type { EnumValue } from '../types/api/shared'
import type { TechnicianCompetency } from '../types/competency'
import { competencyCategories } from './competencies.ts'

export const categoryNames = [
  'ELETRICA',
  'HIDRAULICA',
  'MECANICA',
  'INFORMATICA',
  'MOBILIARIO',
  'CLIMATIZACAO',
  'REDE_CONECTIVIDADE',
  'SEGURANCA',
  'ILUMINACAO',
  'LIMPEZA_CONSERVACAO',
]

export const categoryId = (value: EnumValue) =>
  typeof value === 'object' ? value.id : categoryNames.indexOf(value) + 1

export function grades(items: ApiGrade[]): TechnicianCompetency[] {
  return competencyCategories.map((category) => ({
    ...category,
    rating:
      items.find((item) => categoryId(item.categoriaProblema) === category.id && item.estaAtivo)
        ?.nota ?? null,
  }))
}
