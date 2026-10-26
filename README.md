# FIXA Web

Frontend de gestão de manutenção em React 19, TypeScript e Vite. Repositório: [segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).

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
VITE_DATABRICKS_DASHBOARD_URL=
```

Para testar a API local, altere somente `VITE_API_BASE_URL` para `http://localhost:8080` e reinicie o Vite. O padrão atual é a AWS. Em produção, configure a variável na hospedagem e gere uma nova versão da web. A URL da IA permanece independente. Antes da troca, valide o login e o CORS do serviço publicado.

O Vite encaminha `/api/ia` para o serviço existente; a Vercel tem a regra equivalente em `vercel.json`. Isso permite consumir o contrato publicado sem alterar CORS, agentes, autenticação ou código da IA. As chaves dos modelos, do banco e de assinatura JWT ficam nos servidores. Outros hosts precisam configurar o mesmo reverse proxy antes do fallback da SPA.

As conversas são recuperadas da IA publicada por `GET /api/v1/sessoes`; a leitura de uma conversa fora do cache usa `POST /api/v1/sessoes/conversa`. Títulos, resumo e emoções vêm do servidor. Mensagens ativas e URLs de anexos são mantidas em memória durante a sessão; o contrato de histórico ainda não devolve anexos nem a confirmação pendente. Cada resposta usa a arte correspondente às 12 emoções fornecidas pelo usuário. Propostas de criação mostram Sim/Não; Não abre a correção antes de nova avaliação da IA.

Arquivos selecionados são enviados ao Cloudinary e apenas a URL HTTPS retornada segue à IA. O cloud name, o preset unsigned e a pasta fornecidos foram configurados no `.env.local` desta máquina; um upload real foi validado no navegador. Outras máquinas/implantação precisam configurar as três variáveis públicas de Cloudinary. Se a equipe escolher assinatura futuramente, será necessário o contrato da rota de assinatura. Não inclua API Secret no frontend. O dashboard recebe a URL de incorporação do Databricks quando ela for fornecida.

A configuração atual aponta para a AWS. Na verificação de 25/10/2026 às 22h43 (São Paulo), o login de exemplo ainda retornou HTTP 500; o CORS permitiu `http://localhost:5173`, e o health check da IA retornou 200. A falha precisa ser investigada no servidor Web. Consulte [a revisão atual da interface e da AWS](docs/INTERFACE_AWS_2026-10-25.md). O [teste anterior com API local](docs/API_LOCAL_DEV_2026-10-25.md) é um registro histórico. Consulte [contrato, pendências e evidências](docs/INTEGRACAO_IA_2026-10-25.md).

## Integração atual

| Fluxo                | Comportamento                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login/sessão         | CNPJ, e-mail e senha enviados à API; Bearer, renovação de token e logout; restauração da sessão da aba validada no servidor                                                            |
| Equipe               | Listagem de técnicos, cadastro com senha inicial, edição de dados, turnos e competências; desativação e reativação                                                                     |
| Competências         | Dez categorias; notas opcionais de 0 a 10, com até duas casas decimais e entrada com ponto ou vírgula; remoção desativa a avaliação; reaproveitamento do registro ao avaliar novamente |
| Calendário/Home      | Eventos reais; local cadastrado, descrição, datas de início/fim e responsável; criação, edição e exclusão                                                                              |
| Perfil               | Consulta e edição de nome, e-mail e nascimento; demais campos somente quando fornecidos pelo contrato                                                                                  |
| Senha                | Solicitação de e-mail e confirmação com código recebido + nova senha; troca autenticada da senha atual                                                                                 |
| Dashboard/desempenho | Indisponíveis até existir contrato da API de indicadores/BI; nenhum número fictício apresentado como real                                                                              |
| Manu                 | Chat Bearer pelo proxy da web, 12 emoções, revisão de criação e upload configurável; histórico remoto, títulos do servidor e cache de conversas ativas                                 |

Notas e cadastros persistem pelo backend, sem cópia de dados em `localStorage`. A sessão usa `sessionStorage` da aba para os tokens Bearer e a identificação mínima; senhas não são armazenadas. Em erro de renovação por token inválido, a sessão local é encerrada. O backend é responsável por autorização e isolamento entre unidades.

O cadastro, os turnos e as notas usam endpoints separados. Uma falha pode deixar uma parte salva. A web informa isso e conserva o ID retornado para completar a operação ao tentar novamente, sem reenviar a criação do usuário. Não há promessa de transação conjunta no frontend.

Há diferenças relevantes entre o protótipo e a API: técnicos são desativados; o responsável de um evento não pode ser trocado na edição; turnos e locais precisam existir na unidade; o perfil de gestor não recebe dados de endereço/telefone. Consulte o [mapeamento e a verificação da integração](docs/INTEGRACAO_API_2026-10-25.md).

## Verificar

```bash
npm run format:check
npm run lint
npm test
npm run build
```

`tests/api-contract.test.mjs` verifica o transporte e os adaptadores usados em produção com respostas HTTP controladas. As suítes antigas continuam utilizando fixtures de demonstração explicitamente isoladas em `src/mocks/services`; não comprovam persistência real. Não há importação dessas fixtures pelos serviços de produção.

Em 25/10/2026, além dos cenários controlados em 1280×720 e 390×844, os fluxos de login, equipe, competências, eventos, perfil e recuperação de senha foram validados no Edge com API Spring Boot, PostgreSQL, Redis e SMTP locais reais. Houve confirmação por consultas independentes à API e recarregamento das páginas. Consulte as [evidências da execução local](docs/API_LOCAL_2026-10-25.md). A sincronização com o aplicativo mobile e a implantação em produção ainda não foram verificadas.

## Organização

- `src/services/httpClient.ts`: transporte, renovação e isolamento de sessão.
- `src/services/apiManagement.ts`: adaptação entre DTOs Java e entidades da interface.
- `src/services/authService.ts` e `recoveryService.ts`: autenticação e senha.
- `src/utils/apiValidation.ts`: validação alinhada aos DTOs.
- `src/components`, `src/pages`, `src/contexts`, `src/types`: interface e estado tipados.
- `docs`: mapeamento atual, QA e registros históricos do protótipo.

Siga [CONTRIBUTING.md](CONTRIBUTING.md): Issue → branch a partir de `dev` → revisão/CI → `dev` → `hml` → `main`. A integração com API está na [Issue #10](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/10); preserva as alterações da [Issue #9](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/9). Aprovação, merge e homologação dependem da equipe.

## Publicação

Na Vercel, use `npm run build`, saída `dist` e a variável pública `VITE_API_BASE_URL` antes do build. `vercel.json` preserva as rotas da SPA. A existência dessa configuração não comprova publicação nem CI aprovado. Configure CORS no backend e execute os fluxos com conta de teste antes da homologação.

## Revisão da integração

A [revisão de 25/10/2026](docs/REVISAO_WEB_2026-10-25.md) corrigiu perda indevida de sessão, resposta inválida de renovação e exibição de eventos com vários dias. Login e consultas na API Web local passaram; a chamada real à IA retornou 403 e requer alinhamento de autenticação/perfil no serviço consultado por ela. Não há fallback de resposta simulada na aplicação. As pendências de histórico, Databricks e publicação continuam identificadas no relatório.
