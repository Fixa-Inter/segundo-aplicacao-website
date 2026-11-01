# Perfil e gráficos individuais — 26/10/2026

Continuação da Issue #12 na branch feature/integracao-ia-manu, conforme pedido do usuário.

## Perfil

Na edição, Nome, E-mail e Data de nascimento ocupam três colunas iguais no desktop. Após o ajuste solicitado às 17h16, a visualização mostra Localização, E-mail e Data de nascimento nessa mesma disposição; o nome aparece somente no cabeçalho de identidade. A localização mantém o vínculo de leitura com a unidade.

Em tablets a grade usa duas colunas e em celulares uma. A grade principal usa uma coluna com mínimo zero para que nomes e e-mails longos não alarguem o conteúdo e não encostem na margem direita do celular. Não houve alteração no payload, nas validações, no modal de salvar ou na proteção de alterações pendentes.

## Gráficos individuais

Retirado o link Abrir no Databricks da Home e do componente de desempenho do técnico. O espaço do rodapé na Home passa a ficar disponível para o iframe. Mantidos o atalho interno para o dashboard completo, o calendário e os estados de carregamento/configuração ausente.

As URLs de incorporação não foram alteradas. Os identificadores dos widgets e a filtragem pelo nome completo do técnico continuam iguais; não foi usado um gráfico geral como substituto de um filtro individual.

## Pendência: abas e controles internos do Databricks

A incorporação básica documentada de um widget usa fullscreenWidget. Essa configuração já é usada pelo projeto e, nas capturas fornecidas pelo usuário, ainda mostra as abas, o botão Exit fullscreen e a marca do provedor.

Foram consultadas as opções oficiais de incorporação e as declarações públicas do SDK @databricks/aibi-client 1.2.1. Não foi encontrada opção para ocultar as abas ou o botão de saída de fullscreen no iframe básico. O SDK declara hideDatabricksLogo e globalFilterVisibility; hideRefreshButton está marcado como indisponível/depreciado. Não foi instalado esse SDK, criada integração de tokens ou alterado o modo de autenticação para uma mudança que não resolve as abas.

Fontes consultadas em 26/10/2026:

- [Incorporação básica e widget individual](https://docs.databricks.com/aws/en/dashboards/share/embedding/basic#embed-a-single-widget).
- [Opções da incorporação para usuários externos](https://docs.databricks.com/aws/en/dashboards/share/embedding/external-embed#configuration-options).
- [Tipos públicos do SDK 1.2.1](https://cdn.jsdelivr.net/npm/@databricks/aibi-client@1.2.1/dist/DatabricksDashboard.d.ts).

O teste com o perfil dedicado de QA pediu novo login no Databricks em ambos os widgets; não houve nova validação de dados/renderização autenticada do provedor nesta sessão. Os testes controlados de layout não comprovam remoção de controles internos. A retirada das abas não está entregue e precisa ser alinhada com BI/Databricks para uma forma de apresentação suportada. Não foi aplicado recorte visual do iframe, alteração de DOM externo ou publicação de dashboard.

## Verificação

- Formatação, lint, 114 testes existentes, build e diff --check aprovados.
- Navegador Edge: edição e visualização em 1920, 1440, 800 e 390 pixels, com API e iframe controlados. Confirmadas larguras iguais e alinhamento das três colunas no desktop; uma coluna e margens preservadas no celular. Nome, e-mail e data carregaram com os valores esperados.
- Home: link externo ausente, atalho para a tela de dashboard mantido e widget correto no iframe.
- Técnico: link externo ausente, widget correto e filtro pelo nome completo preservado.
- Nenhum erro JavaScript ou requisição inesperada nos cenários controlados; nenhuma escrita em usuários, eventos ou dashboards reais.

Evidências locais ignoradas pelo Git: dev.local/profile-bi-browser.json, profile-bi-live.json, capturas profile-bi-view-*, profile-bi-edit-*, profile-bi-home-1440.png, profile-bi-technician-1440.png e logs profile-bi-*.log.

Sem novo PR, merge, promoção ou deploy nesta atividade, conforme orientação do usuário. A Issue #12 continua aberta e a pendência de acesso ao Project permanece conforme registros anteriores.
