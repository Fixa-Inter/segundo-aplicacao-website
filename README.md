# FIXA Web

Aplicação de gestão de manutenção em React 19, TypeScript e Vite. Repositório: [Fixa-Inter/segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).

**Web publicada:** [segundo-aplicacao-website.vercel.app](https://segundo-aplicacao-website.vercel.app/login). A implantação usa a versão promovida para `main` após revisão e homologação.

## Executar

Use Node.js 24.

```bash
npm ci
```

Copie `.env.example` para `.env.local`, configure os serviços e execute:

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). A porta é fixa; se estiver ocupada, use a instância existente ou encerre-a antes de iniciar outra. Os comandos usam Node diretamente para funcionar em caminhos Windows com `&`.

Configuração recomendada para desenvolvimento e Vercel:

```dotenv
VITE_API_BASE_URL=/api/web
VITE_AI_BASE_URL=/api/ia
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=
VITE_DATABRICKS_TECHNICIAN_WIDGET=37645ca6~os-criadas-por-periodo
VITE_DATABRICKS_TECHNICIAN_FILTER=f_37645ca6~tecnico1.s
```

Vite e Vercel encaminham `/api/web` à API Web e `/api/ia` à IA publicadas na AWS. Os valores públicos do Cloudinary precisam ser fornecidos pela equipe. Reinicie o Vite ou gere um novo build após mudar variáveis. `VITE_*` fica acessível ao navegador: credenciais de banco, SMTP, modelos de IA, JWT e service principal pertencem ao backend.

Para usar a API local com Docker, consulte [dev/README.md](dev/README.md). É possível apontar `VITE_API_BASE_URL` diretamente para `http://localhost:8080` ou para a origem HTTPS autorizada; nesse caso, o servidor precisa permitir a origem da Web no CORS.

A Home abre somente o gráfico “Distribuição atual das OS por status” ampliado no card. Seu identificador está definido em `src/pages/Home/index.tsx`; a aba Dashboard mantém o painel completo.

## Funcionalidades

- Login com CNPJ, e-mail e senha; renovação de sessão, logout e recuperação/troca de senha.
- Home com eventos e gráfico da unidade; Dashboard e desempenho individual via SDK Databricks.
- Equipe com busca, filtros, paginação, detalhes, edição, um turno e dez competências opcionais de 0 a 10, com até duas casas decimais. RH tem abas Gestores e Técnicos.
- Calendário com criação, edição e exclusão de eventos; confirmação de descarte em formulários alterados.
- Perfil com dados pessoais e localização da unidade; quatro idiomas e temas claro/escuro.
- Manu com histórico, upload Cloudinary, emoções, confirmação de criação, gráficos Recharts e respostas formatadas com links de ofertas.

Dados de negócio persistem no servidor. Preferências versionadas usam `localStorage`; a sessão da aba usa `sessionStorage`. Senhas e tokens de embed não são persistidos nesses locais. Sem preferência explícita de idioma, a interface usa um idioma compatível do navegador.

## Organização do código

| Pasta                    | Responsabilidade                                                                |
| ------------------------ | ------------------------------------------------------------------------------- |
| `src/pages`              | Composição das telas, rotas e tabelas específicas                               |
| `src/components`         | Elementos de interface em pastas próprias com `index.tsx`                       |
| `src/hooks`              | Estado, validação e ações das telas/formulários                                 |
| `src/services`           | Autenticação, transporte HTTP e integração com a Manu/Databricks                |
| `src/services/resources` | Requisições por recurso da API Web                                              |
| `src/types`              | Interfaces de props, entidades, estados e contratos da API                      |
| `src/utils`              | Validações e conversões sem interface ou HTTP                                   |
| `src/contexts`           | Sessão e preferências compartilhadas                                            |
| `src/i18n`               | Traduções da interface                                                          |
| `tests`                  | Verificações de contratos, regras e navegação; fixtures não entram na aplicação |
| `dev` e `scripts`        | Execução opcional da API local                                                  |

Os serviços antigos de demonstração ficam em `tests/fixtures/demo`, pois são usados apenas para testar cenários. A aplicação utiliza os serviços reais de `src/services`.

Para estudar o fluxo: [App](src/App.tsx) → [página Equipe](src/pages/Team/index.tsx) → [useTeamPage](src/hooks/useTeamPage.ts) → [teamService](src/services/teamService.ts) → [recursos HTTP](src/services/resources/users.ts). A Manu segue a mesma separação entre página, componentes, hook e serviço. Cancelamento, autenticação e validação de dados externos foram mantidos na simplificação.

## Verificar

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Para os cenários de navegador, mantenha o Vite aberto. Instale Playwright em um ambiente de teste separado e informe o caminho do módulo por `FIXA_PLAYWRIGHT_MODULE`; ou disponibilize o pacote no ambiente. No Windows, os testes usam Edge por padrão. É possível definir `FIXA_TEST_BROWSER_CHANNEL` e `FIXA_TEST_BASE_URL`.

```bash
npm run test:browser
```

