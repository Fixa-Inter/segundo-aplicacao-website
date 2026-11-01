# Integrações da Web

Estado documentado em 01/11/2026. A Web consome serviços existentes; não altera a implementação da API nem dos agentes de IA.

## API Web

Origem publicada: `https://web-api.fixa.solutions`. O caminho `/api/web` da Web é um proxy configurado no Vite e na Vercel. A autenticação usa CNPJ, e-mail e senha; as chamadas privadas enviam `Authorization: Bearer <JWT>`. Transporte, renovação e limpeza de sessão ficam em [httpClient](../src/services/httpClient.ts); recursos e DTOs ficam em [services/resources](../src/services/resources) e [types/api](../src/types/api).

Regras atuais: técnicos são desativados/reativados; o formulário seleciona um turno; competências são opcionais de 0 a 10 com até duas casas decimais. Cadastro, turno e notas usam operações separadas: em falha parcial, a interface conserva o ID criado para completar a operação sem duplicar o usuário. O responsável de um evento existente não pode ser alterado. Localização vem da unidade de trabalho; telefone não faz parte do contrato atual.

O backend determina autorização e unidade pelos dados autenticados. Filtrar opções ou esconder ações na interface não substitui essa autorização.

## Manu

Origem publicada: `https://ia-api.fixa.solutions`, acessada pelo proxy `/api/ia`. No desenvolvimento, `AI_PROXY_TARGET` permite trocar o destino; na Vercel ele está definido nas regras de encaminhamento. O JWT da API Web é enviado como Bearer; não há chaves de modelos no frontend.

| Operação                                            | Endpoint usado                                 |
| --------------------------------------------------- | ---------------------------------------------- |
| Histórico                                           | `GET /api/v1/sessoes`                          |
| Ler uma conversa                                    | `POST /api/v1/sessoes/conversa`                |
| Enviar mensagem                                     | `POST /api/v1/chat`, com `plataforma: "web"`   |
| Encerrar e obter título/resumo ao iniciar novo chat | `DELETE /api/v1/chat/sessions/{thread_id}`     |
| Remover conversa do histórico                       | `DELETE /api/v1/sessoes/conversa/{session_id}` |

As exclusões não enviam corpo. Remover do histórico exige confirmação na interface; não é promessa de exclusão física do documento. Títulos usam o campo de título retornado, não o texto descritivo do resumo.

O campo de emoção seleciona uma das artes da Manu. Confirmação aparece nas propostas de criação: Sim confirma, Não permite corrigir os dados. URLs das imagens, confirmação e visualizações são recuperadas do histórico. Gráficos de categorias, série temporal, histograma e boxplot usam Recharts; a Web valida contrato, limites e unidade antes de desenhar. Dados inválidos não removem o texto da resposta.

[ManuResponse](../src/components/Manu/ManuResponse/index.tsx) renderiza Markdown sem executar HTML externo. Links aceitam HTTP/HTTPS, mostram o domínio e abrem em nova aba; cartões de recomendações não têm marcadores laterais. Preços, produtos e descrições são os dados recebidos, sem conteúdo inventado pelo frontend. Imagens em Markdown viram links; anexos continuam no componente próprio.

## Cloudinary

O navegador envia o arquivo ao preset unsigned autorizado e passa somente a URL retornada para a IA. São necessárias `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` e `VITE_CLOUDINARY_FOLDER`. Credenciais de assinatura e API Secret não devem ser publicadas. A implementação atual limita anexos, valida formato/tamanho e permite remover/repetir o upload. O Bearer da FIXA não é enviado ao Cloudinary.

## Databricks

A Web chama `GET /api/v1/dashboard/embed` com Bearer e valida `instanceUrl`, `workspaceId`, `dashboardId`, `token` e `expiresIn`. O componente [AuthenticatedDashboard](../src/components/AuthenticatedDashboard/index.tsx) inicializa `DatabricksDashboard` de `@databricks/aibi-client`, mantém o token somente em memória e pede novo acesso ao backend pelo callback do SDK. Desmontar ou trocar usuário destrói a instância.

Não se envia `unidadeId` como autorização. O backend determina a unidade pelo JWT/banco e emite o acesso restrito. Filtros visuais desabilitados ou parâmetros de técnico servem à apresentação, nunca ao isolamento entre unidades. Home e desempenho individual usam os identificadores de widget documentados no `.env.example`.

Se o acesso falhar, a Web oferece nova tentativa e não carrega um iframe geral. Não é necessário depender de uma sessão pessoal previamente aberta no Databricks no modelo atual de token de embed; o workspace ainda deve permitir a origem da Web e o acesso concedido pelo serviço.

Em 01/11/2026 às 19h00 de São Paulo, o teste real de leitura registrou login 200 e embed 502 para Gestor e RH. Não foram feitas gravações de negócio nesse teste. O responsável pelo backend deve verificar a chamada ao Databricks e as permissões/configuração do serviço. A validação controlada do SDK não comprova que essa dependência externa foi resolvida.

## Publicação

A origem pública ainda não foi confirmada. Depois do deploy, validar as regras do proxy, CORS quando houver chamadas diretas e domínios aprovados no Databricks. `APP_CORS_ALLOWED_ORIGINS` pertence ao backend; seu valor deve considerar a origem exata quando aplicável. Nunca usar segredo do service principal, JWT_SECRET ou credenciais de banco como variável `VITE_*`.
