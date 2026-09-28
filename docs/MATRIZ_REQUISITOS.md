# Matriz de requisitos e evidências — FIXA Web

Fonte: **Requisitos por disciplina — Interdisciplinar — 14/05/2026**, 11 páginas. Esta matriz separa o que a aplicação React pode demonstrar do que depende do backend, de outras entregas da equipe ou de publicação. O Figma de referência é a [cópia Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628).

**Estados:** `Validado` = implementação local e verificação indicada executadas; `Validado em código` = inspeção/build/teste, mas sem comprovação visual ou externa integral; `Validado no mock`/`Validado no cliente` = fluxo observado, sem aprovação da API ou autorização do servidor; `Implementado, QA pendente` = código sem evidência suficiente; `Parcial` = só uma parte local existe; `Pendente externo` = depende de API, dados reais, hospedagem, processo de equipe ou outro repositório; `Fora do Web` = pertence a outra disciplina/artefato. Uma aprovação de mock **não** aprova o critério que requer serviço ou dados reais.

## Fluxos do gestor — Website v2

Cada linha aponta a implementação, a verificação realizada e um passo de demonstração. O inventário visual de frames, adaptações e estados ainda abertos está em [FIDELIDADE_VISUAL.md](FIDELIDADE_VISUAL.md).

| Requisito / Figma | Estado | Implementação / arquivo | Teste e forma de demonstrar |
| --- | --- | --- | --- |
| Login e sessão / `5631:5629` | Validado no mock | [`Login`](../src/pages/Login/index.tsx), [`authService`](../src/services/authService.ts), [`AuthContext`](../src/contexts/AuthContext.tsx) | Submit vazio focou Email/CNPJ; valores fictícios abriram Home com carregamento. Coordenadas comparadas em 1440 × 1024; entrar com `demo@fixa.test`/`demo1234` |
| Recuperação em quatro etapas / `5631:5663`, `5679`, `5700`, `5729` | Validado no mock | [`Recovery`](../src/pages/Recovery/index.tsx), [`recoveryService`](../src/services/recoveryService.ts) | E-mail, código 123456, rejeição de código/senha e conclusão com aviso explícito; `npm test`; quatro estados comparados com o Figma em 1440 × 1024 e fluxo repetido em 390 × 844; demonstrar com senha fictícia `Exemplo!` |
| Home e navegação / `5631:5743` | Validado no mock | [`Home`](../src/pages/Home/index.tsx), [`AppLayout`](../src/components/AppLayout/index.tsx), [`homeService`](../src/services/homeService.ts) | Cards, gráfico, semana e navegação observados; composição principal comparada ao frame em 1440 × 1024; criar evento no Calendário e encontrá-lo na Home; `npm test` |
| Dashboard/BI / `5631:5998` | Validado no mock | [`Dashboard`](../src/pages/Dashboard/index.tsx), [`analytics`](../src/utils/analytics.ts), [`managementService`](../src/services/managementService.ts) | 18 testes incluem parcelas por técnico, quartis e histograma; no navegador filtrar Ana/3 meses e ler 13/9/4, observar dispersão; Data Mart ainda ausente |
| Equipe, busca, filtro, paginação e abas / `5631:6232` | Validado no mock | [`Team`](../src/pages/Team/index.tsx), [`managementService`](../src/services/managementService.ts) | Buscar técnico, navegar páginas, alternar aba Técnicos/Gestores com setas; conta gestora e foco observados |
| Cadastro e edição de técnico / `5631:6389`, `6522` | Validado no mock | [`TechnicianForm`](../src/components/TechnicianForm/index.tsx), [`managementValidation`](../src/utils/managementValidation.ts) | Erros e foco por campo; salvar, editar e excluir fictício. Frames de cadastro/edição consultados e alinhamento inicial medido em 1440 × 1024; tipo TÉCNICO e endereço herdado visíveis somente para leitura; senha provisória não armazenada |
| Detalhes e desempenho / `5631:6658` | Validado no mock | [`TechnicianDetails`](../src/components/TechnicianDetails/index.tsx), [`performanceByTechnician`](../src/mocks/performance.ts) | Ana exibiu dados e gráficos semanal/mensal; voltar restaurou foco; técnico novo tem vazio no teste |
| Calendário mensal e eventos / `5631:6796`, `7099`, `7208` | Validado no mock | [`Calendar`](../src/pages/Calendar/index.tsx), [`EventForm`](../src/components/EventForm/index.tsx) | Navegar dias com setas, criar/editar/excluir, rejeitar término anterior, observar foco. Evento salvo apareceu também na Home. Frame principal e formulários de novo evento/edição comparados; diferença de altura da grade completa está documentada |
| Perfil e troca de senha / `5631:6890`, `6981` | Validado no mock | [`Profile`](../src/pages/Profile/index.tsx) | Editar/cancelar dados, rejeitar 31/02/2000, observar foco; senha fictícia é validada e campos são limpos, sem alteração real. Posições principais comparadas aos dois frames em 1440 × 1024; edição sem transbordamento nas três resoluções pedidas |
| Manu: conversa, histórico, busca e anexo / `5631:5893` | Validado no mock | [`Manu`](../src/pages/Manu/index.tsx), [`manuService`](../src/services/manuService.ts) | Sugestões, Ctrl+Enter, busca, novo chat, metadados de arquivo, histórico entre rotas; teste de resposta pendente após navegação e limpeza ao logout; sem IA. Composição inicial comparada ao frame em 1440 × 1024 |
| Apresentação pública, rota privada e 404 / sem frame | Validado no cliente | [`App`](../src/App.tsx), [`About`](../src/pages/About/index.tsx), [`PrivateRoute`](../src/routes/PrivateRoute.tsx), [`NotFound`](../src/pages/NotFound/index.tsx) | `/sobre`, `/equipe` sem sessão e `/rota-inexistente` percorridos; autorização real é externa |
| Todos os estados Figma, WCAG AA e tablet físico | Parcial | [revisão visual](FIDELIDADE_VISUAL.md), [QA](QA_NAVEGADOR.md) | Estados principais/responsividade observados; comparação integral, contraste formal, leitor de tela e dispositivo físico ainda pendentes |

