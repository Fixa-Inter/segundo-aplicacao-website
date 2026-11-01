import type { ManagementClient } from '../types/api/shared'
import type { User } from '../types/auth'
import { createManagementSession } from './managementSession.ts'
import { createCompetencyService } from './resources/competencies.ts'
import { createEventService } from './resources/events.ts'
import { createLocationService } from './resources/locations.ts'
import { createProfileService } from './resources/profile.ts'
import { createShiftService } from './resources/shifts.ts'
import { createUnitService } from './resources/units.ts'
import { createUserService } from './resources/users.ts'
import { createTeamService } from './teamService.ts'

export { PartialSaveError } from './managementErrors.ts'

export function createManagementService(client: ManagementClient, getUser: () => User | null) {
  const user = createManagementSession(getUser)
  const users = createUserService(client)
  const units = createUnitService(client, user, users)
  const shifts = createShiftService(client, user, units)
  const competencies = createCompetencyService(client)
  const events = createEventService(client, user)
  const locations = createLocationService(client, units)
  const profile = createProfileService(client, units)
  const team = createTeamService(user, users, units, shifts, competencies)
  return {
    ...team,
    ...events,
    ...profile,
    listTechnicianCompetencies: competencies.listTechnicianCompetencies,
    saveTechnicianCompetency: competencies.saveTechnicianCompetency,
    listShifts: shifts.listShifts,
    listWorkUnits: units.listWorkUnits,
    listLocations: locations.listLocations,
  }
}
