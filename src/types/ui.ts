import type { InputHTMLAttributes, ReactNode } from 'react'
import type { ManagerProfile, Technician } from './management'
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

export interface DemoBadgeProps {
  children: string
}

export interface TechnicianFormProps {
  technician: Technician | null
  manager: ManagerProfile
  onSaved: (technician: Technician) => void
  onCancel: () => void
}
