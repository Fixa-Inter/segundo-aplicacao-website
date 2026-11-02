import { api } from './api.ts'
import { createManagementService } from './apiManagement.ts'
import { currentUser } from './authService.ts'

export { PartialSaveError } from './apiManagement.ts'
export const {
  loadInstitution,
  saveInstitutionEntry,
  setInstitutionEntryActive,
  listTechnicians,
  listTeamMembers,
  saveTechnician,
  saveManager,
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
