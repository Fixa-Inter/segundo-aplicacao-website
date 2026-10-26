import { api } from './api.ts'
import { currentUser } from './authService.ts'
import { createManagementService } from './apiManagement.ts'
import type { DashboardRecord, PerformancePoint } from '../types/management'
export { PartialSaveError } from './apiManagement.ts'
export const {
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
  listEventResponsibles,
  listLocations,
} = createManagementService(api, currentUser)

export async function getDashboard(_technicianId = ''): Promise<DashboardRecord[]> {
  void _technicianId
  throw new Error('Os indicadores aguardam a conexão com a API de Dashboard/BI.')
}
export async function getTechnicianPerformance(
  _id: string,
  _period: string,
): Promise<PerformancePoint[]> {
  void _id
  void _period
  throw new Error('O desempenho aguarda a conexão com a API de Dashboard/BI.')
}
