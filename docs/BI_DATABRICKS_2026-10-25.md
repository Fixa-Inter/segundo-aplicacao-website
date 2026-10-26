# Databricks: configuração e teste do iframe

**Estado atual:** em 25/10/2026 às 23h27 (São Paulo), o usuário confirmou que os gráficos apareceram na página local com iframe, no navegador autenticado no Databricks. O relato confirma a leitura do BI; a sessão de cada navegador continua independente. Os resultados sem autenticação abaixo registram a verificação inicial.

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12). O usuário forneceu o iframe oficial e uma captura do diálogo Copy embed code com http://localhost:5173 em Approved Domains.

## Configuração

A página Dashboard existente usa a variável pública VITE_DATABRICKS_DASHBOARD_URL como src do iframe. A URL fornecida foi configurada no .env.local desta máquina e em .env.example. A URL identifica o dashboard; não contém token de acesso ou credencial de login.

Outras máquinas devem copiar o exemplo ou atualizar essa variável. Na hospedagem, definir a variável antes do build e autorizar a origem real da web no workspace Databricks. Alterações de .env exigem reinício/recarregamento do Vite; não requerem alterar as APIs.

## Verificação em 25/10/2026 às 23h13 (São Paulo)

- A página local /dashboard incorporou exatamente a URL enviada, com largura responsiva, título acessível e link Abrir em nova aba.
- O documento /embed/dashboardsv3/... respondeu HTTP 200, sem X-Frame-Options e com frame-ancestors permitindo a incorporação. Não houve erro de CSP nem erro JavaScript na página Web durante a verificação.
- Sem uma sessão Databricks, o iframe foi redirecionado à tela /login.html do próprio Databricks, também com HTTP 200, exibindo Log in / Continue.
- A presença dos gráficos e a leitura dos dados **não foram homologadas**: o contexto de teste não possui uma conta Databricks autenticada. O embedding básico preserva as permissões da plataforma.
- O teste isolou somente a autenticação da API Web com uma resposta controlada no navegador de teste, pois o login AWS segue retornando 500. O iframe e as respostas do Databricks foram reais. Nenhum desvio de autenticação foi implementado no código da aplicação.
- Não houve alteração de permissões, publicação de dashboard ou escrita de dados no Databricks.

[Captura do iframe real solicitando autenticação](evidencias/bi-databricks-2026-10-25/iframe-login.png)

## Próxima validação

Após corrigir o login Web, entrar na aplicação e abrir Dashboard. Se o iframe pedir autenticação, usar Abrir em nova aba e entrar com uma conta autorizada no Databricks; retornar e recarregar a tela. Se o navegador bloquear cookies de terceiros e a sessão não for reconhecida no iframe, verificar a permissão do navegador para esse workspace.

Para exibir dashboards sem uma conta Databricks por visitante, a equipe precisará definir o fluxo de incorporação autenticada para usuários externos; isso exige configuração própria no Databricks e não é obtido tornando o iframe público.

Fontes oficiais: [embedding básico e autenticação](https://docs.databricks.com/aws/en/dashboards/share/embedding/basic) e [configuração de domínios do workspace](https://docs.databricks.com/aws/en/ai-bi/admin/embed).

## Correção após teste do usuário às 23h22

O detalhe “The dashboard must be embedded in an iframe” confirmou que abrir a URL /embed/... diretamente em uma aba é inválido. A orientação anterior de teste direto foi corrigida. O botão Abrir em nova aba agora usa /dashboardsv3/<id>/published, preservando o workspace e os filtros; somente o iframe utiliza /embed/dashboardsv3/<id>.

Nesta máquina foi criada uma página temporária em http://localhost:5173/dev.local/bi-preview.html com o iframe real. Ela permite testar o BI com a sessão Databricks do navegador enquanto a API Web não autentica. O arquivo está na pasta ignorada dev.local e não faz parte do build ou das rotas da aplicação. As permissões continuam sendo aplicadas pelo Databricks.

Regressões cobrem a separação de URLs, preservação de parâmetros e rejeição de URLs com credenciais. Fonte para o caminho de visualização publicada: https://docs.databricks.com/aws/en/dashboards/manage/filters.

## Validação após a correção

- O usuário respondeu “Os gráficos apareceram” ao abrir a prévia local com iframe. A autenticação dos dados foi validada pelo usuário no seu navegador, não por uma sessão automatizada com credenciais.
- O Edge do usuário ainda solicitou login; orientado a entrar na conta Databricks e recarregar a prévia.
- O teste automatizado conferiu que o iframe mantém /embed/... e Abrir em nova aba usa /dashboardsv3/<id>/published com o parâmetro o preservado.
- A prévia local respondeu 200 sem depender do login da API Web. Nenhuma alteração na autenticação ou nas permissões da aplicação.

## Acesso pela aplicação após corrigir o login AWS

Em 25/10/2026 às 23h39, o login real da Web e a restauração da sessão foram aprovados no navegador. A rota /dashboard abriu no fluxo autenticado normal e apontou o iframe para a URL fornecida. A prévia temporária deixa de ser necessária para contornar a indisponibilidade anterior da API Web; pode continuar sendo usada somente como teste local. Os gráficos do iframe foram confirmados pelo usuário no Edge.
