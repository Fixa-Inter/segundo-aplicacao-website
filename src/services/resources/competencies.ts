import type { ManagementClient } from '../../types/api/shared'
import type { ApiGrade } from '../../types/api/competencies'
import type { CompetencyInput, TechnicianCompetency } from '../../types/competency'
import { categoryId, categoryNames, grades } from '../../utils/apiCompetencies.ts'
import { validateCompetency } from '../../utils/competencies.ts'
export function createCompetencyService(client: ManagementClient) {
  const request = client.request
  const rawGrades = (id: string, signal?: AbortSignal): Promise<ApiGrade[]> =>
    request<ApiGrade[]>('/api/v1/aptidoes', { params: { usuarioId: id }, signal })
  async function listTechnicianCompetencies(
    id: string,
    signal?: AbortSignal,
  ): Promise<TechnicianCompetency[]> {
    return grades(await rawGrades(id, signal))
  }
  async function writeGrade(
    id: string,
    input: CompetencyInput,
    previous: ApiGrade[],
    signal?: AbortSignal,
  ): Promise<void> {
    const error = validateCompetency(input)
    if (error) throw new Error(error)
    const existing = previous.find(
      (item) => categoryId(item.categoriaProblema) === input.competencyId,
    )
    if (input.rating === null) {
      if (existing?.estaAtivo)
        await request(`/api/v1/aptidoes/${existing.id}/desativar`, { method: 'PATCH', signal })
    } else if (!existing) {
      await request('/api/v1/aptidoes', {
        method: 'POST',
        signal,
        data: {
          usuarioId: Number(id),
          categoriaProblema: categoryNames[input.competencyId - 1],
          nota: input.rating,
        },
      })
    } else if (!existing.estaAtivo || existing.nota !== input.rating) {
      await request(`/api/v1/aptidoes/${existing.id}`, {
        method: 'PATCH',
        signal,
        data: { nota: input.rating, estaAtivo: true },
      })
    }
  }
  async function saveTechnicianCompetency(
    id: string,
    input: CompetencyInput,
    signal?: AbortSignal,
  ): Promise<TechnicianCompetency> {
    await writeGrade(id, input, await rawGrades(id, signal), signal)
    const result = (await listTechnicianCompetencies(id, signal)).find(
      (item) => item.id === input.competencyId,
    )
    if (!result) throw new Error('Competência inválida.')
    return result
  }
  return { rawGrades, writeGrade, listTechnicianCompetencies, saveTechnicianCompetency }
}
