# BI por unidade: preparação e dependências - 27/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), na branch `feature/integracao-ia-manu`, base `dabce7b`. Responsável: Gkso31, com apoio do Codex.

**Estado: preparação validada; filtro ainda não integrado às telas.** A identificação da unidade e a construção de URLs estão prontas. Home, Dashboard e desempenho do técnico ainda não consomem esse novo serviço. Nenhum isolamento por unidade é declarado como concluído. A sessão Databricks de QA expirou, portanto o novo dashboard não foi homologado ao vivo.

## Requisito atualizado pelo usuário

Instituição é a organização/marca; unidade é um estabelecimento dessa instituição. Para o BI, tanto Gestor quanto RH devem visualizar somente a unidade à qual pertencem. Isso não altera a regra da tela Equipe do RH, que continua consultando gestores/técnicos de sua instituição.

O usuário confirmou que o BI tem `unidade_id` na pipeline, mas a restrição ao exemplo de unidade 11 foi feita **apenas pelo filtro visual**. A correspondência entre o rótulo `Unidade N` e o ID N da API foi considerada provável pelo usuário, sem confirmação; ela não foi assumida como contrato válido.

## Parâmetros recebidos

Os três envios contêm a mesma URL publicada, com os três filtros abaixo. Isso fornece as chaves e a codificação usadas pela publicação, mas não comprova cobertura de todas as fontes/widgets.

| Chave                  | Valor lógico do exemplo | Codificação                                                          |
| ---------------------- | ----------------------- | -------------------------------------------------------------------- |
| `f_4c5527fc~unidade1`  | `Unidade 11`            | URLSearchParams comum.                                               |
| `f_38ad7c54~unidade`   | `Unidade 11`            | URLSearchParams comum.                                               |
| `f_37645ca6~unidade.s` | `Unidade 11`            | String tipada: encodeURIComponent do valor e depois URLSearchParams. |

Não foi inventado um parâmetro `unidadeId=...` nem uma opção `hideFilters=true` para o iframe básico. Os testes do construtor usam `Unidade 7` como valor sintético de codificação, sem afirmar que esse rótulo pertence à conta real de ID 7.

## Trabalho preparado na Web

- `src/services/dashboardScopeService.ts`: identifica a unidade usando respostas autenticadas da API Web, sem ler uma instituição ou escolher a primeira unidade disponível. Exige correspondência com o perfil da sessão e verifica cancelamento/troca de conta entre as leituras.
- RH: consulta `/api/v1/perfil`, usa seu ID para consultar `/api/v1/usuarios/{id}` e lê `unidadeId` da própria identidade.
- Gestor: a API publicada retorna 403 para consulta de usuários/unidades nesse caminho. Usa `/api/v1/perfil` e `/api/v1/turnos` sem parâmetro de unidade. A API restringe essa listagem à unidade do gestor autenticado, conforme o código de TurnoService. Só aceita resultado não vazio em que todos os registros tenham o mesmo ID positivo de unidade. Resultado vazio, inválido ou misto é recusado; não há fallback para escopo geral.
- O serviço novo foi testado realmente na AWS: login e consulta aprovados; Gestor resolveu unidade **7** e RH unidade **1**. Nenhum registro operacional foi gravado.
- `dashboardUnitSelectionURL` em `src/utils/dashboardEmbed.ts`: aplica a combinação de filtros recebida, substitui valores/variantes antigos, valida a URL e preserva filtros de técnico e workspace. Configuração/seleção inválida retorna null, sem URL geral como alternativa.

Limite do caminho do Gestor: uma unidade ainda sem turnos não pode ser identificada dessa forma. O contrato preferível da API é devolver a unidade autenticada diretamente em `/api/v1/perfil` ou em uma rota de contexto da própria conta, sem depender de cadastros operacionais. Não houve mudança no backend.

## Por que não é possível garantir o bloqueio somente com esses parâmetros

No iframe básico, o visualizador usa as credenciais/permissões do Databricks. O login na FIXA não substitui essa identidade. Os filtros globais e os valores na URL são seleções editáveis da visualização; esconder um botão não revoga permissões sobre os dados.

