import type { InputHTMLAttributes, ReactNode } from 'react'
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
