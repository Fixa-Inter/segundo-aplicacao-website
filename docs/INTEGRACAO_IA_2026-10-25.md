# Manu na web — contrato publicado e pendências

**Atualização em 26/10/2026:** o CORS da AWS passou nos testes, mas histórico e chat continuam com 403 para as contas autorizadas. Veja a [verificação atual e o contrato de perfil](IA_AWS_2026-10-26.md). As seções abaixo registram a integração e os resultados históricos da etapa anterior.

Atividade [web #11](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/11), branch `feature/integracao-ia-manu`. A implementação foi ajustada após o usuário esclarecer que o serviço de IA deve ser consumido sem mudanças no seu código. Novas rotas serão implementadas pelo responsável da IA.

## Escopo corrigido

O commit de compatibilidade que havia sido enviado à branch separada da IA foi integralmente desfeito por [caee852](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/commit/caee8523ba6f41fd393e9ed28098114dbd1ab37e). A árvore voltou à base anterior e a [Issue IA #46](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/issues/46) foi cancelada por estar fora do escopo. Nenhum PR, merge ou deploy da IA foi feito. Os três contêineres que haviam sido criados para essa abordagem foram parados, com volumes preservados.

A web não depende mais daquele commit, de clone da IA ou de `ia:up`. O bootstrap e o perfil Compose da IA foram retirados. O ambiente isolado da API Java continua disponível para seus próprios testes.

## Endereços e encaminhamento

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_AI_BASE_URL=/api/ia
AI_PROXY_TARGET=https://ia-api.fixa.solutions
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=
VITE_DATABRICKS_DASHBOARD_URL=
```

O nome confirmado é `ia-api`, com “ia”. O endereço informado inicialmente com `ai-api` não resolveu no DNS consultado.

O navegador chama a origem da própria web em `/api/ia/api/v1/chat`; o servidor remove `/api/ia` e encaminha a chamada ao serviço existente. O Bearer continua sendo validado pela IA. Isso resolve a conexão do navegador sem mudar o CORS do backend. O [proxy do Vite](https://vite.dev/config/server-options#server-proxy) funciona no desenvolvimento e no preview; o arquivo `vercel.json` prepara a [reescrita externa da Vercel](https://vercel.com/docs/routing/rewrites). Não houve publicação da web nesta etapa. Outro servidor de hospedagem precisa da regra equivalente antes do fallback da SPA.

As respostas do proxy usam `Cache-Control: private, no-store`. Tokens não são passados por query string. Timeout de mensagem: 120 segundos. Falhas de mensagem não são repetidas automaticamente, pois o servidor pode ter recebido uma operação antes da falha de rede.

## Contrato publicado consultado

| Rota da IA                                      | Uso pela web                                            |
| ----------------------------------------------- | ------------------------------------------------------- |
| `GET /api/v1/health`                            | Verificação de conexão                                  |
| `POST /api/v1/chat`                             | Enviar texto, thread e URLs de imagens                  |
| `DELETE /api/v1/chat/sessions/{thread_id}`      | Finalização explícita conforme contrato publicado       |
| `POST /api/v1/classificar/classificar-problema` | Existe no contrato; não é necessária para o chat da web |

O POST recebe `mensagem` (1–4000 caracteres), `thread_id` opcional e `imagens`. A resposta contém `thread_id`, `resposta`, `intencao`, `emocao` e `confirmacao`. O ID retornado pelo serviço é reutilizado nas próximas mensagens. Identidade e unidade não são enviadas no corpo pela web.

O Bearer vem da sessão da API Web: `Authorization: Bearer {token}`. Um 401 permite renovar na API de autenticação e repetir com o novo token; um 403 não é tratado como expiração. Logout limpa a memória da Manu e invalida respostas ainda pendentes de uma sessão anterior.

### Finalização e exclusão

Apesar do verbo DELETE, o OpenAPI atual chama essa operação de **Encerrar Conversa** e o código consultado gera resumo e retorna `status: ENCERRADA`, `mensagem` e `resumo`. Isso não comprova exclusão definitiva do histórico persistido. A web usa o rótulo **Finalizar conversa**, preserva as mensagens desta sessão para consulta e não chama DELETE ao clicar em Novo chat. Não foi realizado DELETE com dados reais da AWS.

A interpretação definitiva de exclusão/finalização e uma eventual rota separada de exclusão precisam ser confirmadas com o autor antes de oferecer “Excluir chat”.

## Propostas de criação

- Somente `confirmacao: "sim"` retornado pelo servidor abre a revisão. Texto comum que menciona confirmação não dispara a interface.
- A proposta usa o conteúdo real de `resposta` num cartão de revisão. Ele preserva o texto recebido; não deduz nem inventa campos de uma solicitação, OS ou ocorrência.
- **Sim** envia `mensagem: "sim"` na mesma thread. A criação continua sendo responsabilidade da IA e não é reproduzida por um segundo POST da web na API de gestão.
- **Não** apenas abre o campo de correção, sem chamada à API nem cancelamento automático. O usuário descreve a mudança e clica em Enviar correção. A mensagem pede ajustar a proposta antes da confirmação; o servidor devolve a nova proposta quando aplicável.
- Enquanto há correção aberta, o botão Sim fica desabilitado. A interface bloqueia envio duplicado e conserva o texto quando há falha.
- As respostas são texto React; HTML ou scripts na resposta não são executados.

Para reproduzir todos os campos separados do modelo visual enviado pelo usuário, o responsável pode acrescentar um objeto estruturado de proposta à resposta. Esse contrato ainda não foi fornecido; não há rota fictícia nem parser que trate conteúdo gerado como dados confirmados.

## Emoções

As 12 imagens originais do ZIP fornecido foram importadas em `src/assets/manu-emotions`. Cada resposta usa sua própria emoção ao lado do balão:

`NEUTRO`, `CURIOSO`, `PENSATIVO`, `CONFIRMACAO`, `SUCESSO`, `EMPATICO`, `ALERTA`, `ERRO`, `BLOQUEADO`, `CONSELHEIRO`, `AGUARDANDO`, `CELEBRACAO`.

Valor desconhecido usa NEUTRO. A espera por uma resposta usa AGUARDANDO. Cada imagem permanece associada à mensagem que a originou.

## Arquivos e Cloudinary

O usuário seleciona até três arquivos JPG, PNG, WEBP ou GIF, com até 5 MB por arquivo. A web mostra prévia e estado do upload; erros permitem tentar novamente ou remover a imagem. O envio da mensagem fica bloqueado enquanto há upload pendente ou falha não resolvida.

O fluxo implementado faz multipart para `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload` com arquivo, `upload_preset` e a pasta configurada em `VITE_CLOUDINARY_FOLDER`, sem Bearer da API FIXA nem API Secret. Só o `secure_url` HTTPS retornado segue em `imagens` no POST da IA. O tipo de autenticação segue o [upload de cliente do Cloudinary](https://cloudinary.com/documentation/client_side_uploading): esta implementação exige um preset unsigned autorizado. Se a equipe usar uploads assinados, falta informar a rota do backend que gera a assinatura e seu contrato.

**Configuração concluída:** após fornecer os parâmetros, o usuário autorizou cloud name, preset e pasta `solicitacoes`. Esses três valores públicos foram aplicados ao `.env.local`, ignorado pelo Git; a chave adicional informada não foi usada nem gravada na web. A implantação/outras máquinas precisam configurar suas variáveis correspondentes.

**Upload real verificado no Edge:** um PNG branco de 1 pixel (89 bytes) foi selecionado na interface, enviado sem Bearer/assinatura e armazenado na pasta `solicitacoes`. O Cloudinary retornou HTTP 200 e `secure_url` HTTPS; a URL retornou HTTP 200 e a interface mostrou Imagem pronta, sem erro JavaScript. Somente o login de acesso à interface foi controlado, pois o login AWS havia retornado 500; o upload Cloudinary não foi interceptado. Nenhuma mensagem ou imagem foi enviada à IA nesta verificação.

O provedor não retornou token de exclusão para esse upload unsigned. O único asset de teste foi preservado, e seu `public_id`/URL estão registrados em `dev.local/cloudinary-upload-check.json`, ignorado pelo Git, para eventual remoção pelo administrador. Nenhuma credencial administrativa foi usada. A validação não comprova criação de registros ou inferência da IA.

## Conversas e histórico

O OpenAPI publicado ainda não expõe GETs para recuperar conversas/mensagens. A web mantém as últimas 50 conversas desta sessão em memória, com apenas mensagens realmente recebidas da API. Elas podem ser retomadas ao navegar dentro da SPA, e são descartadas ao recarregar a página ou sair da conta. Isso está indicado na interface. Não são gravadas transcrições em localStorage/sessionStorage, e não há fallback de respostas demonstrativas.

O título inicial é a primeira mensagem. Quando a finalização retorna um título explícito no resumo, ele substitui o título inicial. Resumo sem título explícito não gera um título inventado.

### Contratos a combinar com o responsável da IA

1. **Listar conversas do usuário autenticado:** thread, título/resumo, datas e estado. Sugestão a combinar: `GET /api/v1/chat/sessions`.
2. **Recuperar uma conversa:** mensagens com papel/autoria, texto, URLs de imagens, emoção, datas e estado atual da proposta/confirmacao; incluir o resumo e seu título. Sugestão a combinar: `GET /api/v1/chat/sessions/{thread_id}`.
3. **Definir finalização versus exclusão:** confirmar o significado da rota DELETE atual e o momento de geração do resumo.
4. **Proposta estruturada, se desejada:** tipo de criação e campos/URLs efetivamente propostos pela IA. Isso permite uma revisão por campos sem extrair valores por suposição do texto.

As sugestões de GET acima não são chamadas pela versão atual da web; o usuário avisará quando as rotas reais estiverem prontas.

## Dashboard Databricks

A página está preparada para o iframe configurado por `VITE_DATABRICKS_DASHBOARD_URL`, com título acessível, altura responsiva e opção de abrir em outra aba. Não são acrescentados tokens à URL. Sem a URL, a interface mostra um estado de espera, sem gráficos ou números fictícios.

A URL ainda será fornecida pelo usuário. O [Databricks documenta o iframe de dashboards publicados](https://docs.databricks.com/aws/en/dashboards/share/embedding), as origens autorizadas e as permissões de leitura. O iframe básico pode pedir login no Databricks; a sessão FIXA não concede acesso ao BI automaticamente. Não houve validação com dashboard real, alteração de conta/plano ou autenticação de service principal.

## API Web e validação real

O login de exemplo autorizado pelo usuário foi enviado ao endpoint publicado `/auth/login` com os três campos do contrato (`email`, `senha`, `cnpj`). A API retornou **HTTP 500**, com mensagem de erro interno. O formato dos campos foi conferido no OpenAPI. Não houve autenticação real bem-sucedida nem chamada autenticada aos modelos nesta etapa; o responsável pela API precisa verificar os logs/configuração da revisão publicada.

O frontend envia a senha pelo transporte HTTPS e não reproduz bcrypt no navegador. Os segredos de banco, JWT, Redis e SMTP fornecidos no chat não foram colocados no frontend, em `.env.local`, em artefatos ou no Git. Sua rotação foi recomendada ao usuário. Não foi usado acesso direto ao banco compartilhado.

Foi confirmada a conexão real pelo proxy da web: saúde HTTP 200 e POST sem token HTTP 401, preservando a autenticação da IA. Isso comprova encaminhamento, não inferência.

## Verificação da interface

Os testes do navegador usam respostas HTTP controladas e credenciais fictícias apenas no processo de QA. Eles verificam multipart, envio somente da URL retornada, bloqueio de duplo envio, Não sem criação, correção seguida de Sim, emoções, texto seguro, finalização explícita, navegação da sessão e iframe. A execução controlada não equivale a criação ou inferência real na AWS. A verificação real de Cloudinary posterior está descrita separadamente acima.

Evidências controladas:

- [Revisão da proposta em desktop](evidencias/manu-web-2026-10-25/proposta-desktop-controlada.png)
- [Correção em celular](evidencias/manu-web-2026-10-25/correcao-mobile-controlada.png)
- [Iframe com URL e conteúdo de QA](evidencias/manu-web-2026-10-25/dashboard-iframe-controlado.png)

Execução final: **71 testes aprovados**, `format:check`, `lint` e `build` aprovados. Edge: desktop 1440×960 e celular 390×844, sem erro JavaScript nem transbordamento horizontal. A revisão no celular foi ajustada para reservar o espaço ao cartão e ao campo de correção. Os detalhes da execução são registrados na Issue #11. Aprovação, merge, deploy e vínculo ao GitHub Projects não são presumidos. O escopo desta continuação é somente a web.


## Atualização: API Web local com a dev atual

A web passou a usar `http://localhost:8080`, compilado do commit `9516609` da API Web, com o banco compartilhado fornecido pelo usuário. Login real e leitura de perfil/equipe/calendário passaram. Somente o modo local de execução desativa gestão automática do esquema (`none`) devido à divergência CEP CHAR/VARCHAR encontrada na inicialização. A IA segue na AWS; a integração autenticada entre os dois serviços não foi presumida. Consulte [configuração, validação real e retorno à AWS](API_LOCAL_DEV_2026-10-25.md).

## Revisão posterior: autenticação real da IA

Com login GESTOR válido na API Web local, uma mensagem simples ao serviço da IA retornou HTTP 403, “Usuário sem permissão de acesso”. O responsável deve conferir a API de perfil configurada em `FIXA_API_BASE_URL`, aceitação do token Web e o campo `cnpjUnidade` exigido pela IA. A recusa do chat preserva a sessão Web válida; falha de renovação da própria API Web continua encerrando o acesso. Consulte [correções, evidências e limites da revisão](REVISAO_WEB_2026-10-25.md).