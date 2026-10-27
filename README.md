# FIXA Web

Frontend de gestão de manutenção em React 19, TypeScript e Vite. Repositório: [segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).

## Validação atual

A [validação de DAD de 26/10/2026](docs/VALIDACAO_DAD_2026-10-26.md) registra 114 testes aprovados, 72 cenários de acessibilidade automatizada sem violações detectadas após correções e 28 visitas com API Web real. Consulte a [matriz atual](docs/MATRIZ_REQUISITOS.md) e o [roteiro de apresentação](docs/ROTEIRO_DAD.md). Há pendências; esses resultados não certificam WCAG integral nem todos os critérios de DAD.

**URL pública da Web: não confirmada.** O teste atual usa http://localhost:5173. Em 27/10, a [conferência da Manu na AWS](docs/IA_AWS_2026-10-27.md) aprovou histórico, chat e encerramento para Gestor e RH (200), sem reproduzir o antigo 403. Os iframes Databricks têm autenticação própria. Os registros datados abaixo preservam resultados históricos.

A [reorganização de componentes e serviços](docs/ORGANIZACAO_DAD_2026-10-26.md) corrigiu as pendências de estrutura M3/M5: formulários com hooks de controle, adaptadores por recurso, DTOs em types e regras de lint para as camadas. A versão reorganizada passou em 117 testes, lint, formatação, build e QA dirigido.

## Executar

