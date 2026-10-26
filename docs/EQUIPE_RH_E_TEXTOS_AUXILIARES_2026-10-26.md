# Equipe do RH e textos auxiliares — 26/10/2026

Continuação da Issue #12 na branch feature/integracao-ia-manu.

## Abas da Equipe

A lista do RH antes misturava gestores e técnicos. Agora há duas abas, na ordem Gestores e Técnicos, com Gestores selecionada inicialmente. Cada aba aplica o perfil correspondente antes da busca, filtros e paginação; ao trocar, a página volta para 1. Busca, unidade e situação permanecem compartilhadas entre as abas. O filtro de tipo de acesso foi removido por repetir a seleção das abas.

Gestores mostra Nome, Unidade e Ações, preservando a situação abaixo do nome e a visualização de detalhes. Turno e especialidade aparecem somente na lista de Técnicos, assim como adicionar, editar e desativar técnico. A conta de gestor mantém sua visão única de Técnicos.

As abas usam tablist, tab, tabpanel, aria-selected, aria-controls e foco móvel entre botões. Setas, Home e End trocam a seleção. O retorno dos detalhes preserva a aba e restaura o foco. A grade foi limitada ao espaço disponível para preservar margens no celular; o botão Filtrar pode ocupar a linha seguinte em telas estreitas.

Não houve alteração no contrato da API ou no escopo por instituição/unidade.

## Textos auxiliares

Retirados nove parágrafos fixos: explicação da localização no perfil; instrução de credenciais no login; persistência de preferências em configurações; regras operacionais abaixo do evento; regra fixa de senha inicial no técnico; atalho Enter/Shift+Enter na Manu; e três notas da recuperação de senha sobre tamanho da senha, envio de código e etapa de validação.

A referência acessível da senha inicial passa a apontar somente para seu erro, quando houver. A ajuda de competências já invisível para leitores visuais permanece disponível aos leitores de tela. Dados, rótulos, regras de validação, confirmações, mensagens de erro, carregamento e resultados de operações continuam presentes.

Os estados sem configuração do dashboard na Home e na tela Dashboard agora dizem “O dashboard ainda não está disponível.”, sem explicar integração ou publicação interna. Incluídas traduções para inglês, espanhol e chinês.

## Verificação

- Formatação, lint, 114 testes existentes, build e diff --check aprovados.
- Edge com dados controlados: seis gestores e seis técnicos em duas unidades da mesma instituição. Verificados ordem, seleção inicial, isolamento de perfis, colunas, ações disponíveis, duas páginas em cada aba, retorno à primeira página, busca, filtros de unidade/situação, limpeza de filtros e estado vazio contextual.
- Verificados teclado das abas, associação ao painel, detalhes do gestor com retorno/foco e edição do técnico. A conta de gestor manteve a listagem única de técnicos. Layout em 1440, 390 e 320 pixels, incluindo margens de busca, abas e lista.
- Conta RH autorizada contra a API Web da AWS: login 200; três gestores na aba inicial e quatro técnicos na primeira página da outra aba; nenhum erro JavaScript/HTTP; conferência móvel; logout 204. Somente leituras operacionais.
- Limpeza de notas: perfil, configurações, eventos, cadastro de técnico e Manu em 1440 e 390 pixels, além de login e etapas de recuperação. Campos obrigatórios e erros de senha curta continuam aparecendo; Shift+Enter ainda insere nova linha.
- O teste de recuperação interceptou duas chamadas de envio/reenviar código. Nenhum e-mail real, senha ou cadastro foi alterado. O primeiro stub de histórico da Manu usava um array simples; ele foi corrigido no QA para o envelope SEM_DADOS/conversas, e a conferência final não apresentou alertas. A API real da IA não foi revalidada nesta atividade.

Evidências locais ignoradas pelo Git: dev.local/team-tabs-browser.json, team-tabs-live.json, aux-texts-browser.json, aux-texts-manu-final.json, capturas team-tabs-*, aux-texts-* e logs team-aux-final-*.

Sem novo PR, merge, promoção ou deploy, conforme orientação do usuário. A Issue #12 segue aberta para a integração geral; a pendência anterior de acesso ao Project permanece registrada.
