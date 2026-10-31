import type { ManuVisualization } from './visualization'
import type { ManuEmotion } from '../utils/manu'
export interface ChatAttachment {
  id: string
  name: string
  size: number
}

export interface ChatMessage {
  id: string
  author: 'user' | 'manu'
  text: string
  attachments?: ChatAttachment[]
}
export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
}

export interface ManuMessage {
  id: string
  author: 'user' | 'manu'
  text: string
  images: string[]
  emotion?: ManuEmotion
  confirmation?: boolean
  visualization?: ManuVisualization
  visualizationError?: boolean
}

export interface ManuConversation {
  thread_id: string
  title: string
  updated_at: string
  closed: boolean
}

export interface ManuHistory extends ManuConversation {
  messages: ManuMessage[]
  confirmacao: 'sim' | 'nao'
  summary?: string | null
}

export interface ManuReply {
  visualization?: ManuVisualization
  visualizationError?: boolean
  thread_id: string
  resposta: string
  emocao: string
  intencao: string | null
  confirmacao: 'sim' | 'nao'
}

export interface ManuAttachment {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'ready' | 'error'
  url?: string
  error?: string
}