## Desenvolvimento de Aplicações Dinâmicas — páginas 6–8

| Critério do PDF | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Vite + React + TypeScript; fontes em `.ts`/`.tsx` | Validado | [`package.json`](../package.json), [`src`](../src) | `npm run build`; inventário sem `.js`/`.jsx` em `src`. CSS Modules e imagens são estilos/recursos, preservados conforme o projeto |
| Componentes e páginas em pastas próprias com `index.tsx`; ao menos 6 componentes de responsabilidade única | Validado em código | [`src/components`](../src/components), [`src/pages`](../src/pages) | Nove componentes: AppLayout, AuthField, Brand, DemoBadge, PageHeader, StatCard, TechnicianForm, TechnicianDetails e EventForm; build/lint |
| Props e entidades tipadas em `src/types`, sem `any` | Validado em código | [`src/types`](../src/types), [`tsconfig.app.json`](../tsconfig.app.json) | TypeScript estrito; revisão de props/contratos; busca sem `any` explícito em `src` |
| Comunicação externa em `services`, `Promise<T>`, `try/catch`, sem `fetch` em páginas, URLs privadas fora do código | Parcial | [`managementService.ts`](../src/services/managementService.ts), [`manuService.ts`](../src/services/manuService.ts), [`.env.example`](../.env.example) | Services locais tipados; **não há API externa nem contrato**. Integrar e testar respostas HTTP quando houver backend |
| `useState`, campos agrupados, sem mutação direta | Validado em código | [`Team`](../src/pages/Team/index.tsx), [`Calendar`](../src/pages/Calendar/index.tsx), [`Profile`](../src/pages/Profile/index.tsx), services | Revisão de código/build e testes de cópias independentes; formulários percorridos no navegador |
| `useEffect` com dependências corretas | Validado em código | páginas de Dashboard, Equipe, Calendário, Perfil e Manu | Lint de hooks; cargas com guarda de desmontagem; filtro do Dashboard e resposta pendente da Manu percorridos |
| Listas com `key` de ID estável | Validado em código | tabelas, eventos, conversas e gráficos | Revisão de código; cadastro, busca, eventos e conversas percorridos no navegador |
| `useParams` com verificação de parâmetro | Não aplicável | Nenhuma rota usa parâmetro dinâmico | Se forem criadas rotas de detalhe, implementar com guarda para `undefined` |
| 3+ rotas, `Link`/`useNavigate`, rota curinga e retorno | Validado | [`App.tsx`](../src/App.tsx), [`NotFound`](../src/pages/NotFound/index.tsx) | Login → Home e navegação entre telas; URL inexistente levou à 404 com link de retorno no navegador |
| WCAG 2.1 AA mínima, contraste, labels, alt, teclado, foco, erros `role=alert` | Parcial | [`index.css`](../src/index.css), [`AuthField`](../src/components/AuthField/index.tsx), páginas e modais Mantine | Labels/erros na árvore acessível; foco de erro em login/recuperação/cadastro/evento/perfil, teclado em abas/calendário/menu/Manu. Auditoria formal de contraste, Tab integral e leitor de tela pendentes |
| Carregando/sucesso/erro no DOM, sem `alert()`/`console.log` como tratamento | Parcial | páginas e services | Estados de login, Dashboard e Equipe vistos no navegador; falhas de rede reais não podem ser simuladas sem API |
| Publicação em Vercel ou GitHub Pages e link no README | Pendente externo | [`README.md`](../README.md) | Não há URL de deploy; validar site ao vivo depois de publicar |
| 20 commits Conventional Commits em quatro semanas reais | Pendente externo | Histórico Git local iniciado nesta entrega | Commits reais em português; não é permitido criar datas ou commits retroativos. Verificar `git log` e duração real antes da avaliação |
| Extra: Context API, Provider e hook | Validado em código | [`AuthContext.tsx`](../src/contexts/AuthContext.tsx), [`useAuth.ts`](../src/contexts/useAuth.ts) | Build; login demonstrativo no navegador |
| Extra: `useReducer` com `State` e `Action` union | Validado em código | [`auth.ts`](../src/types/auth.ts), [`AuthContext.tsx`](../src/contexts/AuthContext.tsx) | Build; login/logout ainda precisam de roteiro integral de teclado |
| Extra: hook com loading/erro/AbortController | Pendente | Não implementado | Exige fonte cancelável para evitar abstração artificial no mock |
| Extra: `React.lazy` e `Suspense` por página | Validado em código | [`App.tsx`](../src/App.tsx) | Chunks separados no build; aba Network do DevTools ainda não verificada |
| Extra: `localStorage` versionado | Pendente | Sessão, perfil e conversas ficam somente em memória | Implementar apenas com decisão de privacidade e necessidade real; não salvar senhas/chats por padrão |
| Extra: `useCallback`/`useMemo` com perfil de performance | Pendente | Não introduzidos sem medição | Demonstrar no Profiler se houver gargalo real |
| Extra: proteção XSS via JSX, sem `dangerouslySetInnerHTML` | Validado em código | páginas de Equipe, Calendário e Manu | Busca estática sem HTML direto; texto literal `Texto<teste>` de evento observado sem criar elemento HTML. Teste de segurança externo pendente |
| Extra: validação/sanitização tipada dos formulários | Parcial | [`managementValidation.ts`](../src/utils/managementValidation.ts), [`validation.ts`](../src/utils/validation.ts) | `npm test` valida técnico, evento, perfil e datas; ainda falta validar todas as regras definitivas da API |
| Extra: `PrivateRoute` + Context | Validado no cliente | [`PrivateRoute.tsx`](../src/routes/PrivateRoute.tsx) | `/equipe` sem sessão redirecionou ao login; servidor ainda precisa autenticar e autorizar |
| Extra: ARIA avançada e leitor de tela | Parcial | Drawer/Modal Mantine, navegação e mensagens | Teste completo com NVDA/VoiceOver pendente |

