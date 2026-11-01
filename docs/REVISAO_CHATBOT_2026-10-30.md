# Revisão do chatbot Web — 30/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), responsável Gkso31 com apoio do Codex. Branch `feature/integracao-ia-manu`, base `3ee7d0e`. Estimativa inicial: 60 minutos.

## Correções da Web

- **Confirmação após recarregar (INT-01):** o contrato publicado agora inclui `mensagens[].confirmacao`. A Web restaura a proposta e os botões Sim/Não quando a última mensagem é uma proposta pendente. Uma confirmação antiga, seguida por mensagem do usuário, ou uma conversa salva não reativa esses botões.
- **Reconciliação do histórico:** a confirmação explícita recebida do servidor prevalece sobre o cache, inclusive para remover uma pendência já resolvida. A compatibilidade com o histórico antigo só usa o cache quando o campo está ausente.
- **Título independente (IA-05/consumidor):** o encerramento agora retorna `titulo` separado de `resumo`. A Web usa esse título imediatamente e após atualizar o histórico, sem substituí-lo por trechos descritivos do resumo. Respostas de encerramento com tipos inválidos são recusadas antes de alterar a conversa.
- **Imagens:** os links enviados e recebidos do Cloudinary respeitam o limite atual de 255 caracteres e recusam fragmentos. Uma URL que a IA rejeitaria não fica marcada como anexo pronto. A mensagem envia a URL retornada pelo upload; o Bearer da Web não vai ao Cloudinary.
- **Idiomas:** tradução da nova mensagem de erro da IA que informa que não conseguiu gerar uma resposta e preservou a mensagem.

As correções anteriores WEB-01 a WEB-04 continuam cobertas: recusa de respostas/IDs inválidos, histórico em memória durante indisponibilidade e erros de upload compreensíveis.

## Verificação real na AWS

OpenAPI consultado em `https://ia-api.fixa.solutions/openapi.json`, com confirmação dos novos campos. Código consultado no repositório da IA, `main`, SHA `37cba5afd2bb5bd71dac9e9cd907f8d8f531f59c`. A implantação não informa seu SHA; a leitura do repositório não é tratada como comprovação da revisão publicada.

| Fluxo real pela Web no Edge | Gestor | RH |
| --- | --- | --- |
| Login e leitura de histórico | 200 | 200 |
| Envio de saudação de teste | 200 | 200 |
| Novo chat: encerrar e gerar título/resumo | 200 | 200 |
| Título exibido e conversa restaurada no reload | Aprovado | Aprovado |
| Excluir pelo modal e DELETE do histórico | 200 | 200 |
| Consulta do chat excluído | 404 | 404 |

Todas as requisições observadas da IA levaram `Authorization: Bearer {token}`. Os DELETEs não enviaram corpo. Foram criadas apenas duas conversas de saudação de QA, removidas ao final. Não foram criadas solicitações, ocorrências, OS ou outros registros operacionais.

As rotas permanecem distintas: Novo chat encerra por `DELETE /api/v1/chat/sessions/{thread_id}`; a lixeira remove por `DELETE /api/v1/sessoes/conversa/{session_id}`, após confirmação.

## Testes e inspeção visual

- Formatação, lint, build e `git diff --check` aprovados.
- **142 testes de unidade/contrato aprovados**, incluindo nove novos casos. O conjunto direcionado de Manu/Cloudinary soma 44.
- **29 testes de navegador aprovados**, incluindo quatro novos casos. Conferidos confirmação após reload para RH, correção com falha e recuperação, clique duplicado em Sim, falha de encerramento sem perda do rascunho, título independente, cancelamento/falha/sucesso da exclusão e upload com envio da URL em 320px.
- As seis falhas dos primeiros oito novos casos de contrato foram reproduzidas antes da correção e passaram depois. O nono caso verifica o uploader.
- Propostas, criação por confirmação, upload e falhas de rede são controlados nos testes. Assim, verificar os botões não efetua um cadastro no ambiente compartilhado.
- Inspecionadas as capturas da proposta em 390px, histórico salvo em 1440px, erro no modal de exclusão em 390px, anexo em 320px e a tela real do RH em 390px.

A primeira execução do lint apontou `no-control-regex` na validação de links. A verificação passou após trocar a expressão por checagem dos códigos dos caracteres. No script de QA, a verificação final de leitura após exclusão usou inicialmente `status()` do Playwright em um `fetch` nativo; corrigido para a propriedade `status` e repetida apenas essa leitura: 404 para ambos os chats. Não eram falhas do produto. As execuções finais acima estão aprovadas.

## Pendências externas e limites

**INT-02 — imagens no histórico:** o esquema publicado de `MensagemHistorico` ainda não contém `imagens`; as duas rotas de histórico não devolvem URLs. O envio funciona e o cache conserva anexos durante a sessão. Para recuperar as imagens após recarregar, a IA precisa persistir e retornar `mensagens[].imagens` com as URLs, em `GET /api/v1/sessoes` e `POST /api/v1/sessoes/conversa`. Não foi criado um histórico paralelo no navegador.

O histórico ainda não possui um estado explícito de encerramento. A compatibilidade atual considera conversas com título/resumo como salvas; expor um campo de estado continua sendo uma melhoria de contrato. As conversas reais de teste foram restauradas corretamente com o contrato atual.

Este trabalho revisa a integração e as correções da Web. Não é uma repetição dos 72 casos adversariais do relatório anterior nem homologação de todas as ferramentas de criação da IA.

## Evidências e fluxo

- [Resultados e tempo medido](evidencias/manu-atualizacao-2026-10-30/resumo.json).
- [Contrato AWS sanitizado](evidencias/manu-atualizacao-2026-10-30/aws-contract.json).
- [Fluxos reais de Gestor e RH, sem tokens](evidencias/manu-atualizacao-2026-10-30/aws-web.json).
- [Proposta restaurada — 390px](evidencias/manu-atualizacao-2026-10-30/manu-proposta-restaurada-390.png).
- [Título salvo — 1440px](evidencias/manu-atualizacao-2026-10-30/manu-titulo-salvo-1440.png).
- [Falha de exclusão recuperável — 390px](evidencias/manu-atualizacao-2026-10-30/manu-exclusao-erro-390.png).
- [Anexo enviado — 320px](evidencias/manu-atualizacao-2026-10-30/manu-anexo-enviado-320.png).

Início observado: 30/10/2026 às 06h55m51s. Registro final da verificação: 30/10/2026 às 07h13m24s, America/Sao_Paulo. Tempo observado até o registro: **17.6 minutos**. Sem reconstrução de horas anteriores.

Continuação na branch de integração existente, sem novo PR, merge ou deploy. A Issue permanece aberta e o acesso/status do Project não foi presumido.
