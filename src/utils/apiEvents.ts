import type { ApiEvent } from '../types/api/events'
import type { CalendarEvent } from '../types/management'

export function event(item: ApiEvent): CalendarEvent {
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
