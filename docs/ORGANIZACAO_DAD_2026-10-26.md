# Organização de componentes e serviços para DAD — 26/10/2026

As pendências de **organização M3 e M5** da validação anterior foram corrigidas no código. Componentes não importam services, os formulários usam controladores tipados e os endpoints de gestão estão separados por recurso. Os demais itens continuam discriminados na [matriz](MATRIZ_REQUISITOS.md); isso não representa aprovação integral de DAD.

## Responsabilidades

| Camada        | Responsabilidade                                                                                    | Arquivos                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Componentes   | Renderizar campos, dados, mensagens e confirmações; encaminhar interações ao controlador            | [EventForm](../src/components/EventForm/index.tsx), [TechnicianForm](../src/components/TechnicianForm/index.tsx)                                                       |
| Controladores | Estado, validação, isDirty, descarte, confirmação, salvamento e recuperação de falha parcial        | [useEventFormController](../src/hooks/useEventFormController.ts), [useTechnicianFormController](../src/hooks/useTechnicianFormController.ts)                           |
| Opções        | Loading/erro/repetição de locais, unidades e turnos; cancelamento ao mudar dependência/desmontar    | [useManagementOptions](../src/hooks/useManagementOptions.ts), [useResourceOptions](../src/hooks/useResourceOptions.ts)                                                 |
| Composição    | Montar recursos com o mesmo cliente e sessão; preservar a fachada usada pela aplicação/testes       | [apiManagement](../src/services/apiManagement.ts), [managementService](../src/services/managementService.ts)                                                           |
| Orquestração  | Combinar recursos para equipe institucional e salvamento de técnico/turno/notas, sem endpoints HTTP | [teamService](../src/services/teamService.ts)                                                                                                                          |
| Recursos HTTP | Usuários, unidades, turnos/vínculos, competências, locais, eventos e perfil                         | [services/resources](../src/services/resources)                                                                                                                        |
| Transporte    | Bearer, renovação, cancelamento e proteção de sessão; normalização de erros via try/catch           | [httpClient](../src/services/httpClient.ts)                                                                                                                            |
| Mapeamento    | Converter DTOs para entidades, sem acesso HTTP                                                      | [apiUsers](../src/utils/apiUsers.ts), [apiUnits](../src/utils/apiUnits.ts), [apiCompetencies](../src/utils/apiCompetencies.ts), [apiEvents](../src/utils/apiEvents.ts) |
| Tipos         | DTOs por recurso e contratos dos controladores/entidades                                            | [types/api](../src/types/api), [eventForm](../src/types/eventForm.ts), [technicianForm](../src/types/technicianForm.ts), [manu](../src/types/manu.ts)                  |

apiManagement passou de mais de 600 linhas com regras/HTTP misturados para **34 linhas de composição**. teamService mantém explícitas as operações que envolvem vários recursos; a divisão não promete transação atômica no frontend.

A configuração do uploader saiu da página da Manu para [cloudinaryApi](../src/services/cloudinaryApi.ts). Interfaces de autenticação, conversas e anexos foram centralizadas em types. Tipos antes exportados pelos serviços continuam reexportados por compatibilidade.

Duas funções sem consumidores que apenas lançavam mensagens de espera por API de BI foram retiradas da fachada de produção. A V1 continua usando os iframes existentes; não foi criada API de BI nem alterado seu contrato.

## Proteção das camadas

O [ESLint](../eslint.config.js) rejeita importação direta de services dentro de components e uso direto de fetch em componentes ou páginas. Uma prova dirigida confirmou os dois bloqueios e a permissão de consumir services nos hooks.

A inspeção AST encontrou zero imports de services em componentes, nenhuma chamada fetch nas views, nenhum any e nenhuma prop inline restante. Não foram adicionados catch que apenas relançam o erro: o transporte central trata HTTP/renovação, e hooks/orquestração tratam feedback e falhas parciais.

## Comportamentos preservados

- Gestor depende do escopo aplicado pelo servidor, sem consultar a listagem de unidades exclusiva do RH.
- RH identifica a instituição pela identidade real e não amplia consultas em caso de erro.
- Troca de unidade limpa o turno; respostas antigas não repõem opções de outra unidade.
- AbortSignal chega também às consultas que identificam o escopo institucional.
- O novo turno é vinculado antes de desativar o anterior.
- Cadastro parcial conserva o ID; a nova tentativa usa PATCH, sem recriar usuário, e limpa a senha inicial.
- Notas opcionais/decimais, confirmação, erros por campo e descarte foram mantidos.
- Carregamento de opções tem feedback nos quatro idiomas; não foram reintroduzidas explicações de funcionamento interno.

## Validação

| Verificação                  | Resultado                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check, lint e build   | Aprovados.                                                                                                                                                |
| npm test                     | **117 aprovados, zero falhas**, incluindo 29 testes de contrato HTTP.                                                                                     |
| Novos testes                 | Mesmo sinal ao escopo/turnos; cancelamento de locais sem expirar sessão; cancelamento do escopo RH antes de consultar turnos.                             |
| Edge                         | Edição inicial limpa, troca rápida de unidade, erro/repetição de turnos, cadastro parcial sem duplicação, erro/repetição de evento e descarte no celular. |
| Acessibilidade dirigida      | Sete estados dos formulários, inclusive erro parcial e celular, sem violações axe detectadas ou transbordamento. Não certifica WCAG integral.             |
| AWS real                     | 28 visitas a sete rotas com Gestor/RH em 1440/390; login, consultas, preferências e logout funcionaram. Sem escrita operacional real.                     |
| Pendência externa preservada | Histórico IA do RH segue 403; Gestor 200. Nenhuma mudança no backend.                                                                                     |

Gravações e falhas parciais foram testadas com respostas controladas e dados sintéticos. Não alteraram técnicos/eventos reais. No teste de rotas, os iframes foram controlados; BI autenticado não foi homologado novamente.

Capturas inspecionadas: [técnico](evidencias/organizacao-dad-2026-10-26/tecnico-desktop.png) e [evento](evidencias/organizacao-dad-2026-10-26/evento-desktop.png). O [resumo sem credenciais](evidencias/organizacao-dad-2026-10-26/resumo.json) registra métricas e limites.

## Processo

Atividade registrada antes das alterações na [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12#issuecomment-6430372237), com responsável, critérios e estimativa. Continuação na feature/integracao-ia-manu para preservar integrações ainda não promovidas. Não houve novo PR, merge, deploy ou edição de backend. Aprovação acadêmica completa e estado do Project não foram simulados.