Com o cenário confirmado pelo usuário, retirar ou trocar os filtros pode voltar a consultar outros registros. O campo `unidade_id` na pipeline torna o filtro possível, mas não impõe sozinho uma regra de autorização. Não foi aplicada uma seleção textual sem correspondência confirmada nem declarado um bloqueio que o cliente poderia remover.

## Requisitos concretos para BI e API

1. **Correspondência:** fornecer uma URL publicada com filtro numérico em `unidade_id`, ou confirmar formalmente como o ID da API vira o valor textual aceito. A API tem, por exemplo, ID 1 com nome `Unidade Escolar Centro`, diferente do padrão textual recebido.
2. **Autorização:** o servidor/Databricks deve determinar a unidade permitida pela identidade autenticada. A unidade usada para autorizar a consulta não pode ser um valor livre enviado pelo navegador.
3. **Cobertura:** aplicar a restrição a todos os datasets antes de agregação, incluindo todas as páginas, Home, desempenho individual e eventual exportação. Um widget que ignora o filtro não pode apresentar dados gerais.
4. **Opção documentada:** incorporação externa com token emitido no servidor e limitado ao usuário/unidade. Os datasets usam o contexto assinado, por exemplo `unidade_id = CAST(__aibi_external_value AS BIGINT)`. Credenciais de service principal ficam no servidor; não em `VITE_*`, no repositório ou na URL.
5. **Alternativa:** identidades/permissões adequadas no próprio Databricks com regras de acesso por linha. Se todos usarem a mesma conta de BI, uma regra baseada somente nessa conta não distingue os usuários FIXA.
6. **Reteste:** remover a seleção, trocar unidade na URL, abrir outra página/widget e exportar dados não podem retornar outra unidade. É preciso validar com pelo menos duas contas de unidades diferentes.
7. **Depois disso na Web:** montar os três iframes somente após resolver a unidade; aplicar os filtros nas URLs e nos links publicados, preservar o filtro do técnico, usar controles suportados para apresentação e evitar qualquer fallback geral em erro/configuração ausente.

Uma seleção automática pode ser implementada como apresentação, mas não satisfaz o requisito de o usuário não conseguir retirar o isolamento. A integração às telas aguarda a correspondência e o contrato de autorização.

## Validação e evidências

- Formatação, lint, **133 testes** e build aprovados.
- Nove testes novos: sete de resolução/isolamento de estado da conta e dois de URLs/codificação; 15 testes direcionados passaram.
- Verificações reais de consulta de unidade estão em [own-unit-scope-live.json](evidencias/bi-unidade-2026-10-27/own-unit-scope-live.json), sem tokens ou credenciais.
- [Resumo, códigos, limites e tempo observado](evidencias/bi-unidade-2026-10-27/resumo.json).
- Sem alteração de interface nesta preparação; sem nova rodada de navegador declarada como homologação do BI. A tentativa de usar o perfil de QA encontrou login Databricks expirado.
- Sem alterações no BI, API, permissões ou dados compartilhados; sem novo PR, merge ou deploy. A Issue/Project não foram marcados como concluídos.

## Fontes

- [Filtros globais, escopos e URLs no Databricks](https://docs.databricks.com/aws/en/dashboards/manage/filters).
- [Iframe básico e identidade Databricks](https://docs.databricks.com/aws/en/dashboards/share/embedding/basic).
- [Incorporação externa e contexto de dados autorizado por usuário](https://docs.databricks.com/aws/en/dashboards/share/embedding/external-embed).
- [Escopo autenticado dos turnos na API Web](https://github.com/Fixa-Inter/segundo-api-web/blob/dev/src/main/java/com/exemplo/website/service/TurnoService.java).

Início observado: 27/10/2026 21h48m27s; registro: 27/10/2026 22h11m32s, America/Sao_Paulo. Estimativa inicial: 90 min. Tempo decorrido observado: 23.1 min, sem reconstruir atividades anteriores.
