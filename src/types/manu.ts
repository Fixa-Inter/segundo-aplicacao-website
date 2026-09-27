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
