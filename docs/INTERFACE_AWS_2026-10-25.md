# Interface e serviços AWS — Issue #12

## Atualização: login AWS aprovado em 25/10/2026 às 23h39

A correção do serviço publicado foi confirmada com a conta de teste autorizada. Login retornou 200, perfil 200 e turnos 200. No Edge automatizado, sem respostas controladas da API Web, foram aprovados:

- Login e carregamento da Home.
- Equipe com dois técnicos na página, informações do técnico, turnos formatados e leitura das dez competências.
- Calendário, locais e três responsáveis disponíveis no formulário de evento.
- Leitura do perfil e abertura dos três campos editáveis suportados.
- Dashboard acessível pelo fluxo normal autenticado; iframe oficial e link da visualização publicada conferidos.
- Restauração da sessão após recarregar, validando o perfil na AWS.
- Histórico da IA retornou 403, sem derrubar a sessão válida da Web; foi possível voltar à Equipe normalmente.

Nenhuma alteração de técnico, perfil, nota ou evento foi salva. A sessão de teste foi encerrada com logout 204. Não houve erros JavaScript nem tentativas inesperadas de escrita. Os gráficos autenticados do Databricks já haviam sido confirmados pelo usuário no Edge; o navegador automatizado possui sessão Databricks separada.

A pendência de autenticação da API Web foi resolvida. A IA permanece com 403 em GET /api/v1/sessoes usando o token real da AWS; seu health check responde 200. O responsável deve conferir a consulta de perfil e a configuração FIXA_API_BASE_URL da implantação da IA. A causa do 403 ainda não foi confirmada. Nenhuma modificação no backend foi feita pela web.

Os registros de HTTP 500 abaixo correspondem às verificações anteriores à correção da implantação. O código não mudou nesta verificação; a última execução dos gates da implementação teve 88 testes, formatação, lint e build aprovados.

## Implementação

- API Web padrão: https://web-api.fixa.solutions. Configuração desta máquina e exemplo atualizados. IA pelo proxy /api/ia para https://ia-api.fixa.solutions.
- Técnico: nome/e-mail em metades; nascimento/cargo/acesso em terços; notas técnicas removidas. Turnos convertem os segundos retornados pela API para horários, como Manhã · 08:00 – 12:00. Opções selecionadas se ajustam ao campo.
- Competências: opcionais de 0 a 10, com até duas casas decimais, conforme precisão do backend. Ponto e vírgula são aceitos; vazio remove avaliação, zero continua sendo uma nota. As entradas vazias continuam sem placeholder.
- Nomes exibidos limitados a 36 caracteres nos cabeçalhos, 40 na tabela e 48 no seletor de responsáveis; o valor completo continua no title e nos campos editáveis. CSS limita novamente o texto em telas pequenas.
- Informações do técnico organizadas em itens com ícone, rótulo e valor: e-mail, telefone, nascimento, localização, cargo, acesso, turnos e situação. Valores ausentes exibem Não informado, sem separadores ou CEP vazios.
- Evento: primeira linha em terços; datas inicial/final e horários inicial/final em quartos. Datas editáveis usam DD/MM/AAAA e são enviadas em ISO. Responsáveis usam nomes reais sem Meu usuário duplicado, dentro do escopo permitido pelo servidor.
- Perfil: formulário apresenta os três campos efetivamente suportados pela API. Localização é exibida como informação da unidade com explicação de quem a gerencia.
- Manu: GET /api/v1/sessoes recupera conversas persistidas e títulos; POST /api/v1/sessoes/conversa lê conversa fora do cache. Emoções das mensagens recuperadas usam as artes existentes. Erro de histórico tem tentativa novamente e não desfaz envio já concluído. Cache é limpo no logout; respostas pendentes de outra sessão são rejeitadas.

Nenhum código da API Web ou da IA foi alterado. Trabalho na branch de integração existente, sem nova PR ou publicação.

## Verificação

- Testes Node: 86 testes de contratos, validação, sessão e regressões. Formatação, lint e build verificados.
- Edge com respostas controladas conforme os contratos publicados: envio e releitura de notas 7,65 e 0, rejeição de 11, confirmação de descarte, payload de evento com datas de dois dias, responsável único, histórico após reload e recuperação de erro de listagem.
- Layout verificado em 1920, 1366, 900 e 390 pixels. As capturas abaixo usam dados controlados; não comprovam CRUD na AWS.

### Evidências visuais

- [Detalhes do técnico](evidencias/interface-aws-2026-10-25/tecnico-detalhes-desktop.png)
- [Edição do técnico](evidencias/interface-aws-2026-10-25/tecnico-edicao-desktop.png)
- [Evento](evidencias/interface-aws-2026-10-25/evento-desktop.png)
- [Perfil](evidencias/interface-aws-2026-10-25/perfil-edicao-desktop.png)
- [Técnico no celular](evidencias/interface-aws-2026-10-25/tecnico-edicao-mobile.png)
- [Evento no celular](evidencias/interface-aws-2026-10-25/evento-mobile.png)
- [Histórico da Manu](evidencias/interface-aws-2026-10-25/manu-historico-desktop.png)

## Pendências verificadas nos serviços

Em 25/10/2026 às 22h43 (São Paulo): GET /v3/api-docs da API Web respondeu 200; POST /auth/login com a conta de teste autorizada retornou **500**, com erro genérico e Access-Control-Allow-Origin: http://localhost:5173. Nenhuma senha, token ou configuração de servidor foi incluída nas evidências. É necessário consultar o log do backend para determinar a causa. A ausência de login válido impede homologar os fluxos autenticados da AWS; não foi usado fallback local ou demonstrativo.

GET https://ia-api.fixa.solutions/api/v1/health respondeu 200. A integração autenticada com a IA precisa ser repetida após o login Web funcionar.

PerfilUpdateRequest publicado contém somente nomeCompleto, email e dataNascimento. Telefone e endereço não podem ser persistidos nessa rota; a administração de unidades é restrita a ADMINISTRADOR. Para gestores editarem localização, o backend precisa fornecer leitura e atualização autorizadas do endereço da própria unidade ou ampliar o contrato de perfil. A web não habilita campos que seriam ignorados ao salvar.

O histórico da IA não inclui imagens nem confirmacao por mensagem. Esses campos precisam ser incluídos para reconstituir anexos e revisão de uma proposta pendente após reload. O contrato também não tem estado explícito de encerramento: a web considera encerrada a conversa com resumo preenchido, pois o fluxo da IA grava resumo ao encerrá-la; um campo de estado explícito eliminaria essa inferência. O histórico não cria botões de confirmação com base apenas na emoção de uma mensagem.

## Databricks: resposta sugerida à responsável

> Estou testando a web em http://localhost:5173. Pela mensagem, o dashboard já foi publicado, mas a incorporação está bloqueada no workspace. Um administrador precisa abrir Settings → Security → External access → Embed dashboards, selecionar Allow approved domains e adicionar http://localhost:5173 em Manage. Depois me envie o código de Embed dashboard ou a URL do iframe. Quando publicarmos a web, adicionaremos também o domínio definitivo dela.

No embedding básico, o visitante ainda precisa de acesso ao dashboard e login no Databricks. Domínios das APIs não substituem a origem da página React nessa configuração.

Fontes oficiais consultadas: [configuração de embedding](https://docs.databricks.com/aws/en/ai-bi/admin/embed) e [embedding básico](https://docs.databricks.com/aws/en/dashboards/share/embedding/basic).
