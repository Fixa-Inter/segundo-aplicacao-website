import type { ManagementSession } from '../types/api/shared'
import type {
  Technician,
  TechnicianInput,
  TeamMember,
  EventResponsibleOption,
} from '../types/management'
import type { CompetencyInput } from '../types/competency'
import type { createUserService } from './resources/users.ts'
import type { createUnitService } from './resources/units.ts'
import type { createShiftService } from './resources/shifts.ts'
import type { createCompetencyService } from './resources/competencies.ts'
import { technician, isTechnician, teamAccessType } from '../utils/apiUsers.ts'
import { validateTechnician, validatePassword } from '../utils/apiValidation.ts'
import { validateCompetency } from '../utils/competencies.ts'
import { check } from '../utils/validationErrors.ts'
import { PartialSaveError } from './managementErrors.ts'
export function createTeamService(
  user: ManagementSession,
  users: ReturnType<typeof createUserService>,
  units: ReturnType<typeof createUnitService>,
  shiftsService: ReturnType<typeof createShiftService>,
  competencies: ReturnType<typeof createCompetencyService>,
) {
  const { scope, institutionScope } = units
  const { rawGrades, writeGrade } = competencies
  async function listTechnicians(): Promise<Technician[]> {
    const unit = await scope()
    const [items, shifts] = await Promise.all([
      users.listUsers({ tipoAcesso: 'TECNICO', ...(unit ? { unidadeId: unit.id } : {}) }),
      shiftsService.listRawShifts(unit?.id),
    ])
    return Promise.all(
      items
        .filter((item) => isTechnician(item.tipoAcesso))
        .map(async (item) => {
          const [links, ratings] = await Promise.all([
            shiftsService.listUserShifts(String(item.id)),
            rawGrades(String(item.id)),
          ])
          return technician(item, unit, shifts, links, ratings)
        }),
    )
  }
  async function listTeamMembers(): Promise<TeamMember[]> {
    const current = user()
    if (current.role === 'GESTOR') return listTechnicians()
    if (current.role !== 'ADMINISTRADOR')
      throw new Error('Sua conta não tem permissão para consultar esta equipe.')
    const institution = await institutionScope()
    const teams = await Promise.all(
      institution.units.map(async (unit) => {
        const items = await users.listUsers({ unidadeId: unit.id })
        const members = items.flatMap((item) => {
          const accessType = teamAccessType(item.tipoAcesso)
          return item.unidadeId === unit.id && accessType ? [{ item, accessType }] : []
        })
        const shifts = members.some((member) => member.accessType === 'TÉCNICO')
          ? await shiftsService.listRawShifts(unit.id)
          : []
        return Promise.all(
          members.map(async ({ item, accessType }): Promise<TeamMember> => {
            const [links, ratings] =
              accessType === 'TÉCNICO'
                ? await Promise.all([
                    shiftsService.listUserShifts(String(item.id)),
                    rawGrades(String(item.id)),
                  ])
                : [[], []]
            return {
              ...technician(
                item,
                unit,
                shifts.filter((shift) => shift.unidadeId === unit.id),
                links,
                ratings,
              ),
              accessType,
              unitName: unit.nome,
            }
          }),
        )
      }),
    )
    return teams.flat()
  }
  async function listEventResponsibles(): Promise<EventResponsibleOption[]> {
    const unit = await scope()
    const items = await users.listUsers(unit ? { unidadeId: unit.id } : undefined)
    const result = new Map<string, EventResponsibleOption>()
    for (const item of items) {
      const allowed =
        typeof item.tipoAcesso === 'string'
          ? ['GESTOR', 'TECNICO'].includes(item.tipoAcesso)
          : [2, 3].includes(item.tipoAcesso.id)
      if (allowed)
        result.set(String(item.id), {
          id: String(item.id),
          name: item.nomeCompleto,
          status: item.estaAtivo ? 'Ativo' : 'Inativo',
        })
    }
    const current = user()
    if (current.role === 'GESTOR')
      result.set(current.id, { id: current.id, name: current.name, status: 'Ativo' })
    return [...result.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  async function saveTechnician(
    input: TechnicianInput,
    id?: string,
    ratings: CompetencyInput[] = [],
  ): Promise<Technician> {
    check(validateTechnician(input))
    for (const rating of ratings) {
      const error = validateCompetency(rating)
      if (error) throw new Error(error)
    }
    if (!id) {
      const error = validatePassword(input.password ?? '')
      if (error) throw new Error(error)
    }
    const [old, institution] = await Promise.all([
      id ? users.getUser(id) : Promise.resolve(null),
      user().role === 'ADMINISTRADOR' ? institutionScope() : Promise.resolve(null),
    ])
    const previousUnit = institution
      ? old
        ? institution.units.find((item) => item.id === old.unidadeId)
        : institution.currentUnit
      : await scope()
    const unit =
      institution && input.unitId
        ? institution.units.find((item) => String(item.id) === input.unitId)
        : previousUnit
    if (institution && (!previousUnit || !unit))
      throw new Error('A unidade selecionada não pertence à instituição da sua conta.')
    if (unit && !unit.estaAtivo && unit.id !== old?.unidadeId)
      throw new Error('Selecione uma unidade ativa.')
    const shifts = await shiftsService.listRawShifts(unit?.id ?? old?.unidadeId)
    const selected = input.shiftIds ?? (input.shiftId ? [input.shiftId] : [])
    const unitId =
      unit?.id ??
      old?.unidadeId ??
      shifts.find((shift) => String(shift.id) === selected[0])?.unidadeId
    if (
      !unitId ||
      !selected.length ||
      selected.some(
        (value) =>
          !shifts.some(
            (shift) => String(shift.id) === value && shift.estaAtivo && shift.unidadeId === unitId,
          ),
      )
    )
      throw new Error('Selecione um turno ativo da unidade.')
    if (input.unitId && input.unitId !== String(unitId))
      throw new Error('Sua conta não pode alterar a unidade de trabalho.')
    const data = {
      ...(old && unitId !== old.unidadeId ? { unidadeId: unitId } : {}),
      nomeCompleto: input.name.trim(),
      email: input.email.trim(),
      cargo: input.jobTitle?.trim(),
      dataNascimento: input.birthDate,
    }
    let saved = id
      ? await users.saveUser(data, id)
      : await users.saveUser({
          ...data,
          unidadeId: unitId,
          tipoAcesso: 'TECNICO',
          senha: input.password,
        })
    try {
      if (!saved.estaAtivo && (input.status === 'Ativo' || !id))
        saved = await users.setUserActive(String(saved.id), true)
      const links = await shiftsService.listUserShifts(String(saved.id))
      // Vincular primeiro: se falhar, nenhum vínculo antigo é removido.
      for (const shiftId of selected) {
        if (!links.some((link) => link.estaAtivo && String(link.turnoId) === shiftId))
          await shiftsService.linkUser(shiftId, String(saved.id))
      }
      for (const link of links)
        if (link.estaAtivo && !selected.includes(String(link.turnoId)))
          await shiftsService.deactivateLink(String(link.id))
      const previous = await rawGrades(String(saved.id))
      for (const rating of ratings) await writeGrade(String(saved.id), rating, previous)
      if (saved.estaAtivo && input.status === 'Inativo')
        saved = await users.setUserActive(String(saved.id), false)
      return technician(
        saved,
        unit,
        shifts,
        selected.map((shiftId) => ({ id: 0, turnoId: Number(shiftId), estaAtivo: true })),
        await rawGrades(String(saved.id)),
      )
    } catch (error) {
      throw new PartialSaveError(String(saved.id), error)
    }
  }
  async function removeTechnician(id: string): Promise<void> {
    await users.setUserActive(id, false)
  }
  return {
    listTechnicians,
    listTeamMembers,
    listEventResponsibles,
    saveTechnician,
    removeTechnician,
  }
}
