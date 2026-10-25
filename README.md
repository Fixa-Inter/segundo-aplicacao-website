# FIXA Web

Frontend de gestão de manutenção em React 19, TypeScript e Vite. Repositório: [segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).

## Executar

Use Node.js 24 e um servidor da [API Web FIXA](https://github.com/Fixa-Inter/segundo-api-web) em execução.

```bash
npm ci
```

Copie `.env.example` para `.env.local` e informe a URL **do servidor**, sem `/api/v1` no final:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

O endereço acima é um exemplo local. O link do repositório GitHub não é o endereço de execução da API. Reinicie o Vite depois de alterar a configuração.

```bash
npm run dev
```

Entre com CNPJ numérico, e-mail institucional e senha de uma conta real de gestor/administrador cadastrada na API. O acesso demonstrativo e o código fixo `123456` não funcionam nos serviços reais. Sem URL configurada, a web informa a configuração necessária; não substitui uma falha da API por dados fictícios.

O servidor precisa permitir a origem da web em `app.cors.allowed-origins`. O contrato consultado permite `http://localhost:5173` por padrão; confira a porta exibida pelo Vite. Em produção, configure a origem HTTPS da web no backend e `VITE_API_BASE_URL` no ambiente de build da hospedagem. Variáveis `VITE_*` são públicas: não coloque senhas de banco, chaves JWT ou credenciais de SMTP nelas.

Os comandos chamam as ferramentas diretamente pelo Node para funcionar também em caminhos Windows com `&`, como `OneDrive - Instituto J&F`.

## Executar a API localmente

Com Docker Desktop em execução:

```bash
npm run local:up
npm run dev -- --port 5173 --strictPort
```

O ambiente prepara PostgreSQL, Redis, e-mail local e API, com credenciais somente da máquina. Consulte [dev/README.md](dev/README.md).

## Integração atual

| Fluxo                | Comportamento                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Login/sessão         | CNPJ, e-mail e senha enviados à API; Bearer, renovação de token e logout; restauração da sessão da aba validada no servidor                |
| Equipe               | Listagem de técnicos, cadastro com senha inicial, edição de dados, turnos e competências; desativação e reativação                         |
| Competências         | Dez categorias; notas opcionais de 0 a 10 inteiras na web; remoção desativa a avaliação; reaproveitamento do registro ao avaliar novamente |
| Calendário/Home      | Eventos reais; local cadastrado, descrição, datas de início/fim e responsável; criação, edição e exclusão                                  |
| Perfil               | Consulta e edição de nome, e-mail e nascimento; demais campos somente quando fornecidos pelo contrato                                      |
| Senha                | Solicitação de e-mail e confirmação com código recebido + nova senha; troca autenticada da senha atual                                     |
| Dashboard/desempenho | Indisponíveis até existir contrato da API de indicadores/BI; nenhum número fictício apresentado como real                                  |
| Manu                 | Interface informa indisponibilidade enquanto não houver API de conversas                                                                   |

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
