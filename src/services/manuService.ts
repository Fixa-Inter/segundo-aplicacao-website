import type { ChatAttachment, ChatConversation, ChatMessage } from '../types/manu'

let conversations: ChatConversation[] = []
const listeners = new Set<() => void>()

export function subscribeDemoConversations(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifyConversations(): void {
  listeners.forEach((listener) => listener())
}

export function listDemoConversations(): ChatConversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({ ...attachment })),
    })),
  }))
}

export function clearDemoConversations(): void {
  conversations = []
  notifyConversations()
}

export function beginDemoMessage(
  id: string,
  question: string,
  attachments: ChatAttachment[],
): ChatConversation[] {
  const text = question.trim()
  if (!text || text.length > 500) throw new Error('A mensagem deve ter de 1 a 500 caracteres.')
  if (
    attachments.length > 3 ||
    attachments.some(
      (item) => !Number.isFinite(item.size) || item.size < 0 || item.size > 5 * 1024 * 1024,
    )
  ) {
    throw new Error('Use até 3 anexos com no máximo 5 MB cada.')
  }
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    author: 'user',
    text,
    // Somente metadados: nenhum File, conteúdo, URL ou caminho é armazenado.
    attachments: attachments.map(({ id, name, size }) => ({ id, name, size })),
  }
  conversations = conversations.some((conversation) => conversation.id === id)
    ? conversations.map((conversation) =>
        conversation.id === id
          ? { ...conversation, messages: [...conversation.messages, message] }
          : conversation,
      )
    : [{ id, title: text.slice(0, 38), messages: [message] }, ...conversations]
  notifyConversations()
  return listDemoConversations()
}

export async function completeDemoMessage(
  id: string,
  question: string,
  hasAttachments: boolean,
): Promise<ChatConversation[]> {
  const reply = await getDemoReply(question)
  const response: ChatMessage = {
    id: crypto.randomUUID(),
    author: 'manu',
    text: hasAttachments
      ? `${reply}\nAnexos desta demonstração não são enviados nem analisados.`
      : reply,
  }
  // Se houve logout durante a resposta, a conversa removida não é recriada.
  conversations = conversations.map((conversation) =>
    conversation.id === id
      ? { ...conversation, messages: [...conversation.messages, response] }
      : conversation,
  )
  notifyConversations()
  return listDemoConversations()
}

// Respostas guiadas de demonstração. A integração com o serviço de IA depende do backend.
export async function getDemoReply(question: string): Promise<string> {
  if (!question.trim() || question.trim().length > 500)
    throw new Error('A mensagem deve ter de 1 a 500 caracteres.')
  await new Promise<void>((resolve) => setTimeout(resolve, 300))
  const text = question.toLocaleLowerCase('pt-BR')
  if (/solicita|chamado|pedido|request|ticket|请求|工单/.test(text))
    return 'Para acompanhar uma solicitação, consulte o calendário e a equipe responsável. A abertura de chamados depende da API do FIXA.'
  if (/técnic|equipe|technician|team|equipo|技术|团队/.test(text))
    return 'Na página Equipe você pode buscar técnicos e simular cadastros, edições e exclusões nesta sessão.'
  if (/calend|evento|agend|event|日历|事件|安排/.test(text))
    return 'No Calendário você pode selecionar uma data e simular a criação, edição ou exclusão de eventos.'
  if (/indicador|dashboard|relatório|indicator|指标|看板/.test(text))
    return 'O Dashboard mostra indicadores demonstrativos com filtros de período. A conexão com dados reais depende do backend e da camada de BI.'
  return 'Posso orientar sobre equipe, calendário, solicitações e indicadores do FIXA. Esta é uma resposta guiada de demonstração, sem IA conectada.'
}