Use Node.js 24 e um servidor da [API Web FIXA](https://github.com/Fixa-Inter/segundo-api-web) em execução.

```bash
npm ci
```

Copie `.env.example` para `.env.local` e informe a URL **do servidor**, sem `/api/v1` no final:

```dotenv
VITE_API_BASE_URL=https://web-api.fixa.solutions
```

O endereço acima é a API Web publicada na AWS. Para testes locais, use `http://localhost:8080`. O link do repositório GitHub não é o endereço de execução da API. Reinicie o Vite depois de alterar a configuração.

```bash
npm run dev
```

Entre com CNPJ numérico, e-mail institucional e senha de uma conta real de gestor/administrador cadastrada na API. O acesso demonstrativo e o código fixo `123456` não funcionam nos serviços reais. Sem URL configurada, a web informa a configuração necessária; não substitui uma falha da API por dados fictícios.

O servidor precisa permitir a origem da web em `app.cors.allowed-origins`. O contrato consultado permite `http://localhost:5173` por padrão; confira a porta exibida pelo Vite. Em produção, configure a origem HTTPS da web no backend e `VITE_API_BASE_URL` no ambiente de build da hospedagem. Variáveis `VITE_*` são públicas: não coloque senhas de banco, chaves JWT ou credenciais de SMTP nelas.

O servidor de desenvolvimento usa a porta **5173** e encerra com uma mensagem se ela estiver ocupada, em vez de mudar para 5174 e perder a origem permitida pela API. Nesse caso, use a instância já aberta ou encerre-a no terminal antes de iniciar outra. O idioma segue a ordem de `navigator.languages`, com português como alternativa quando nenhum idioma disponível for suportado. Uma escolha explícita nas Configurações prevalece. Na migração das preferências antigas, um idioma diferente do antigo padrão português é preservado como escolha manual; o antigo padrão passa a seguir o navegador. O tema é preservado; não há seletor adicional no login.

Os comandos chamam as ferramentas diretamente pelo Node para funcionar também em caminhos Windows com `&`, como `OneDrive - Instituto J&F`.

## Executar a API localmente

Com Docker Desktop em execução:

```bash
npm run local:up
npm run dev -- --port 5173 --strictPort
```

Esse comando usa PostgreSQL, Redis, e-mail local e uma conta exclusiva da máquina. Para executar a API local com uma conta já cadastrada no banco compartilhado da equipe, use:

```bash
npm run local:shared
```

O segundo modo exige `dev.local/api-shared.env`, ignorado pelo Git, com as credenciais de servidor autorizadas. Ele desativa a gestão automática de esquema (`none`) e não executa o seed; edições feitas pela aplicação persistem no banco compartilhado. Redis e e-mail continuam locais. Consulte [dev/README.md](dev/README.md).

## Configurar a API Web e a Manu

Em `.env.local`, use a API Web publicada e o encaminhamento da própria web para a IA publicada:

```dotenv
VITE_API_BASE_URL=https://web-api.fixa.solutions
VITE_AI_BASE_URL=/api/ia
AI_PROXY_TARGET=https://ia-api.fixa.solutions
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=
VITE_DATABRICKS_DASHBOARD_URL=https://dbc-7dc0a7b3-a574.cloud.databricks.com/embed/dashboardsv3/01f1d0be95ef1d86b90737aa9639b671?o=7474651714950692
VITE_DATABRICKS_HOME_WIDGET=a5185eb0~solicitacoes-por-periodo
VITE_DATABRICKS_TECHNICIAN_WIDGET=37645ca6~os-criadas-por-periodo
VITE_DATABRICKS_TECHNICIAN_FILTER=f_37645ca6~tecnico1.s
```

Para testar a API local, altere somente `VITE_API_BASE_URL` para `http://localhost:8080` e reinicie o Vite. O padrão atual é a AWS. Em produção, configure a variável na hospedagem e gere uma nova versão da web. A URL da IA permanece independente. Antes da troca, valide o login e o CORS do serviço publicado.

O Vite encaminha `/api/ia` para o serviço existente; a Vercel tem a regra equivalente em `vercel.json`. Isso permite consumir o contrato publicado sem alterar CORS, agentes, autenticação ou código da IA. As chaves dos modelos, do banco e de assinatura JWT ficam nos servidores. Outros hosts precisam configurar o mesmo reverse proxy antes do fallback da SPA.

As conversas são recuperadas da IA publicada por `GET /api/v1/sessoes`; a leitura de uma conversa fora do cache usa `POST /api/v1/sessoes/conversa`. Títulos, resumo e emoções vêm do servidor. Mensagens ativas e URLs de anexos são mantidas em memória durante a sessão; o contrato de histórico ainda não devolve anexos nem a confirmação pendente. Cada resposta usa a arte correspondente às 12 emoções fornecidas pelo usuário. Propostas de criação mostram Sim/Não; Não abre a correção antes de nova avaliação da IA.

Arquivos selecionados são enviados ao Cloudinary e apenas a URL HTTPS retornada segue à IA. O cloud name, o preset unsigned e a pasta fornecidos foram configurados no `.env.local` desta máquina; um upload real foi validado no navegador. Outras máquinas/implantação precisam configurar as três variáveis públicas de Cloudinary. Se a equipe escolher assinatura futuramente, será necessário o contrato da rota de assinatura. Não inclua API Secret no frontend. A URL oficial do dashboard Databricks está configurada no exemplo e no ambiente local. O iframe usa a autenticação e as permissões do Databricks; pode ser necessário entrar na conta pelo link Abrir em nova aba. A aprovação de domínio para o teste atual é http://localhost:5173. Consulte [a verificação real do iframe](docs/BI_DATABRICKS_2026-10-25.md).

A configuração atual aponta para a AWS. Na verificação real de 25/10/2026 às 23h39 (São Paulo), login, Home, equipe, turnos, competências, calendário, perfil e restauração de sessão funcionaram. O Dashboard abriu pelo acesso autenticado da web; os gráficos do Databricks também foram confirmados pelo usuário no Edge. Naquela verificação, o histórico da IA respondeu HTTP 403. A [conferência de 27/10](docs/IA_AWS_2026-10-27.md) confirmou que o acesso de Gestor e RH, o chat e o encerramento estão funcionando. Consulte também o [registro histórico da AWS](docs/INTERFACE_AWS_2026-10-25.md). O [teste anterior com API local](docs/API_LOCAL_DEV_2026-10-25.md) é um registro histórico.

## Integração atual

| Fluxo                 | Comportamento                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login/sessão          | CNPJ, e-mail e senha enviados à API; Bearer, renovação de token e logout; restauração da sessão da aba validada no servidor                                                            |
| Equipe                | Listagem de técnicos, cadastro com senha inicial, edição de dados, turnos e competências; desativação e reativação                                                                     |
| Competências          | Dez categorias; notas opcionais de 0 a 10, com até duas casas decimais e entrada com ponto ou vírgula; remoção desativa a avaliação; reaproveitamento do registro ao avaliar novamente |
| Calendário/Home       | Eventos reais; local cadastrado, descrição, datas de início/fim e responsável; criação, edição e exclusão                                                                              |
| Perfil                | Consulta e edição de nome, e-mail e nascimento; demais campos somente quando fornecidos pelo contrato                                                                                  |
| Senha                 | Solicitação de e-mail e confirmação com código recebido + nova senha; troca autenticada da senha atual                                                                                 |
| Dashboard             | V1 usa somente iframes Databricks: a Home abre o gráfico Solicitações por período; a tela Dashboard mantém as páginas completas. Não depende de uma API de BI.                         |
| Desempenho individual | Iframe de OS criadas por período com filtro pelo nome completo do técnico; depende dos nomes atualizados na base do BI, sem números fictícios.                                         |
| Manu                  | Chat Bearer pelo proxy da web, 12 emoções, revisão de criação e upload configurável; histórico remoto, títulos do servidor e cache de conversas ativas                                 |

Notas e cadastros persistem pelo backend, sem cópia de dados em `localStorage`. A sessão usa `sessionStorage` da aba para os tokens Bearer e a identificação mínima; senhas não são armazenadas. Em erro de renovação por token inválido, a sessão local é encerrada. O backend é responsável por autorização e isolamento entre unidades.

O cadastro, os turnos e as notas usam endpoints separados. Uma falha pode deixar uma parte salva. A web informa isso e conserva o ID retornado para completar a operação ao tentar novamente, sem reenviar a criação do usuário. Não há promessa de transação conjunta no frontend.

Há diferenças relevantes entre o protótipo e a API: técnicos são desativados; o responsável de um evento não pode ser trocado na edição; turnos e locais precisam existir na unidade; o perfil de gestor não recebe dados de endereço/telefone. Consulte o [mapeamento e a verificação da integração](docs/INTEGRACAO_API_2026-10-25.md).

A Home usa `VITE_DATABRICKS_HOME_WIDGET` para escolher um único gráfico do dashboard configurado, sem alterar a URL da tela Dashboard. O valor é o identificador `página~widget` do parâmetro `fullscreenWidget` copiado do Databricks. O calendário carrega separadamente pela API Web; uma falha nos eventos não impede o iframe. A incorporação mantém a autenticação e a navegação fornecidas pelo Databricks. Não há API de BI prevista para essa exibição na V1.

A ficha do técnico usa `VITE_DATABRICKS_TECHNICIAN_WIDGET` e `VITE_DATABRICKS_TECHNICIAN_FILTER` para incorporar o gráfico de OS com o filtro publicado de nome completo. Se a configuração estiver ausente ou malformada, não abre um gráfico geral como alternativa. O filtro atual do BI é nominal: nomes alterados na Web precisam ser atualizados no BI; para identidade estável e métricas de conclusão, a responsável deve publicar o filtro de ID e ligá-lo às fontes correspondentes. Veja [o contrato de desempenho individual](docs/BI_TECNICO_2026-10-26.md).

## Verificar

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Os testes de ciclo dos hooks e de interface responsiva rodam separadamente, com Vite já em execução e Playwright disponível na máquina:

```bash
npm run test:browser
```

Se o módulo Playwright estiver fora do projeto, defina `FIXA_PLAYWRIGHT_MODULE` com o caminho de seu `index.mjs`. `FIXA_TEST_BASE_URL` usa http://localhost:5173 por padrão; `FIXA_TEST_BROWSER_CHANNEL` permite escolher outro navegador. No Windows, o padrão é Edge; nos demais sistemas, Chromium. Use a configuração de API descrita acima; as leituras dos testes são interceptadas e conexões externas não simuladas são bloqueadas. Não é necessário login real.

A [revisão posterior da estrutura](docs/REVISAO_ESTRUTURA_2026-10-26.md) registra oito testes de navegador aprovados, além dos 117 testes Node, corrigindo reaproveitamento de opções/notas antigas e tratamento de exceção imediata.

A [revisão mobile](docs/MOBILE_RESPONSIVO_2026-10-26.md) acrescenta 13 casos de interface/toque, totalizando 21 testes de navegador. Inclui botões compactos, cartões da equipe, calendário sem sobreposição, formulários e campo de mensagem da Manu em telas baixas.

`tests/api-contract.test.mjs` verifica o transporte e os adaptadores usados em produção com respostas HTTP controladas. As suítes antigas continuam utilizando fixtures de demonstração explicitamente isoladas em `src/mocks/services`; não comprovam persistência real. Não há importação dessas fixtures pelos serviços de produção.

Em 25/10/2026, além dos cenários controlados em 1280×720 e 390×844, os fluxos de login, equipe, competências, eventos, perfil e recuperação de senha foram validados no Edge com API Spring Boot, PostgreSQL, Redis e SMTP locais reais. Houve confirmação por consultas independentes à API e recarregamento das páginas. Consulte as [evidências da execução local](docs/API_LOCAL_2026-10-25.md). A sincronização com o aplicativo mobile e a implantação em produção ainda não foram verificadas.

## Organização

- `src/services/httpClient.ts`: transporte, renovação e isolamento de sessão.
- `src/services/apiManagement.ts`: composição dos adaptadores e da sessão.
- `src/services/resources/`: HTTP por recurso; `teamService.ts` orquestra operações de equipe.
- `src/hooks/useEventFormController.ts` e `useTechnicianFormController.ts`: estado, validação e salvamento dos formulários.
- `src/types/api/` e `src/utils/api*.ts`: DTOs por recurso e mapeadores sem acesso HTTP.
- `src/services/authService.ts` e `recoveryService.ts`: autenticação e senha.
- `src/utils/apiValidation.ts`: validação alinhada aos DTOs.
- `src/components`, `src/pages`, `src/contexts`, `src/types`: interface e estado tipados.
- `docs`: mapeamento atual, QA e registros históricos do protótipo.

Siga [CONTRIBUTING.md](CONTRIBUTING.md): Issue → branch a partir de `dev` → revisão/CI → `dev` → `hml` → `main`. A integração com API está na [Issue #10](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/10); preserva as alterações da [Issue #9](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/9). Aprovação, merge e homologação dependem da equipe.

## Publicação

Na Vercel, use `npm run build`, saída `dist` e a variável pública `VITE_API_BASE_URL` antes do build. `vercel.json` preserva as rotas da SPA. A existência dessa configuração não comprova publicação nem CI aprovado. Configure CORS no backend e execute os fluxos com conta de teste antes da homologação.

## Revisão da integração

A [revisão de 25/10/2026](docs/REVISAO_WEB_2026-10-25.md) corrigiu perda indevida de sessão, resposta inválida de renovação e exibição de eventos com vários dias. Login e consultas na API Web local passaram; a chamada real à IA retornou 403 e requer alinhamento de autenticação/perfil no serviço consultado por ela. Não há fallback de resposta simulada na aplicação. As pendências de histórico, Databricks e publicação continuam identificadas no relatório.
