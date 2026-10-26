# Revisão geral da Web — 26/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12). Revisão de código, regressões controladas e navegação real das APIs AWS com contas Gestor/RH autorizadas. Nenhum banco ou backend foi alterado.

## Erros reproduzidos e corrigidos

### Troca de conversa durante carregamento

Ao abrir uma conversa fora do cache, o campo de mensagem continuava ativo com a conversa anterior enquanto a leitura estava pendente. O envio poderia usar o thread_id anterior e a resposta disputar a tela com o novo histórico.

Reprodução controlada com 51 conversas: antes, composerBlocked=false, sendBlocked=false e ausência de indicação de carregamento. Depois, o carregamento bloqueia ações/envio, anuncia Carregando conversa…, usa AbortSignal e só atualiza a tela se a requisição ainda pertence à geração atual. A mensagem enviada após carregar usou exatamente a conversa selecionada; o teste confirmou quatro mensagens da conversa correta.

### Cache guardava conversas antigas no lugar das recentes

O histórico chega por atualização decrescente, mas a inserção no Map de capacidade 50 expulsava primeiro as conversas recentes. Agora o preenchimento considera os dados remotos e locais e insere dos mais antigos aos mais recentes, mantendo as 50 mais recentes após a listagem. Uma regressão com 60 conversas verifica acesso à mais recente sem novo POST e leitura específica da antiga fora do cache.

### Sucesso de exclusão/desativação confundido com falha da lista

Calendário e equipe tratavam a mutação e a leitura posterior como uma operação única. Quando o servidor aceitava DELETE/PATCH e a leitura seguinte falhava, o evento continuava visível ou o técnico continuava ativo na tela; o Calendário ainda dizia que não conseguira excluir o evento.

Agora a confirmação bem-sucedida atualiza imediatamente o estado local e mostra a mensagem de sucesso. A leitura posterior tem tratamento separado: sua falha informa que a ação foi concluída, mas a lista não pôde ser atualizada. Não repete DELETE/PATCH. Regressões controladas validaram um DELETE e uma desativação, ambos com leitura seguinte 500, preservando evento removido e técnico inativo.

### Nome do técnico apertado no celular

A linha de identidade disputava espaço entre avatar, nome e botão de edição, cortando até nomes curtos. Em telas de até 600 px, avatar e texto ficam na primeira linha e o botão na seguinte. QA em 390 px confirmou espaço útil superior a 210 px para o nome, sem overflow, e verificou o modal de descarte preservando ou descartando o rascunho conforme a escolha.

## Dependência indireta

O npm audit --omit=dev apontou follow-redirects 1.16.0, dependência indireta do Axios, com dois avisos agrupados em uma dependência de gravidade alta. Avisos oficiais: [headers em formato de array](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) e [escape de sensitiveHeaders](https://github.com/advisories/GHSA-8r9p-f939-6h3c). Ambos indicam correção a partir de 1.16.1.

Foi atualizado somente o pacote indireto, para 1.16.2, dentro do intervalo já permitido pelo Axios, com scripts de instalação desativados. package.json não foi alterado. O lockfile e node_modules foram atualizados; não foi feito npm audit fix --force. Nova auditoria das dependências de produção reportou zero vulnerabilidades. Isso não afirma que houve exploração nem certifica ausência de outros problemas fora da base de avisos consultada.

## Navegação e verificações

- Formatação, lint, 114 testes, build e diff --check aprovados, inclusive depois da atualização da dependência.
- 28 verificações de página: Início, Dashboard, Equipe, Calendário, Perfil, Manu e Configurações em 1440 e 390 px, com Gestor e RH. Sem erros JavaScript, overflow da página ou carregamento preso. Alertas foram registrados separadamente do sucesso de renderização.
- Preferências de inglês e tema escuro mantidas após recarregar, em contextos isolados do navegador de teste.
- Fluxos de mutação e suas falhas foram exercitados com respostas controladas; não foram alterados técnicos/eventos/conversas reais. As duas sessões de leitura real terminaram com logout 204.
- Código de autenticação/renovação, validação de formulários, proteção de alterações pendentes e integração dos serviços foi inspecionado. A suíte existente continuou passando; não se trata de certificação integral desses fluxos.

## Pendência de acesso do RH à Manu

Nas duas larguras, a página Manu do RH apresentou um alerta. Verificação direta às 15h47, com o mesmo token: login Web 200, GET /api/v1/perfil Web 200 (papel Administrador) e GET /api/v1/sessoes da IA 403, detail Usuário sem permissão de acesso. Logout 204. Gestor carregou histórico sem alerta na revisão.

O usuário confirmou que RH também deve acessar a Manu. A navegação e a rota da Web permanecem disponíveis para esse perfil; a recusa é uma pendência externa. Encaminhamento: conferir autorização e consulta de perfil na implantação da IA para ADMINISTRADOR/RH, pois o mesmo Bearer retornou 200 no perfil Web e 403 na listagem de sessões da IA às 15h47. Nenhuma permissão foi contornada e a API da IA não foi modificada. A causa exata da recusa no servidor não foi atribuída a uma configuração específica sem logs.

## Limites e evidências

Não foram enviados e-mails de recuperação, alteradas senhas, feitos uploads reais nem criados registros operacionais pela IA nesta revisão. A navegação para o iframe não valida suas consultas internas ou todas as permissões do Databricks. As pendências anteriores de contrato/título da IA e de BI não são consideradas resolvidas por esse teste de páginas.

Evidências locais ignoradas pelo Git, sem tokens/senhas: dev.local/audit-chat-loading-before.json e after.json; audit-refresh-before.json e after.json; audit-mobile-browser.json; audit-routes-read.json; audit-rh-history.json; audit-dependencies.json e audit-dependencies-after.json; logs audit-*.log e screenshot audit-mobile-technician-mobile.png. A falha de strict selector em uma execução inicial do QA de descarte foi corrigida no próprio teste, aguardando o fechamento do modal; a execução final passou.

Sem novo PR, revisão de integrante, merge, promoção ou deploy nesta atividade. A pendência de acesso do RH permanece explícita e a Issue #12 continua aberta para o fluxo global da integração.
