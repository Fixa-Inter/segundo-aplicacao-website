export interface RemoteConversation {
  session_id: string
  iniciada_em: string
  atualizada_em: string
  titulo: string
  resumo: string
  mensagens: { role: 'human' | 'assistant'; mensagem: string; emocao?: string | null }[]
}
