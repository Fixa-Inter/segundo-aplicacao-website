export interface DashboardAccess {
  instanceUrl: string
  workspaceId: string
  dashboardId: string
  token: string
  expiresIn: number
}

export interface AuthenticatedDashboardProps {
  title: string
  widget?: string
  technician?: string
}
