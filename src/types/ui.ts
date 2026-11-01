import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from 'react'
import type { CompetencyInput, TechnicianCompetency } from './competency'
import type {
  CalendarEvent,
  CalendarEventInput,
  EventResponsibleOption,
  ManagerProfile,
  TeamMember,
  Technician,
  TechnicianInput,
} from './management'

export interface LoadingStateProps {
  label?: string
  fullscreen?: boolean
  compact?: boolean
}

export interface AppAppearanceProps {
  children: ReactNode
}
export interface PreferencesProviderProps {
  children: ReactNode
}
export interface BrandProps {
  compact?: boolean
  collapsed?: boolean
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

export interface FigmaIconProps {
  name:
    | 'home'
    | 'dashboard'
    | 'team'
    | 'calendar'
    | 'manu'
    | 'profile'
    | 'logout'
    | 'settings'
    | 'edit'
    | 'trash'
    | 'filter'
    | 'chevron-left'
    | 'chevron-right'
    | 'arrow-up-right'
    | 'close'
    | 'search'
    | 'plus'
    | 'more'
    | 'new-chat'
    | 'mail'
    | 'phone'
    | 'location'
    | 'profile-calendar'
    | 'profile-edit'
    | 'back'
    | 'chat-search'
    | 'attachment'
    | 'chat-plus'
    | 'send'
    | 'select-arrow'
  active?: boolean
}
export interface ConfirmDialogProps {
  opened: boolean
  variant: 'delete' | 'save' | 'logout' | 'discard' | 'deactivate' | 'deleteConversation'
  subject?: string
  confirmLabel: string
  error?: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}
export interface FilterButtonProps {
  onClear: () => void
  children: ReactNode
  active?: boolean
}
export interface PaginationProps {
  page: number
  total: number
  onChange: (page: number) => void
}
export interface EventDetailsProps {
  event: CalendarEvent | null
  onClose: () => void
}

export interface TechnicianFormProps {
  technician: Technician | null
  manager: ManagerProfile
  onSubmit: (
    input: TechnicianInput,
    competencies: CompetencyInput[],
    persistedId?: string,
  ) => Promise<Technician>
  onSaved: (technician: Technician) => void
  onCancel: () => void
}

export interface TechnicianFormFieldsProps extends TechnicianFormProps {
  initialCompetencies: TechnicianCompetency[]
}

export interface EventFormProps {
  event: CalendarEvent | null
  selectedDay: string
  responsibles: EventResponsibleOption[]
  onSubmit: (input: CalendarEventInput) => Promise<CalendarEvent>
  onSaved: (event: CalendarEvent) => void
  onCancel: () => void
}

export interface AuthProviderProps {
  children: ReactNode
}

export interface TechnicianDetailsProps {
  technician: TeamMember
  onBack: () => void
  onEdit?: () => void
}

export interface InformationItemProps {
  icon: ReactNode
  label: string
  value: string
}
export interface TechnicianPerformanceProps {
  name: string
}
export interface UnsavedChangesProviderProps {
  children: ReactNode
}

export interface AddRecordButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label' | 'type'
> {
  label: string
  ref?: Ref<HTMLButtonElement>
}
