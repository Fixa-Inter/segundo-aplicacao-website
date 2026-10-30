export interface RemoteConversation {
  session_id: string
  iniciada_em: string
  atualizada_em: string
  titulo: string
  resumo: string
  mensagens: {
    role: 'human' | 'assistant'
    mensagem: string
    emocao?: string | null
    confirmacao?: 'sim' | 'nao'
    imagens?: string[] | null
  }[]
}

export interface RemoteClosedConversation {
  thread_id: string
  status: string
  mensagem: string
  titulo?: string | null
  resumo?: string | null
}
