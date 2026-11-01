# Revisão de legibilidade — 01/11/2026

Issue #20. Branch `refactor/simplificar-web`, criada a partir de `origin/dev` e atualizada por fast-forward com os commits locais de loading `614b76b` e `2f9e75e`. Sem PR nesta rodada, conforme pedido. A aula solicitada ficará para outra ocasião.

## Escopo

Inventário dos arquivos escritos para a aplicação em pages, components, hooks, services, utils, types, contexts, i18n e mocks, além de testes, scripts e configuração. Imagens/fontes, dependências, lockfile, LICENSE, arquivos locais de ambiente e workflows da organização não foram reescritos. Arquivos que já eram simples foram preservados ou receberam apenas organização de imports e espaçamento.

## Organização resultante

| Parte | Onde fica |
| --- | --- |
| Montagem das páginas | `src/pages/*/index.tsx` |
| Estado e ações das páginas principais | `src/hooks/useHomePage.ts`, `useTeamPage.ts`, `useCalendarPage.ts`, `useProfilePage.ts`, `useRecoveryPage.ts` |
| Conversa, histórico e envio da Manu | `src/hooks/useManuChat.ts` |
| Anexos, upload e limpeza de previews | `src/hooks/useManuAttachments.ts` |
| Histórico, mensagens, confirmação e escrita | `src/components/Manu/` |
| Preparação dos dados dos gráficos | `src/hooks/useManuChartData.ts` |
| Desenho, boxplot e tabela dos gráficos | `src/components/ManuChart/` |
| Transporte, renovação de sessão e erros | `src/services/httpClient.ts`, `manuErrors.ts` |
| Contratos, validações e conversões | `src/types/`, `src/utils/` |

A refatoração troca nomes curtos de validações por nomes como `isDateRange`, `isCalculationBase` e `isDataPoint`; variáveis do transporte e dos gráficos ficaram mais explícitas. Mensagens de erro HTTP e descrições da recuperação usam decisões diretas, e os gráficos escolhem cada desenho por etapas. Foram separadas declarações múltiplas, removidas expressões redundantes, imports sem uso e 79 regras CSS sem referência ou vazias, além de oito declarações duplicadas. Não foram adicionados comentários ao código.

| Arquivo principal | Antes | Depois |
| --- | ---: | ---: |
| Manu | 733 | 80 |
| Gráfico da Manu | 429 | 48 |
| Home | 195 | 149 |
| Equipe | 469 | 381 |
| Calendário | 325 | 240 |
| Perfil | 321 | 215 |
| Recuperação | 370 | 266 |

As contagens acima descrevem os arquivos de composição. A lógica foi preservada e distribuída entre arquivos com responsabilidades explícitas; elas não representam funcionalidades removidas.

## Verificação

- Formatação, lint, tipos e build aprovados.
- 161 testes de unidade/contrato e 41 cenários de navegador aprovados, sem enfraquecer os asserts existentes.
- Comparação de 26 pares de capturas (52 imagens), com a versão anterior e a atual, em 1440×960 e 390×960. Nenhum pixel acima da tolerância de 12 níveis na diferença em tons de cinza. Em três capturas houve diferenças inferiores à tolerância na sombra do botão lateral. Inicialmente o ambiente isolado de comparação não carregava as fontes; a permissão local de leitura dos assets foi corrigida antes da comparação válida.
- Login, recuperação, Sobre, Home, equipe, calendário, perfil, configurações, Manu e formulários fazem parte das capturas. A suíte funcional também conferiu RH, competências, descarte, anexos, confirmação, exclusão, histórico, gráficos, falhas e a espera da Manu com histórico lento.
- APIs e regras de autenticação/escopo por unidade não foram alteradas. Foram mantidos cancelamento, verificação de sessão, tratamento de erro e validação das respostas. Nenhum registro foi gravado na AWS durante esta verificação.

[Medições e comparação](evidencias/legibilidade-2026-11-01/resumo.json). Exemplo de aparência preservada: [Manu antes](evidencias/legibilidade-2026-11-01/manu-390-antes.png) e [depois](evidencias/legibilidade-2026-11-01/manu-390-depois.png).
