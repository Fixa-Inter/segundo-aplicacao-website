import type { InputHTMLAttributes, ReactNode } from 'react'
import type {
  CalendarEvent,
  CalendarEventInput,
  ManagerProfile,
  PerformancePeriod,
  PerformancePoint,
  Technician,
  TechnicianInput,
} from './management'
export interface AppAppearanceProps {
  children: ReactNode
}
export interface PreferencesProviderProps {
  children: ReactNode
}
export interface BrandProps {
  compact?: boolean
  className?: string
}
export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  trailing?: ReactNode
}
export interface StatCardProps {
  label: string
  value: number
  tone: 'blue' | 'yellow' | 'green' | 'red'
}
export interface NavigationProps {
  onNavigate: () => void
  onLogout: () => void
}

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export interface TechnicianFormProps {
  technician: Technician | null
  manager: ManagerProfile
  onSubmit: (input: TechnicianInput) => Promise<Technician>
  onSaved: (technician: Technician) => void
  onCancel: () => void
}

export interface EventFormProps {
  event: CalendarEvent | null
  selectedDay: string
  technicians: Technician[]
  onSubmit: (input: CalendarEventInput) => Promise<CalendarEvent>
  onSaved: (event: CalendarEvent) => void
  onCancel: () => void
}

export interface AuthProviderProps {
  children: ReactNode
}

export interface TechnicianDetailsProps {
  technician: Technician
  onBack: () => void
  onEdit: () => void
  period: PerformancePeriod
  points: PerformancePoint[]
  loading: boolean
  error: string
  onPeriodChange: (period: PerformancePeriod) => void
}
