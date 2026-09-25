export interface ChatMessage {
  id: string
  author: 'user' | 'manu'
  text: string
}
export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
}