## Desenvolvimento 1 e operações Web — páginas 1–2

| Critério | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Landing page sobre o projeto | Validado | [`About`](../src/pages/About/index.tsx), rota `/sobre` | Aberta no navegador em 1340 × 800, 800 × 1340 e 390 × 844; links de acesso na árvore acessível |
| CRUD das tabelas administrativas definidas em POO | Parcial | CRUD de técnicos e eventos em [`managementService.ts`](../src/services/managementService.ts) e páginas | Cadastro de técnico e validação verificados no navegador; **não há Postgres/Servlet nem terceira tabela definida** |
| GitHub + hospedagem estática + links | Pendente externo | Build Vite disponível | Repositório remoto e deploy não foram fornecidos; testar URL pública |
| Responsividade e fidelidade ao protótipo UX | Parcial | CSS Modules e assets originais em [`src/assets/figma`](../src/assets/figma) | [QA no navegador](./QA_NAVEGADOR.md) e [revisão visual](./FIDELIDADE_VISUAL.md): capturas voltaram em 26/09; Login medido na resolução original; três resoluções sem rolagem horizontal nas telas testadas. Comparação de todos os estados e tablet físico pendentes |
| Documento detalhado de entregas com links | Parcial | Esta matriz, [`ROTEIRO_DAD.md`](./ROTEIRO_DAD.md), [`QA_NAVEGADOR.md`](./QA_NAVEGADOR.md) e [critérios externos](./CRITERIOS_EXTERNOS.md) | Evidência local registrada; URLs do repositório/site após publicação |

