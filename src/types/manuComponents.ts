import type { ReactNode } from 'react'
import type { ManuChatController } from '../hooks/useManuChat'

export interface ManuViewProps {
  chat: ManuChatController
}

export interface ManuResponseProps {
  text: string
}

export interface ManuLinkProps {
  href?: string
  children: ReactNode
}
