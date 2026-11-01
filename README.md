# FIXA Web

Aplicação de gestão de manutenção em React 19, TypeScript e Vite. Repositório: [Fixa-Inter/segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).

**Publicação:** ainda sem URL pública confirmada. A implantação na Vercel deve usar a versão promovida para `main` após revisão e homologação.

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
VITE_DATABRICKS_HOME_WIDGET=a5185eb0~solicitacoes-por-periodo
VITE_DATABRICKS_TECHNICIAN_WIDGET=37645ca6~os-criadas-por-periodo
VITE_DATABRICKS_TECHNICIAN_FILTER=f_37645ca6~tecnico1.s
```

Vite e Vercel encaminham `/api/web` à API Web e `/api/ia` à IA publicadas na AWS. Os valores públicos do Cloudinary precisam ser fornecidos pela equipe. Reinicie o Vite ou gere um novo build após mudar variáveis. `VITE_*` fica acessível ao navegador: credenciais de banco, SMTP, modelos de IA, JWT e service principal pertencem ao backend.

Para usar a API local com Docker, consulte [dev/README.md](dev/README.md). É possível apontar `VITE_API_BASE_URL` diretamente para `http://localhost:8080` ou para a origem HTTPS autorizada; nesse caso, o servidor precisa permitir a origem da Web no CORS.

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
| `src/pages`              | Composição das telas e rotas                                                    |
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
| `docs`                   | Integrações, critérios da entrega e roteiro de apresentação                     |

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
5. Publicar, testar rotas diretas/recarregamento e serviços, autorizar a origem necessária na API/Databricks e incluir a URL pública neste README.

Com a integração Git ativa, atualizações aprovadas de `main` geram novas publicações. A configuração local não comprova uma implantação.

## Entrega e limites conhecidos

- [Mapa dos 24 critérios de DAD](docs/ENTREGA_DAD.md), com links para o código.
- [Roteiro de demonstração](docs/ROTEIRO_DAD.md).
- [Contratos de integração e limitações](docs/INTEGRACOES.md).

Na conferência de 01/11/2026, o login de Gestor e RH respondeu 200; `GET /api/v1/dashboard/embed` respondeu 502 para ambos. A Web trata a falha sem abrir um dashboard sem restrição. A homologação real do BI depende da correção no serviço de acesso ao Databricks.

Publicação pública e demonstrações presenciais de Profiler/leitor de tela permanecem pendentes. Testes automáticos não certificam acessibilidade integral nem aprovação acadêmica.

Siga [CONTRIBUTING.md](CONTRIBUTING.md) e [AGENTS.md](AGENTS.md). `node_modules`, `dist`, `.env*` locais, arquivos de desenvolvimento e relatórios gerados ficam fora do Git/publicação. Os relatórios antigos foram preservados no histórico e em uma cópia local ignorada; a entrega mantém somente a documentação atual e evidências selecionadas.
