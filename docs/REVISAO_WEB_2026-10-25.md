# Revisão da integração Web — 25/10/2026

Continuação da [Issue #11](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/11), na branch `feature/integracao-ia-manu`. Escopo: código da web, sessão/transporte, formulários e descarte, competências, calendário, preferências, configuração local, proxy/contrato da Manu e verificações do projeto. A revisão não equivale a homologação de produção.

## Problemas encontrados e corrigidos

1. **Recusa da IA encerrava uma sessão Web válida.** Após um 401 da IA, o cliente renovava o token na API Web; se a IA ainda retornasse 401, a web apagava toda a sessão. As chamadas da Manu agora preservam a sessão quando a renovação Web funciona. Um refresh realmente recusado pela API Web continua encerrando o acesso. Testes cobrem POST, finalização, preservação do histórico e expiração real.
2. **Resposta de refresh malformada deixava tokens antigos ativos.** Uma resposta sem tokens causava erro de autenticação, mas não notificava a expiração. Corpos nulos, campos ausentes, tipos incorretos e strings vazias agora são rejeitados e encerram a sessão uma única vez.
3. **Indisponibilidade temporária apagava o login ao recarregar.** A restauração agora limpa a sessão somente em rejeição de autenticação/permissão. Em erro temporário, mantém os dados da sessão e apresenta o erro sem abrir rotas privadas. Recarregar quando a API volta recupera o acesso. A rejeição também é tratada no provider, evitando Promise rejeitada sem tratamento.
4. **Eventos de vários dias desapareciam após o início.** Home, marcações e lista do calendário agora consideram todo o intervalo, incluindo viradas de mês/ano. O dia mostrado no cartão e o link da Home acompanham a data selecionada. A data original permanece nos detalhes do evento.

## Verificações automáticas

`npm run format:check`, `npm run lint`, `npm test` e `npm run build` aprovados. A suíte passou de 71 para **75 testes**, com quatro testes novos de regressão. O teste de renovação cobre várias formas de resposta inválida. Os testes automatizados usam cenários controlados, sem chamadas de criação a serviços reais.

Dois testes de sessão foram executados antes da correção e reproduziram as falhas: logout indevido após recusa persistente da IA e sessão antiga preservada após refresh sem tokens. Passaram depois da correção.

## Verificações no Edge

A execução usa API Web local real, banco compartilhado, contexto isolado e bloqueio de gravações de cadastros. Foram verificados:

- Obrigatoriedade dos três campos e login real da conta fornecida.
- Home, Equipe, Calendário, Perfil, Dashboard em espera e Manu.
- Edição das dez competências, Cancelar para continuar editando, Descartar e nova leitura com os valores originais.
- Visualização das competências sem editor individual.
- Proteção ao navegar para outra página com perfil editado.
- Rejeição de evento incompleto antes de enviá-lo.
- Preferência manual de idioma após recarregar e retorno ao idioma do navegador.
- Seis páginas em 390×844 sem transbordamento horizontal; menu mobile navega e fecha.
- Nenhum erro de JavaScript ou gravação inesperada; a sessão de revisão foi revogada ao terminar (HTTP 204).

Dois cenários foram controlados, explicitamente:

- GET de perfil retorna 503 temporário: sessão permanece armazenada, acesso privado é bloqueado, e uma nova carga com API disponível recupera o login.
- GET de eventos retorna um evento de dois dias: ele aparece no segundo dia tanto na Home quanto no calendário. Nenhum evento foi criado no banco.

O relatório detalhado está somente em `dev.local/full-web-review.json`, ignorado pelo Git. Não foram publicadas imagens com nomes ou dados pessoais. A validação real anterior do Cloudinary foi preservada; não foi repetido upload desnecessário nesta revisão. Não houve troca de senha, criação/edição/desativação de técnico ou gravação de evento no banco compartilhado.

## Pendência real de autenticação da IA

Uma mensagem curta de verificação, sem pedido de criar ou alterar registros, foi enviada ao serviço da IA pelo proxy da web com a sessão local. O serviço respondeu:

```text
HTTP 403
Usuário sem permissão de acesso.
```

A conta é reconhecida como GESTOR pela API Web local, que permite perfil/equipe/calendário. A recusa da IA não encerrou esse login; a navegação seguinte na Equipe funcionou. Não houve resposta de inferência ou confirmação de criação.

No clone consultado, essa mensagem é repassada quando a API definida em `FIXA_API_BASE_URL` recusa o GET `/api/v1/perfil` com 403. A configuração efetiva desse endereço na AWS não foi inspecionada. O responsável pela IA deve conferir qual API está consultando e a compatibilidade do token emitido pela API Web: assinatura, issuer, permissões e contrato de perfil.

Também há uma diferença a alinhar entre os contratos dos repositórios: a dependência de autenticação da IA exige `cnpjUnidade`, enquanto o DTO de perfil da API Web consultada não o retorna. Isso poderá causar outro erro mesmo após resolver o 403. Não foi presumido que a AWS já usa esses mesmos commits, e nenhum backend foi modificado nesta revisão.

## Outras dependências preservadas

- Modelo/banco da API: CEP CHAR/VARCHAR, com gestão de esquema desativada somente na execução local compartilhada. Consulte [o diagnóstico local](API_LOCAL_DEV_2026-10-25.md).
- Histórico persistente e semântica final de excluir/finalizar dependem dos contratos do autor da IA.
- Databricks depende da URL publicada e permissões de acesso.
- CI remoto, aprovação, merge, homologação e publicação seguem o fluxo da equipe. Nenhum novo PR ou deploy foi realizado.
