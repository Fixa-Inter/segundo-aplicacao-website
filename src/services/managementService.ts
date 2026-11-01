import { api } from './api.ts'
import { createManagementService } from './apiManagement.ts'
import { currentUser } from './authService.ts'

export { PartialSaveError } from './apiManagement.ts'
export const {
  listTechnicians,
  listTeamMembers,
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
  listWorkUnits,
  listEventResponsibles,
  listLocations,
} = createManagementService(api, currentUser)
