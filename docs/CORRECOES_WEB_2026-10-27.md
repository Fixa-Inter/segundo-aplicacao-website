# Correções e revisão da Web - 27/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), na branch `feature/integracao-ia-manu`. Base: `44f9e4b`. Responsável: Gkso31, com apoio do Codex. A revisão corrige os quatro pontos da Web encontrados na auditoria da Manu e completa traduções identificadas durante o reteste.

## Comportamento corrigido

| Ponto   | Antes                                                                                                                                 | Depois                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WEB-01  | Resposta vazia ou com espaços virava um balão sem conteúdo.                                                                           | O adaptador rejeita a resposta; a interface conserva o rascunho e exibe erro, sem repetir o envio automaticamente.                                                                     |
| WEB-02  | IDs vazios após trim, com espaços nas extremidades ou maiores que 100 caracteres podiam entrar no cache e falhar na próxima operação. | Uma validação compartilhada é usada para receber respostas, decodificar histórico, enviar, consultar, encerrar e excluir. Dados incompatíveis são recusados antes do cache/requisição. |
| WEB-03  | Voltar de Perfil para Manu durante um 503 escondia conversas que ainda estavam em memória.                                            | O carregamento inicial também usa o cache ao falhar. É possível ler a conversa e tentar atualizar novamente.                                                                           |
| WEB-04  | HTML/JSON malformado, URL inválida ou erro de rede do upload exibiam SyntaxError/TypeError.                                           | O serviço retorna mensagem de aplicação traduzível e preserva o código HTTP, a remoção, o cancelamento e a tentativa manual.                                                           |
| Idiomas | Saudação, alguns botões/estados e o aviso de envio permaneciam em português ou misturavam idiomas.                                    | Novas traduções de inglês, espanhol e chinês simplificado; o texto de erro é traduzido antes da composição com o aviso de envio. Nomes/mensagens digitados não são traduzidos.         |

Os casos de ID permitem os identificadores existentes do contrato, sem impor formato UUID novo. Somente `null` identifica a abertura de uma conversa; um ID inválido não é convertido silenciosamente em novo chat.

## Validação

- `npm run format:check`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: **124 aprovados**, sem falhas; sete novos testes de regressão dos contratos de conversa/upload.
- `npm run build`: aprovado.
- `npm run test:browser`: **25 aprovados**, sem falhas; quatro novos casos de recuperação de histórico, resposta vazia, upload e idioma.
- `git diff --check`: aprovado na revisão dos arquivos.

Os sete novos testes de contrato falharam antes da correção e passaram depois; o conjunto direcionado teve 35 testes aprovados após as mudanças. Os casos de navegador usam a Web real com serviços interceptados e dados sintéticos, sem gravar registros na AWS ou enviar arquivos ao Cloudinary real.

Uma primeira rodada paralela de navegador teve 23 aprovações e um timeout na espera de carregamento da equipe em 320px, executada junto dos demais comandos. O mesmo caso passou isoladamente. As suítes agora executam uma por vez (`--test-concurrency=1`) para reduzir competição pelo Vite/recursos, preservando os mesmos timeouts e assertions. A rodada final completa passou.

Além dos novos casos da Manu, a suíte existente conferiu equipe (edição, cancelamento, paginação, ações por toque), calendário, Home, perfil/RH, preferências, login, menus e carregamentos cancelados. Incluiu viewports móveis de 320/360/390/430px e 844x390, tema escuro e textos em inglês. O iframe do Databricks é controlado nesses testes; isso não homologa dados, permissões ou filtros reais do BI.

## Limites e pendências

As correções são da Web. A API da IA e as bases compartilhadas não foram alteradas. IA-01 a IA-05 e INT-01/INT-02 continuam dependendo do responsável pelo backend/contrato: estado de encerramento, validações de servidor, título separado e recuperação de confirmação/anexos após recarregar. O cache da página não substitui esses campos persistidos.

O [relatório original da auditoria](AUDITORIA_MANU_2026-10-27.md) e seu PDF permanecem como registro da coleta anterior. WEB-01 a WEB-04 estão corrigidos nesta revisão e cobertos por testes. Isso não representa publicação ou homologação externa da mudança.

## Evidências e registro

- [Resultados, regressões e tempo observado](evidencias/correcoes-web-2026-10-27/resumo.json).
- [Resposta inválida com rascunho preservado](evidencias/correcoes-web-2026-10-27/manu-resposta-invalida.png).
- [Histórico acessível com listagem em 503](evidencias/correcoes-web-2026-10-27/manu-cache-503.png).
- [Upload com erro compreensível no mobile](evidencias/correcoes-web-2026-10-27/manu-upload-amigavel-390.png).
- [Aviso completo em inglês](evidencias/correcoes-web-2026-10-27/manu-erro-idioma-en.png).

Início observado: **27/10/2026 às 17h31m19s** (America/Sao_Paulo). Verificação final registrada às **17h50m39s**. Estimativa inicial: **60 min**. Tempo decorrido observado até este registro: **19.3 min**, sem reconstruir tempo de atividades anteriores.

Sem novo PR, merge ou deploy, conforme a orientação anterior. A Issue permanece aberta e o status de Project não foi alterado nem presumido.
