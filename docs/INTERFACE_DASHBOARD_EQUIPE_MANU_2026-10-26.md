# Dashboard, unidade de trabalho e apresentação da Manu

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), em 26/10/2026. O usuário esclareceu que localização significa unidade/local de trabalho, não endereço pessoal.

## Dashboard

Removido o texto sobre permissões do Databricks. O link Abrir em nova aba usa a área de ação do cabeçalho, alinhado ao título. A antiga linha da barra foi removida, aproximando o iframe. URL publicada, permissões e comportamento do iframe permanecem os existentes.

## Unidade de trabalho

RH (papel ADMINISTRADOR na API) pode selecionar uma unidade da instituição ao criar/editar o técnico. Gestor vê o vínculo sem poder alterá-lo. A leitura de unidades não é chamada pelo perfil Gestor, pois o controlador atual exige ADMINISTRADOR em todas as suas rotas, inclusive GET por ID.

Ao trocar unidade, o turno é limpo e são carregados os turnos da unidade escolhida. O formulário mostra os dados de localização herdados dessa unidade em leitura. O serviço verifica a instituição de origem e destino, unidade ativa e turno correspondente; envia unidadeId ao PATCH de usuário somente quando há mudança. Vincula o turno novo antes de desativar o anterior. Se houver falha após gravar o usuário, mantém o mecanismo de salvamento parcial com o ID e permite concluir sem criar outro técnico.

Na ficha, a localização mostra o endereço disponível ou o nome da unidade. Quando o Gestor não recebe esses dados, identifica a unidade pelo CNPJ autenticado em vez de apresentar um endereço inventado ou Não informado. O formulário desse perfil exibe o vínculo em leitura. Isso não libera a leitura do endereço completo pelo Gestor no servidor.

Referências consultadas em leitura: [UsuarioUpdateRequest](https://github.com/Fixa-Inter/segundo-api-web/blob/dev/src/main/java/com/exemplo/website/dto/usuario/UsuarioUpdateRequest.java), [UnidadeController](https://github.com/Fixa-Inter/segundo-api-web/blob/dev/src/main/java/com/exemplo/website/controller/UnidadeController.java) e [TurnoUsuarioService](https://github.com/Fixa-Inter/segundo-api-web/blob/dev/src/main/java/com/exemplo/website/service/TurnoUsuarioService.java).

## Manu

- Checks removidos das linhas e do estado salvo.
- Uma bolinha identifica somente a conversa atual ainda em andamento, sem resumo de encerramento. Não é uma marcação de notificação não lida. Ao salvar/encerrar, ela desaparece; conversas antigas salvas ficam sem ícone.
- Cabeçalho usa Conversa salva no histórico. Em telas pequenas, o estado fica abaixo do título para evitar sobreposição.
- Títulos curtos retornados pela API e títulos explícitos em JSON/campo titulo ou marcador Título são aproveitados. Uma primeira linha com mais de 80 caracteres, mais de 12 palavras ou várias linhas é tratada como descrição; usa-se provisoriamente a primeira mensagem, limitada a 80 caracteres. Isso não gera um título novo por IA nem transforma um texto descritivo em título real.

O [gerador de resumo atual](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/blob/dev/app/memory/persistencia/gerar_resumo.py) pede somente resumo factual, sem exigir título. O [formatador de histórico](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/blob/dev/app/services/sessoes/historico.py) põe a primeira linha em titulo e o restante em resumo. Portanto, a Web já recebia o campo titulo, mas seu conteúdo podia ser um parágrafo. A leitura real da AWS confirmou esse caso; a Web passou a usar o início da conversa como alternativa curta.

O estado encerrado continua baseado nos campos originais recebidos do servidor, sem inferir encerramento pelo título de apresentação gerado localmente. Novo chat, confirmação de remoção, Bearer e ausência de corpo dos DELETEs permanecem conforme o contrato já validado.

## Pendências para os responsáveis pelas APIs

1. **API Web — telefone:** o OpenAPI publicado em /v3/api-docs, consultado às 14h45, não contém telefone em UsuarioRequest, UsuarioUpdateRequest, UsuarioResponse ou PerfilUpdateRequest; a entidade Usuario da dev também não possui o campo. Para habilitar edição real, adicionar telefone opcional no armazenamento, leitura/cadastro/atualização de usuário e definir como limpar o valor. Não foi criado um input editável que simulasse persistência.
2. **IA — título separado:** gerar uma primeira linha curta com o título e as linhas seguintes com o resumo, compatível com o histórico atual, ou publicar campos estruturados titulo/resumo devidamente persistidos. Sem isso, a Web só pode usar uma alternativa curta; não há título real separado para recuperar nos registros antigos.
3. **API Web — endereço da unidade para Gestor:** se o produto deve mostrar nome/endereço completos a esse perfil, permitir leitura da própria unidade com escopo verificado pelo servidor ou devolver esses dados no perfil/usuário. Hoje o vínculo é identificável pelo CNPJ, mas as rotas de unidades são exclusivas do administrador.

Nenhum código ou ambiente das APIs foi alterado nesta atividade.

## Validação e evidências

Formatação, lint, 113 testes e build aprovados. Regressões cobrem seleção de unidades por instituição, impedimento de mudança pelo Gestor, transferência com turno correspondente, endereço herdado, exclusão do turno antigo só após vincular o novo e recuperação de transferência parcial sem duplicar usuário. Testes da Manu cobrem título real curto/estruturado, alternativa para descrição longa e preservação do estado salvo.

QA controlado no navegador: cabeçalho do Dashboard alinhado e iframe mais próximo; troca de unidade, limpeza do turno, endereço em leitura, confirmação e PATCH com unidadeId correto; localização herdada após salvar; 390 px sem overflow. Na Manu: uma bolinha só na conversa atual aberta, nenhuma em conversa salva, ausência de checks, texto salvo atualizado e regressão dos fluxos de Novo chat/exclusão. O conteúdo do iframe nesse QA é controlado e não comprova consulta de dados BI.

Leitura real das APIs AWS com contas Gestor/RH autorizadas: login 200, formulário Gestor em leitura, RH com três unidades disponíveis e vínculo inicial preenchido, histórico IA 200, cabeçalho curto em conversa com titulo descritivo e estado Conversa salva no histórico. Logout 204 em ambas, sem erros JavaScript. Nenhum funcionário ou conversa real foi alterado para validar esta interface; a transferência foi testada com respostas controladas.

Relatórios locais ignorados pelo Git: dev.local/contact-contract-probe.json, ui-contact-browser.json, ui-contact-aws-read.json, manu-dot-browser.json, logs ui-contact-*.log e screenshots correspondentes. Sem tokens/senhas nos relatórios. Sem novo PR, merge ou deploy; telefone e título gerado separado permanecem dependências externas explícitas.