## Business Intelligence — páginas 10–11

| Critério | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Conectividade com dados gerados pela aplicação | Pendente externo | [`getDashboard`](../src/services/managementService.ts) devolve fixture tipada | Substituir pelo Data Mart/API e validar origem/atualização |
| Gráfico de barras, linha e dispersão demonstrativos | Validado no mock | [`Dashboard`](../src/pages/Dashboard/index.tsx) | Renderização e texto acessível observados; dispersão vista no celular. Fonte real depende de BI |
| KPIs e desvios | Parcial | Cards de totais, taxa e tempo médio no Dashboard | Fórmulas demonstrativas; desvios de referência ainda não definidos |
| Histograma e boxplot | Validado no mock | [`Dashboard`](../src/pages/Dashboard/index.tsx), [`analytics.ts`](../src/utils/analytics.ts) | Testes de quartis, amostras e limites; árvore acessível e capturas mobile. Dados reais pendentes |
| Mapas, se aplicável | Não aplicável até definição | Não há dados geográficos analíticos | Perguntar à equipe de BI se há dimensão espacial |
| Filtros interativos | Validado no mock | Técnico, período e métrica em [`Dashboard`](../src/pages/Dashboard/index.tsx), [`dashboardByTechnician`](../src/mocks/management.ts) | Ana + 3 meses mostrou 13 abertas, 9 concluídas, 4 pendentes; teste confirma parcelas/totais. Dados por técnico são sintéticos, fonte real pendente |
| Relatório gerencial: base, problema, tratamento, KPIs | Pendente externo | Não há base/ETL real | Equipe BI deve entregar e vincular relatório |
| Extra: pipeline/job Databricks e evidências | Fora do Web | Não pertence a este repositório React | Vincular artefatos de BI quando existirem |

## Demais disciplinas do PDF — responsabilidades e dependências

