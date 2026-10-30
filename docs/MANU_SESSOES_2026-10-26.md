# Manu: Novo chat e exclusão do histórico

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), em 26/10/2026. A implementação altera somente a Web e usa as rotas já publicadas na AWS.

## Efeitos de cada rota

| Ação na interface                          | Rota                                         | Efeito do contrato                                                               |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Novo chat, quando há conversa atual aberta | DELETE /api/v1/chat/sessions/{thread_id}     | Encerra a conversa e gera resumo; mantém o histórico                             |
| Lixeira, depois de confirmar               | DELETE /api/v1/sessoes/conversa/{session_id} | Oculta a conversa do histórico; não gera resumo e não apaga o documento do banco |

Ambas recebem o Bearer do login Web e não recebem corpo. A identidade da resposta precisa corresponder à conversa solicitada, com status ENCERRADA ou EXCLUIDA, respectivamente. A explicação final do usuário invertia os efeitos descritos tecnicamente; a Web segue os efeitos pretendidos e o contrato real, conforme esclarecido na conversa.

## Interface e estado

Novo chat aguarda a confirmação de encerramento para limpar mensagens, rascunho e anexos. Durante a operação, mostra Finalizando… e impede chamadas simultâneas. Falha mantém a conversa e o rascunho disponíveis, sem repetição automática. Conversa já finalizada ou tela inicial vazia inicia outra tela sem chamar DELETE novamente. A conversa nova só recebe um identificador quando a primeira mensagem é enviada. O antigo botão Finalizar conversa foi removido; conversas finalizadas exibem um indicador sem ação.

Cada linha do histórico tem dois botões independentes: abrir conversa e lixeira, sem botões aninhados. A lixeira tem nome acessível com o título da conversa e está disponível também em telas pequenas. O fundo de hover/seleção mantém a separação de 8 px entre linhas.

A confirmação reaproveita o modal e a ilustração de exclusão existentes, com a pergunta Excluir esta conversa? e a descrição A conversa será removida do seu histórico. Cancelar, Escape ou clicar fora antes da confirmação não chama a API. Durante o envio, os controles do modal ficam bloqueados; uma falha mostra mensagem no próprio modal e permite cancelar ou tentar novamente manualmente.

Sucesso remove apenas a conversa escolhida. Excluir a conversa atual volta à saudação inicial; excluir outra preserva a conversa e o rascunho atuais. O foco retorna ao botão Novo chat após a exclusão. O cache descarta a conversa removida e ignora leituras antigas que poderiam fazê-la reaparecer; essas marcações são limpas ao sair da conta. Falhas ou resposta com identidade incorreta não removem conteúdo.

## Verificação

- Formatação, lint, 108 testes, build e diff --check aprovados.
- Testes do serviço verificam rotas distintas, Bearer, ausência de corpo, preservação das demais conversas, falhas 403/500 sem repetição, identidade da resposta, leitura anterior à exclusão e resposta após logout.
- Navegador com sessão/IA controladas no teste: falha de encerramento preserva mensagens e rascunho; sucesso só limpa após confirmação; conversa finalizada não encerra outra vez; cancelar não exclui; falha de exclusão fica no modal; excluir outro chat mantém o atual; excluir o atual limpa a tela. Desktop e 390 px sem overflow, modal inteiramente visível no celular, Escape cancela.

Teste real entre 13h29 e 13h30 (America/Sao_Paulo), com Gestor autorizado: histórico 200, mensagem 200, Novo chat enviou um único DELETE de encerramento e recebeu 200/ENCERRADA; o histórico da conversa foi preservado. A lixeira abriu o modal, Cancelar não enviou requisição; depois da confirmação, um único DELETE do histórico retornou 200/EXCLUIDA. A conversa sumiu da listagem da AWS e continuou ausente após recarregar. Ambas as requisições tinham o Bearer correto, sem corpo. Logout 204, sem erros JavaScript.

Somente a conversa nova criada pelo teste real foi encerrada e removida. Nenhuma conversa anterior ou registro operacional foi alterado. A ausência no histórico confirma o efeito da API; não foi feita inspeção direta do banco nem alegada exclusão física.

Evidências locais ignoradas pelo Git: dev.local/manu-actions-browser.json, manu-actions-real.json, logs manu-actions-_.log e screenshots manu-actions-_.png. Relatórios sem tokens ou senhas. A evidência controlada não substitui a validação real; ambas estão identificadas.

Sem mudança no backend, novo PR, merge, promoção ou publicação nesta atividade. O teste cobre essas ações com Gestor, sem afirmar validação de todas as ferramentas ou perfis da IA.
