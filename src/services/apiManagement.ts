import type { User } from '../types/auth'
import type {
  CalendarEvent,
  CalendarEventInput,
  ManagerProfile,
  Technician,
  TechnicianInput,
  ShiftOption,
  LocationOption,
} from '../types/management'
import type { CompetencyInput, TechnicianCompetency } from '../types/competency'
import {
  competencyCategories,
  getCompetencyPresentation,
  validateCompetency,
} from '../utils/competencies.ts'
import {
  validateTechnician,
  validateEvent,
  validateProfile,
  validatePassword,
} from '../utils/apiValidation.ts'
import type { createHttpClient } from './httpClient.ts'

type EnumValue = string | { id: number; nome: string }
interface ApiUnit {
  id: number
  nome: string
  cnpj: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  estaAtivo: boolean
}
interface ApiUser {
  id: number
  unidadeId: number
  nomeCompleto: string
  email: string
  tipoAcesso: EnumValue
  cargo: string
  dataNascimento: string
  estaAtivo: boolean
}
interface ApiProfile {
  id: number
  nomeCompleto: string
  email: string
  dataNascimento: string
}
interface ApiGrade {
  id: number
  usuarioId: number
  categoriaProblema: EnumValue
  nota: number
  estaAtivo: boolean
}
interface ApiShift {
  id: number
  unidadeId: number
  nome: string
  horaInicio: number
  horaFim: number
  estaAtivo: boolean
}
interface ApiLink {
  id: number
  turnoId: number
  estaAtivo: boolean
}
interface ApiLocation {
  id: number
  unidadeId: number
  nome: string
  estaAtivo: boolean
}
interface ApiEvent {
  id: number
  usuarioId: number
  localEnderecoId: number
  titulo: string
  descricao: string
  descricaoLocal: string
  observacao: string | null
  dataHoraInicio: string
  dataHoraFim: string
}
const categoryNames = [
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
const categoryId = (value: EnumValue) =>
  typeof value === 'object' ? value.id : categoryNames.indexOf(value) + 1
const isTechnician = (value: EnumValue) =>
  typeof value === 'object' ? value.id === 3 : value === 'TECNICO'
const digits = (value: string) => value.replace(/\D/g, '')
const clock = (value: number) => `${String(value).padStart(2, '0')}:00`
const check = (errors: object) => {
  const first = Object.values(errors)[0]
  if (first) throw new Error(String(first))
}
export class PartialSaveError extends Error {
  resourceId: string
  constructor(id: string, cause: unknown) {
    super(
      `O cadastro ${id} foi salvo, mas parte das alterações não foi concluída. Tente salvar novamente para completar. ${cause instanceof Error ? cause.message : ''}`,
    )
    this.resourceId = id
  }
}
export function createManagementService(
  client: ReturnType<typeof createHttpClient>,
  getUser: () => User | null,
) {
  const request = client.request
  const user = () => {
    const value = getUser()
    if (!value) throw new Error('Entre novamente para continuar.')
    return value
  }
  const units = () => request<ApiUnit[]>('/api/v1/unidades')
  async function currentUnit() {
    const found = (await units()).find((unit) => digits(unit.cnpj) === digits(user().cnpj))
    if (!found) throw new Error('A unidade deste CNPJ não está disponível para sua conta.')
    return found
  }
  // A listagem de unidades é exclusiva de ADMINISTRADOR. Para GESTOR, os demais endpoints já aplicam o escopo da unidade no servidor.
  const scope = () => (user().role === 'ADMINISTRADOR' ? currentUnit() : Promise.resolve(undefined))
  function address(unit?: ApiUnit) {
    return {
      postalCode: unit?.cep ?? '',
      address: unit?.logradouro ?? '',
      district: unit?.bairro ?? '',
      city: unit?.cidade ?? '',
      state: unit?.estado ?? '',
      number: unit?.numero ?? '',
      complement: unit?.complemento ?? '',
    }
  }
  const rawGrades = (id: string, signal?: AbortSignal) =>
    request<ApiGrade[]>('/api/v1/aptidoes', { params: { usuarioId: id }, signal })
  function grades(items: ApiGrade[]): TechnicianCompetency[] {
    return competencyCategories.map((category) => ({
      ...category,
      rating:
        items.find((item) => categoryId(item.categoriaProblema) === category.id && item.estaAtivo)
          ?.nota ?? null,
    }))
  }
  function technician(
    item: ApiUser,
    unit: ApiUnit | undefined,
    shifts: ApiShift[],
    links: ApiLink[],
    ratings: ApiGrade[],
  ): Technician {
    const activeShifts = links
      .filter((link) => link.estaAtivo)
      .map((link) => shifts.find((shift) => shift.id === link.turnoId))
      .filter((shift): shift is ApiShift => Boolean(shift))
    return {
      ...address(unit),
      id: String(item.id),
      unitId: String(item.unidadeId),
      name: item.nomeCompleto,
      email: item.email,
      birthDate: item.dataNascimento,
      jobTitle: item.cargo,
      phone: '',
      specialty: '',
      assessedSpecialty: getCompetencyPresentation(grades(ratings)).highlights[0]?.name ?? null,
      accessType: 'TÉCNICO',
      status: item.estaAtivo ? 'Ativo' : 'Inativo',
      shiftId: activeShifts[0] ? String(activeShifts[0].id) : '',
      shift: activeShifts
        .map((shift) => `${clock(shift.horaInicio)} - ${clock(shift.horaFim)}`)
        .join(', '),
      shiftIds: activeShifts.map((shift) => String(shift.id)),
    }
  }
  async function listTechnicians() {
    const unit = await scope()
    const [items, shifts] = await Promise.all([
      request<ApiUser[]>('/api/v1/usuarios', {
        params: { tipoAcesso: 'TECNICO', ...(unit ? { unidadeId: unit.id } : {}) },
      }),
      request<ApiShift[]>('/api/v1/turnos', { params: unit ? { unidadeId: unit.id } : undefined }),
    ])
    return Promise.all(
      items
        .filter((item) => isTechnician(item.tipoAcesso))
        .map(async (item) => {
          const [links, ratings] = await Promise.all([
            request<ApiLink[]>(`/api/v1/usuarios/${item.id}/turnos`),
            rawGrades(String(item.id)),
          ])
          return technician(item, unit, shifts, links, ratings)
        }),
    )
  }
  async function listShifts(): Promise<ShiftOption[]> {
    const unit = await scope()
    return (
      await request<ApiShift[]>('/api/v1/turnos', {
        params: unit ? { unidadeId: unit.id } : undefined,
      })
    )
      .filter((item) => item.estaAtivo)
      .map((item) => ({
        id: String(item.id),
        name: `${item.nome} · ${clock(item.horaInicio)} - ${clock(item.horaFim)}`,
      }))
  }
  async function listLocations(): Promise<LocationOption[]> {
    const unit = await scope()
    return (
      await request<ApiLocation[]>('/api/v1/locais', {
        params: unit ? { unidadeId: unit.id } : undefined,
      })
    )
      .filter((item) => item.estaAtivo)
      .map((item) => ({ id: String(item.id), name: item.nome }))
  }
  async function listTechnicianCompetencies(id: string, signal?: AbortSignal) {
    return grades(await rawGrades(id, signal))
  }
  async function writeGrade(
    id: string,
    input: CompetencyInput,
    previous: ApiGrade[],
    signal?: AbortSignal,
  ) {
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
  ) {
    await writeGrade(id, input, await rawGrades(id, signal), signal)
    const result = (await listTechnicianCompetencies(id, signal)).find(
      (item) => item.id === input.competencyId,
    )
    if (!result) throw new Error('Competência inválida.')
    return result
  }
  async function saveTechnician(
    input: TechnicianInput,
    id?: string,
    ratings: CompetencyInput[] = [],
  ) {
    check(validateTechnician(input))
    for (const rating of ratings) {
      const error = validateCompetency(rating)
      if (error) throw new Error(error)
    }
    if (!id) {
      const error = validatePassword(input.password ?? '')
      if (error) throw new Error(error)
    }
    const unit = await scope()
    const old = id ? await request<ApiUser>(`/api/v1/usuarios/${id}`) : null
    const shifts = await request<ApiShift[]>('/api/v1/turnos', {
      params: old ? { unidadeId: old.unidadeId } : unit ? { unidadeId: unit.id } : undefined,
    })
    const selected = input.shiftIds ?? (input.shiftId ? [input.shiftId] : [])
    const unitId =
      old?.unidadeId ??
      unit?.id ??
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
    const data = {
      nomeCompleto: input.name.trim(),
      email: input.email.trim(),
      cargo: input.jobTitle?.trim(),
      dataNascimento: input.birthDate,
    }
    let saved = id
      ? await request<ApiUser>(`/api/v1/usuarios/${id}`, { method: 'PATCH', data })
      : await request<ApiUser>('/api/v1/usuarios', {
          method: 'POST',
          data: { ...data, unidadeId: unitId, tipoAcesso: 'TECNICO', senha: input.password },
        })
    try {
      if (!saved.estaAtivo && (input.status === 'Ativo' || !id))
        saved = await request<ApiUser>(`/api/v1/usuarios/${saved.id}/ativar`, { method: 'PATCH' })
      const links = await request<ApiLink[]>(`/api/v1/usuarios/${saved.id}/turnos`)
      // Vincular primeiro: se falhar, nenhum vínculo antigo é removido.
      for (const shiftId of selected) {
        if (!links.some((link) => link.estaAtivo && String(link.turnoId) === shiftId))
          await request(`/api/v1/turnos/${shiftId}/usuarios/${saved.id}`, { method: 'POST' })
      }
      for (const link of links)
        if (link.estaAtivo && !selected.includes(String(link.turnoId)))
          await request(`/api/v1/turnos-usuarios/${link.id}/desativar`, { method: 'PATCH' })
      const previous = await rawGrades(String(saved.id))
      for (const rating of ratings) await writeGrade(String(saved.id), rating, previous)
      if (saved.estaAtivo && input.status === 'Inativo')
        saved = await request<ApiUser>(`/api/v1/usuarios/${saved.id}/desativar`, {
          method: 'PATCH',
        })
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
  async function removeTechnician(id: string) {
    await request(`/api/v1/usuarios/${id}/desativar`, { method: 'PATCH' })
  }
  function event(item: ApiEvent): CalendarEvent {
    return {
      id: String(item.id),
      technicianId: String(item.usuarioId),
      locationId: String(item.localEnderecoId),
      title: item.titulo,
      description: item.descricao,
      location: item.descricaoLocal,
      observation: item.observacao ?? '',
      date: item.dataHoraInicio.slice(0, 10),
      time: item.dataHoraInicio.slice(11, 16),
      endDate: item.dataHoraFim.slice(0, 10),
      endTime: item.dataHoraFim.slice(11, 16),
    }
  }
  async function listEvents() {
    return (await request<ApiEvent[]>('/api/v1/eventos')).map(event)
  }
  async function saveEvent(input: CalendarEventInput, id?: string) {
    check(validateEvent(input))
    const ownerId = input.technicianId || user().id
    if (id) {
      const previous = await request<ApiEvent>(`/api/v1/eventos/${id}`)
      if (String(previous.usuarioId) !== ownerId)
        throw new Error('A API não permite trocar o responsável de um evento existente.')
    }
    const data = {
      localEnderecoId: Number(input.locationId),
      titulo: input.title.trim(),
      descricao: input.description.trim(),
      descricaoLocal: input.location.trim(),
      observacao: input.observation.trim(),
      dataHoraInicio: `${input.date}T${input.time}:00`,
      dataHoraFim: `${input.endDate ?? input.date}T${input.endTime}:00`,
    }
    return event(
      await request<ApiEvent>(id ? `/api/v1/eventos/${id}` : '/api/v1/eventos', {
        method: id ? 'PATCH' : 'POST',
        data: id ? data : { ...data, usuarioId: Number(ownerId) },
      }),
    )
  }
  async function removeEvent(id: string) {
    await request(`/api/v1/eventos/${id}`, { method: 'DELETE' })
  }
  async function getProfile(): Promise<ManagerProfile> {
    const [profile, unit] = await Promise.all([request<ApiProfile>('/api/v1/perfil'), scope()])
    return {
      ...address(unit),
      name: profile.nomeCompleto,
      email: profile.email,
      birthDate: profile.dataNascimento ?? '',
      phone: '',
      company: unit?.nome ?? '',
    }
  }
  async function saveProfile(input: ManagerProfile) {
    check(validateProfile(input))
    await request('/api/v1/perfil', {
      method: 'PATCH',
      data: {
        nomeCompleto: input.name.trim(),
        email: input.email.trim(),
        ...(input.birthDate ? { dataNascimento: input.birthDate } : {}),
      },
    })
    return getProfile()
  }
  return {
    listTechnicians,
    saveTechnician,
    removeTechnician,
    listTechnicianCompetencies,
    saveTechnicianCompetency,
    listEvents,
    saveEvent,
    removeEvent,
    getProfile,
    saveProfile,
    listShifts,
    listLocations,
  }
}