| Disciplina / páginas | Critérios abrangidos | Estado para este repositório | Evidência necessária |
| --- | --- | --- | --- |
| Banco de Dados 1, p.1 | Modelos conceitual/lógico, SQL de criação, DEFAULT/CHECK, DataLoad, convenção de nomes | Fora do Web | Diagramas, scripts e banco do 1º ano |
| Lógica de Programação, p.1 | Organização, nomes, comentários úteis, exceções, validação | Parcial | `npm run lint`, `npm run build`, revisão de código e testes; material específico de LP fora do Web |
| POO, p.2 | Java/IntelliJ, servlet/dao/model, JDBC/Postgres, interface HTML/CSS, CRUD 3+3 tabelas, filtros | Pendente externo | Repositório Java, esquema e contrato das tabelas; o mock React não comprova JDBC |
| Sistemas Operacionais, p.2 | Planilha de progresso, fórmulas, proteção; `.env`; Git/GitHub; REGEX CPF/celular | Parcial | `.env.example` e Git local; planilha/repo remoto/validação definitiva são entregas da equipe |
| Introdução à IA, pp.3–4 | Memorial, prompts/evidências, ferramentas, crítica, segurança/LGPD; extra GEM | Pendente externo | Memorial real da equipe; Manu Web atual é guia estático, não agente IA |
| UX 1º ano, p.4 | Pesquisa, CSD, benchmark, persona, jornada, fluxo, testes, protótipo, heurística; extras matriz/UI Kit/V2 | Fora do Web | Arquivos e estudos UX; Figma serve de referência visual |
| Metodologia de Projetos TI, p.5 | Termos, ferramentas, cronograma, recursos e alinhamento | Fora do Web | Documentação de gestão do grupo |
| Banco de Dados 2, p.5 | MongoDB conversacional, Redis fila/ranking; extra Neo4j traversal | Pendente externo | Backend e bancos; nenhuma persistência é alegada no Web |
| Engenharia de Software, p.5 | Planejamento, RF, casos de uso, 2 atividades, dinâmica da equipe; extras padrão/testes | Pendente externo | Artefatos da equipe; testes deste Web não substituem os diagramas |
| Aplicativos Móveis, pp.5–6 | Acesso, hardware, API, Firebase/SQLite, chatbot; extras avatar, notificação, tablet, GPS | Fora do Web | Aplicativo mobile e evidências no dispositivo |
| Desenvolvimento 2, p.6 | API Spring MVC/JPA/Postgres, CRUD, MVC, validação, exceções; extras Swagger, SQL avançado, Security, NoSQL | Pendente externo | Código/contrato da API; services do Web aguardam integração |
| Operações Ágeis, p.8 | PR/code review, cloud, containers; extras README, template PR, pipeline e documento com links | Parcial | README, [template de PR](../.github/PULL_REQUEST_TEMPLATE.md) e [workflow local de qualidade](../.github/workflows/qualidade.yml) preparados; PRs aprovados, execução remota, implantação e infraestrutura dependem do repositório/equipe |
| UX 2º ano, p.9 | Pesquisas, CSD, benchmark, persona, jornada, protótipo mobile, heurística, testes, A/B, features, valor; extras V2/JTBD/UI Kit | Fora do Web | Entregas UX e mobile da equipe |
| Modelagem de Dados, pp.9–10 | 3FN, 500 registros, RPA, Data Mart/ETL, funções, procedures, auditoria, índices; extras catálogo, backup, DAU, CTE | Pendente externo | Banco, scripts e evidências de execução |
| IA 2º ano, p.11 | API IA multiagente (5), LangChain/LangGraph, sessões, memória, MCP/A2A, RAG, juiz, guardrail, observabilidade, arquitetura | Pendente externo | Serviço de IA; [`manuService.ts`](../src/services/manuService.ts) é somente resposta guiada |

## Bloqueios para a versão final integrada

1. Contrato de API e autenticação real, incluindo autorização do gestor, técnico, eventos, perfil e Manu.
2. Tabelas administrativas e contrato de campos acordados com POO/Backend. Acesso TÉCNICO automático e endereço herdado foram confirmados e implementados; a política de senha permanece provisória. Ver [regras do cadastro](./REGRAS_CADASTRO_TECNICOS.md).
3. Fonte analítica, métricas e relatório da equipe de BI.
4. Repositório remoto, hospedagem e URL pública. A pasta recebida não continha `.git`; qualquer histórico iniciado agora tem datas reais e não comprova quatro semanas passadas.
5. Testes de leitor de tela, tablet físico e comparação visual final de todos os estados com Figma. A captura falhou em 25/09 e voltou a funcionar em 26/09; registrar comparações efetivamente realizadas em [QA](./QA_NAVEGADOR.md).

O [inventário granular dos critérios das outras disciplinas](CRITERIOS_EXTERNOS.md) preserva cada exigência como pendência verificável, sem atribuir ao frontend entregas que ele não demonstra.