Os cenários interceptam as APIs com dados controlados, incluindo falhas e outros perfis; isso não substitui a homologação das gravações reais na AWS. O CI executa instalação, formatação, lint, testes de unidade/contrato e build. Os testes de navegador são executados separadamente.

## Publicar na Vercel

1. Revisar e promover as alterações pelo fluxo `feature` → `dev` → `hml` → `main`.
2. Importar o repositório da organização com branch de produção `main` e raiz `./`.
3. Usar Vite, Node.js 24, instalação `npm ci`, build `npm run build` e saída `dist`, definidos no projeto.
4. Configurar as variáveis públicas acima em Preview e Production. O proxy e o retorno das rotas para `index.html` estão em [vercel.json](vercel.json).
5. Publicar e conferir rotas diretas/recarregamento e serviços. Autorizar a origem necessária na API/Databricks quando aplicável; o endereço publicado está no início deste README.

Com a integração Git ativa, atualizações aprovadas de `main` geram novas publicações. A configuração local não comprova uma implantação.

## Links para os requisitos de DAD

| Requisito                                    | Implementação                                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite, React e TypeScript                     | [Configuração](package.json) e [entrada](src/main.tsx)                                                                                              |
| Pastas de componentes e páginas              | [Componentes](src/components) e [páginas](src/pages)                                                                                                |
| Responsabilidades separadas                  | [Formulário](src/components/TechnicianForm/index.tsx), [hook](src/hooks/useTechnicianFormController.ts) e [serviço](src/services/teamService.ts)    |
| Interfaces de props e entidades              | [Props](src/types/ui.ts) e [entidades](src/types/management.ts)                                                                                     |
| APIs isoladas e tratamento de erros          | [Recursos](src/services/resources) e [cliente HTTP](src/services/httpClient.ts)                                                                     |
| Estado com useState e atualizações imutáveis | [Formulário de pessoas](src/hooks/useTechnicianFormController.ts)                                                                                   |
| useEffect e dependências                     | [Carregamento de opções](src/hooks/useResourceOptions.ts)                                                                                           |
| Identificadores estáveis nas listas          | [Mensagens da Manu](src/components/Manu/ManuMessages/index.tsx)                                                                                     |
| useParams e validação do parâmetro           | [Detalhes da equipe](src/hooks/useTeamPage.ts)                                                                                                      |
| Rotas, navegação e página de erro            | [Rotas](src/App.tsx) e [página não encontrada](src/pages/NotFound/index.tsx)                                                                        |
| Labels, imagens, teclado e foco              | [Campos](src/components/AuthField/index.tsx) e [layout](src/components/AppLayout/index.tsx)                                                         |
| Carregamento, sucesso e erro                 | [Loader](src/components/LoadingState/index.tsx) e [avisos](src/components/SuccessNotice/index.tsx)                                                  |
| Aplicação publicada                          | [Web na Vercel](https://segundo-aplicacao-website.vercel.app/login)                                                                                 |
| Histórico de commits                         | [Histórico do repositório](https://github.com/Fixa-Inter/segundo-aplicacao-website/commits/main)                                                    |
| Context, Provider e hook de consumo          | [Autenticação](src/contexts/AuthContext.tsx) e [hook](src/contexts/useAuth.ts)                                                                      |
| useReducer com estado e ações tipados        | [Reducer](src/utils/authReducer.ts) e [tipos](src/types/auth.ts)                                                                                    |
| Hook com loading, erro e cancelamento        | [Opções de recursos](src/hooks/useResourceOptions.ts)                                                                                               |
| React.lazy e Suspense                        | [Carregamento das páginas](src/App.tsx)                                                                                                             |
| localStorage com versão e migração           | [Preferências](src/utils/preferences.ts) e [Provider](src/contexts/PreferencesContext.tsx)                                                          |
| useMemo e useCallback                        | [Dados dos gráficos](src/hooks/useManuChartData.ts) e [opções dos formulários](src/hooks/useManagementOptions.ts)                                   |
| Tratamento de conteúdo externo e XSS         | [Respostas](src/components/Manu/ManuResponse/index.tsx) e [validação das visualizações](src/utils/visualization.ts)                                 |
| Validação de formulários                     | [Validações da API](src/utils/apiValidation.ts) e [recuperação de senha](src/utils/recoveryValidation.ts)                                           |
| Rotas privadas com Context                   | [PrivateRoute](src/routes/PrivateRoute.tsx)                                                                                                         |
| ARIA, landmarks e gerenciamento de foco      | [Layout](src/components/AppLayout/index.tsx), [diálogos](src/components/ConfirmDialog/index.tsx) e [filtros](src/components/FilterButton/index.tsx) |

A apresentação deve incluir as demonstrações exigidas no React DevTools, Profiler e leitor de tela. Testes automáticos não substituem essa avaliação nem certificam acessibilidade integral.

Siga [CONTRIBUTING.md](CONTRIBUTING.md) e [AGENTS.md](AGENTS.md). Configurações locais, dependências instaladas, build e relatórios de desenvolvimento ficam fora do Git e da publicação.
