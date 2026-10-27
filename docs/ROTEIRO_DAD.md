# Roteiro de demonstração — FIXA Web

Atualizado em **26/10/2026**. A Web consome APIs reais na AWS; cadastros podem alterar o banco compartilhado. Use contas e registros autorizados de homologação. O roteiro anterior de login demonstrativo/código fixo de recuperação não corresponde à integração atual.

Consulte a [matriz de DAD](MATRIZ_REQUISITOS.md) e o [relatório com resultados e pendências](VALIDACAO_DAD_2026-10-26.md).

## Preparação

1. Use Node.js 24 e a configuração de ambiente do [README](../README.md).
2. Execute npm run format:check, npm run lint, npm test e npm run build, registrando os resultados reais.
3. Execute npm run dev e abra http://localhost:5173. A configuração exige essa porta.
4. Separe contas de Gestor e RH autorizadas, com CNPJ/e-mail/senha válidos. Não exponha senhas ou tokens na apresentação.
5. Entre no Databricks no mesmo navegador. A sessão da Web não autentica automaticamente no Databricks.
6. **Publicação permanece pendente:** testar a URL pública e incluí-la no README antes da avaliação.

## Fluxos da interface

| Etapa              | Demonstração                                                                                                | Limite ou cuidado                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Público e proteção | Abrir /sobre, URL inexistente e /equipe sem sessão.                                                         | 404 tem retorno; rota privada redireciona ao login. Autorização também precisa ser imposta pelo servidor.                                              |
| Login              | Enviar vazio, conferir erros/foco e entrar com conta autorizada.                                            | Três campos obrigatórios. Não usar dados fictícios como se fossem credenciais reais.                                                                   |
| Home e BI          | Selecionar dias, navegar meses, conferir eventos e gráfico incorporado.                                     | Gráficos dependem da sessão e permissões Databricks; não há API de BI na V1.                                                                           |
| Equipe RH          | Gestores abre primeiro; trocar para Técnicos usando teclado; buscar, filtrar e paginar.                     | Gestores têm detalhes somente leitura; ações técnicas dependem do perfil.                                                                              |
| Técnico            | Abrir detalhes, competências e editar; alterar campo e cancelar; testar Escape/continuar edição e descarte. | Notas opcionais de 0 a 10, até duas casas decimais. Um turno. Local é unidade de trabalho. Telefone não faz parte do contrato atual.                   |
| Persistência       | Em homologação autorizada, cadastrar/editar um registro de teste e consultar novamente após recarregar.     | Esta rodada não realizou escritas operacionais reais. Técnico é desativado, não apagado fisicamente. Falha parcial pode exigir completar turnos/notas. |
| Calendário         | Conferir eventos; em homologação criar, editar e excluir um registro próprio de teste.                      | Responsável de evento existente não pode ser trocado; datas/horas inválidas devem produzir erros por campo.                                            |
| Perfil             | Conferir localização/e-mail/nascimento; editar dados pessoais, cancelar e testar descarte.                  | Localização vem da unidade; não prometer edição de endereço pessoal.                                                                                   |
| Senha              | Mostrar validação da troca e explicar recuperação.                                                          | Código vem por e-mail real; não usar código fixo nem trocar senha compartilhada durante demonstração sem planejamento.                                 |
| Manu               | Gestor: histórico, mensagens, emoções e novo chat; exclusão com confirmação em conversa de teste.           | Pode consumir IA e persistir chats. RH ainda recebe 403 no histórico; não declarar resolvido. Upload envia arquivo ao Cloudinary.                      |
| Preferências       | Trocar os quatro idiomas e tema e recarregar.                                                               | Preferência explícita prevalece; sem escolha, segue idioma compatível do navegador. Sessão usa sessionStorage; dados de negócio persistem no servidor. |
| Saída              | Abrir confirmação, cancelar por Escape, depois sair.                                                        | Conferir retorno de foco e impossibilidade de abrir rota privada após logout.                                                                          |

## Demonstrações técnicas do PDF

- Mostrar src/components, src/pages e src/types; explicar as pendências de imports de services nos formulários e do adaptador com vários recursos.
- Explicar o estado agrupado e atualizações imutáveis; apontar efeito, dependências e cancelamento pelo AbortController.
- Mostrar keys de IDs nas listas dinâmicas; distinguir os índices de listas estáticas.
- **useParams ainda não demonstrado:** resolver rota com guarda ou confirmar interpretação com o professor.
- Abrir um build de produção em janela limpa e a aba Network: observar chunks de páginas apenas ao navegar. Os testes desta rodada já observaram seis carregamentos distintos.
- Mostrar AuthContext, Provider e hook de consumo; justificar prop drilling e reducer com casos reais. AuthState ainda não é union.
- Preferências ainda não têm _versao; não declarar extra de armazenamento versionado concluído.
- Demonstrar no Profiler qualquer benefício atribuído a useMemo/useCallback; medição ainda pendente.
- Percorrer login, edição, descarte, abas, filtro e menu móvel sem mouse. Conferir anel de foco, contenção em diálogo e retorno ao acionador.
- Executar NVDA/VoiceOver com landmarks e iframes; esse ensaio não foi realizado nesta rodada.
- Mostrar validação tipada e interpolação JSX de dados externos. Não executar payloads contra contas/serviços de terceiros.
- Mostrar git log real e URL pública da Web quando existir. Nenhuma data, aprovação ou evidência deve ser simulada.

Os testes desta rodada não aprovam automaticamente outras disciplinas, todo o fluxo de gravação na AWS ou acessibilidade integral. Registre qualquer etapa não executada e não substitua essa informação por uma resposta simulada.
