import type { ManagementClient, ManagementSession } from '../../types/api/shared'
import type { ApiEvent } from '../../types/api/events'
import type { CalendarEvent, CalendarEventInput } from '../../types/management'
import { event } from '../../utils/apiEvents.ts'
import { validateEvent } from '../../utils/apiValidation.ts'
import { check } from '../../utils/validationErrors.ts'
export function createEventService(client: ManagementClient, user: ManagementSession) {
  const request = client.request
  async function listEvents(): Promise<CalendarEvent[]> {
    return (await request<ApiEvent[]>('/api/v1/eventos')).map(event)
  }
  async function saveEvent(input: CalendarEventInput, id?: string): Promise<CalendarEvent> {
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
  async function removeEvent(id: string): Promise<void> {
    await request(`/api/v1/eventos/${id}`, { method: 'DELETE' })
  }
  return { listEvents, saveEvent, removeEvent }
}
