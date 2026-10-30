# Manu: validação da correção publicada na AWS

> Fluxo atualizado posteriormente: [Novo chat com encerramento e lixeira com confirmação](MANU_SESSOES_2026-10-26.md).

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), em 26/10/2026, após o usuário informar uma nova publicação da IA. Nenhum código, branch ou ambiente do backend da IA foi alterado pela Web.

## Conexão e contrato

A Web já usa o serviço publicado: VITE_AI_BASE_URL=/api/ia e AI_PROXY_TARGET=https://ia-api.fixa.solutions no desenvolvimento. A Vercel encaminha o mesmo prefixo para esse endereço. Não há versão da IA embarcada no frontend para baixar ou atualizar.

O OpenAPI da AWS consultado às 13h03 continua com as mesmas operações de chat, histórico, leitura específica e encerramento. A versão declarada permanece 0.1.0; esse número não identifica a revisão implantada. A [correção 5d21051 na dev da IA](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/commit/5d21051196e9fb49debedf99c796625a93d8656d), consultada somente em leitura, trata a extração textual do resumo e evita embedding vazio. A revisão exata na AWS não é exposta no contrato e não foi presumida.

## Teste real

O navegador acessou a Web em localhost:5173 e as APIs publicadas, usando a conta Gestor de teste autorizada. Somente uma conversa nova de teste foi criada e encerrada; nenhuma conversa anterior ou registro operacional foi alterado. O DELETE real não foi repetido.

| Operação                      | Resultado                                                         |
| ----------------------------- | ----------------------------------------------------------------- |
| Login Web                     | 200                                                               |
| Histórico IA                  | 200                                                               |
| Mensagem IA                   | 200, resposta recebida, sem confirmação de criação                |
| Encerramento da conversa nova | 200, status ENCERRADA, mesmo thread_id e resumo textual não vazio |
| Interface após o encerramento | Conversa finalizada, duas mensagens preservadas, sem alerta       |
| Leitura da conversa encerrada | 200, título preenchido e corpo do resumo vazio                    |
| Logout                        | 204                                                               |

O DELETE foi enviado com Authorization: Bearer do login Web, sem corpo, para /api/v1/chat/sessions/{thread_id}. A chamada chegou à AWS pelo proxy existente.

## Ajuste de compatibilidade na Web

O [formatador de histórico da IA](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/blob/dev/app/services/sessoes/historico.py) extrai a primeira linha do resumo em titulo e devolve somente as linhas seguintes em resumo. Portanto, um resumo de uma linha resulta em titulo preenchido e resumo vazio. A leitura real reproduziu esse formato tanto na listagem quanto na consulta específica.

A Web considerava encerrada somente a conversa com resumo preenchido. O adaptador agora reconhece titulo ou resumo retornados pelo servidor como evidência de encerramento nesse contrato. O título de apresentação gerado localmente a partir da primeira mensagem não é usado nessa decisão. Conversas sem título e sem resumo continuam abertas.

O teste de regressão cobre listagem, leitura específica, preservação das mensagens e bloqueio de envio na conversa encerrada. A conferência real posterior usa apenas leituras da mesma conversa criada pelo teste e verifica que o estado encerrado permanece após recarregar a página.

Novo chat continua iniciando outra conversa sem encerrar automaticamente a anterior; esta mudança de fluxo não faz parte da atualização pedida.

## Evidências e limites

Relatórios locais ignorados pelo Git: dev.local/manu-aws-retest-contract.json, manu-aws-retest.json, manu-aws-retest-state.json e manu-aws-reload.json, além dos screenshots manu-aws-retest.png e manu-aws-reload.png. O primeiro teste detectou a incompatibilidade após recarregar; a evidência posterior registra o resultado com o adaptador corrigido. Não foram armazenados tokens ou senhas nesses relatórios.

Validações locais aprovadas: formatação, lint, 103 testes e build, além da conferência real no navegador após o ajuste. Esta verificação cobre chat, histórico e encerramento com a conta Gestor. Não equivale a validar todas as ferramentas de criação da IA, outros perfis ou revisões futuras do contrato.

Sem novo PR, merge, promoção ou deploy da Web nesta atividade. A correção observada na AWS remove o 500 que motivou a verificação anterior.
