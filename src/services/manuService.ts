// Respostas guiadas de demonstração. A integração com o serviço de IA depende do backend.
export async function getDemoReply(question: string): Promise<string> {
  await new Promise<void>((resolve) => setTimeout(resolve, 300))
  const text = question.toLocaleLowerCase('pt-BR')
  if (/solicita|chamado|pedido/.test(text))
    return 'Para acompanhar uma solicitação, consulte o calendário e a equipe responsável. A abertura de chamados depende da API do FIXA.'
  if (/técnic|equipe/.test(text))
    return 'Na página Equipe você pode buscar técnicos e simular cadastros, edições e exclusões nesta sessão.'
  if (/calend|evento|agend/.test(text))
    return 'No Calendário você pode selecionar uma data e simular a criação, edição ou exclusão de eventos.'
  if (/indicador|dashboard|relatório/.test(text))
    return 'O Dashboard mostra indicadores demonstrativos com filtros de período. A conexão com dados reais depende do backend e da camada de BI.'
  return 'Posso orientar sobre equipe, calendário, solicitações e indicadores do FIXA. Esta é uma resposta guiada de demonstração, sem IA conectada.'
}
