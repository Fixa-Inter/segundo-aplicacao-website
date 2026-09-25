# Matriz de requisitos e evidências — FIXA Web

Fonte: **Requisitos por disciplina — Interdisciplinar — 14/05/2026**, 11 páginas. Esta matriz separa o que a aplicação React pode demonstrar do que depende do backend, de outras entregas da equipe ou de publicação. O Figma de referência é a [cópia Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628).

**Estados:** `Validado` = verificação executada e descrita; `Implementado, QA pendente` = existe código mas ainda não há evidência suficiente; `Parcial` = só a demonstração local existe; `Pendente externo` = depende de API, dados reais, hospedagem, processo de equipe ou outro repositório; `Fora do Web` = pertence a outra disciplina/artefato.

## Desenvolvimento de Aplicações Dinâmicas — páginas 6–8

| Critério do PDF | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Vite + React + TypeScript; apenas `.ts`/`.tsx` em `src` | Validado | [`package.json`](../package.json), [`src`](../src) | `npm run build`; inventário `rg --files src` sem `.js`/`.jsx` |
| Componentes e páginas em pastas próprias com `index.tsx`; ao menos 6 componentes de responsabilidade única | Parcial | [`src/components`](../src/components), [`src/pages`](../src/pages) | Estrutura revisada; alguns módulos novos concentram formulários e visualização e ainda merecem extração antes da rubrica estrita de seis componentes |
| Props e entidades tipadas em `src/types`, sem `any` | Parcial | [`src/types`](../src/types) | Build com TypeScript estrito; props dos componentes antigos tipadas, mas revisão manual completa das novas páginas ainda pendente |
| Comunicação externa em `services`, `Promise<T>`, `try/catch`, sem `fetch` em páginas, URLs privadas fora do código | Parcial | [`managementService.ts`](../src/services/managementService.ts), [`manuService.ts`](../src/services/manuService.ts), [`.env.example`](../.env.example) | Services locais tipados; **não há API externa nem contrato**. Integrar e testar respostas HTTP quando houver backend |
| `useState`, campos agrupados, sem mutação direta | Implementado, QA pendente | [`Team`](../src/pages/Team/index.tsx), [`Calendar`](../src/pages/Calendar/index.tsx), [`Profile`](../src/pages/Profile/index.tsx) | Revisão de código e build; mutações do mock substituem arrays/objetos |
| `useEffect` com dependências corretas | Implementado, QA pendente | páginas de Dashboard, Equipe, Calendário e Perfil | Efeitos de carga inicial com cancelamento local; revisão dinâmica ao vivo pendente |
| Listas com `key` de ID estável | Implementado, QA pendente | tabelas, eventos, conversas | Revisão de código; cadastro em Equipe verificado no navegador |
| `useParams` com verificação de parâmetro | Não aplicável | Nenhuma rota usa parâmetro dinâmico | Se forem criadas rotas de detalhe, implementar com guarda para `undefined` |
| 3+ rotas, `Link`/`useNavigate`, rota curinga e retorno | Validado | [`App.tsx`](../src/App.tsx), [`NotFound`](../src/pages/NotFound/index.tsx) | Login → Home e navegação entre telas; URL inexistente levou à 404 com link de retorno no navegador |
| WCAG 2.1 AA mínima, contraste, labels, alt, teclado, foco, erros `role=alert` | Parcial | [`index.css`](../src/index.css), [`AuthField`](../src/components/AuthField/index.tsx), páginas e modais Mantine | Labels/erros do cadastro vistos na árvore acessível; auditoria de contraste, Tab completo e leitor de tela pendentes |
| Carregando/sucesso/erro no DOM, sem `alert()`/`console.log` como tratamento | Parcial | páginas e services | Estados de login, Dashboard e Equipe vistos no navegador; falhas de rede reais não podem ser simuladas sem API |
| Publicação em Vercel ou GitHub Pages e link no README | Pendente externo | [`README.md`](../README.md) | Não há URL de deploy; validar site ao vivo depois de publicar |
| 20 commits Conventional Commits em quatro semanas reais | Pendente externo | Histórico Git local iniciado nesta entrega | Commits reais em português; não é permitido criar datas ou commits retroativos. Verificar `git log` e duração real antes da avaliação |
| Extra: Context API, Provider e hook | Validado em código | [`AuthContext.tsx`](../src/contexts/AuthContext.tsx), [`useAuth.ts`](../src/contexts/useAuth.ts) | Build; login demonstrativo no navegador |
| Extra: `useReducer` com `State` e `Action` union | Validado em código | [`auth.ts`](../src/types/auth.ts), [`AuthContext.tsx`](../src/contexts/AuthContext.tsx) | Build; login/logout ainda precisam de roteiro integral de teclado |
| Extra: hook com loading/erro/AbortController | Pendente | Não implementado | Exige fonte cancelável para evitar abstração artificial no mock |
| Extra: `React.lazy` e `Suspense` por página | Validado em código | [`App.tsx`](../src/App.tsx) | Chunks separados no build; aba Network do DevTools ainda não verificada |
| Extra: `localStorage` versionado | Pendente | Sessão, perfil e conversas ficam somente em memória | Implementar apenas com decisão de privacidade e necessidade real; não salvar senhas/chats por padrão |
| Extra: `useCallback`/`useMemo` com perfil de performance | Pendente | Não introduzidos sem medição | Demonstrar no Profiler se houver gargalo real |
| Extra: proteção XSS via JSX, sem `dangerouslySetInnerHTML` | Implementado, QA pendente | páginas de Equipe, Calendário e Manu | Revisar `rg` e testar texto com caracteres especiais |
| Extra: validação/sanitização tipada dos formulários | Parcial | [`managementValidation.ts`](../src/utils/managementValidation.ts), [`validation.ts`](../src/utils/validation.ts) | `npm test` valida técnico, evento, perfil e datas; ainda falta validar todas as regras definitivas da API |
| Extra: `PrivateRoute` + Context | Validado em código | [`PrivateRoute.tsx`](../src/routes/PrivateRoute.tsx) | Acesso por login verificado; testar tentativa de URL privada sem sessão |
| Extra: ARIA avançada e leitor de tela | Parcial | Drawer/Modal Mantine, navegação e mensagens | Teste completo com NVDA/VoiceOver pendente |

## Desenvolvimento 1 e operações Web — páginas 1–2

| Critério | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Landing page sobre o projeto | Validado | [`About`](../src/pages/About/index.tsx), rota `/sobre` | Aberta no navegador em 1340 × 800, 800 × 1340 e 390 × 844; links de acesso na árvore acessível |
| CRUD das tabelas administrativas definidas em POO | Parcial | CRUD de técnicos e eventos em [`managementService.ts`](../src/services/managementService.ts) e páginas | Cadastro de técnico e validação verificados no navegador; **não há Postgres/Servlet nem terceira tabela definida** |
| GitHub + hospedagem estática + links | Pendente externo | Build Vite disponível | Repositório remoto e deploy não foram fornecidos; testar URL pública |
| Responsividade e fidelidade ao protótipo UX | Parcial | CSS Modules e assets originais em [`src/assets/figma`](../src/assets/figma) | [QA no navegador](./QA_NAVEGADOR.md): sem rolagem horizontal no documento ou imagens quebradas nas três resoluções; captura visual falhou, comparação final pendente |
| Documento detalhado de entregas com links | Parcial | Esta matriz, [`ROTEIRO_DAD.md`](./ROTEIRO_DAD.md) e [`QA_NAVEGADOR.md`](./QA_NAVEGADOR.md) | Documentos criados; preencher URLs do repositório e site após publicação |

## Business Intelligence — páginas 10–11

| Critério | Estado | Implementação / arquivo | Teste e demonstração |
| --- | --- | --- | --- |
| Conectividade com dados gerados pela aplicação | Pendente externo | [`getDashboard`](../src/services/managementService.ts) devolve fixture tipada | Substituir pelo Data Mart/API e validar origem/atualização |
| Gráfico de barras e linha | Implementado, QA pendente | [`Dashboard`](../src/pages/Dashboard/index.tsx) | Renderização observada no navegador; checar mobile/tablet |
| KPIs e desvios | Parcial | Cards de totais, taxa e tempo médio no Dashboard | Fórmulas demonstrativas; desvios de referência ainda não definidos |
| Histograma e boxplot | Implementado, QA pendente | Dashboard, alternativas textuais `role=img` | Build e árvore acessível; revisar distribuição com base real |
| Mapas, se aplicável | Não aplicável até definição | Não há dados geográficos analíticos | Perguntar à equipe de BI se há dimensão espacial |
| Filtros interativos | Parcial | Período e métrica no Dashboard | Valores do período exibidos no navegador; fonte ainda é mock |
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
| Operações Ágeis, p.8 | PR/code review, cloud, containers; extras README, template PR, pipeline e documento com links | Parcial | README deste projeto; PRs aprovados, infraestrutura e pipeline dependem do repositório remoto/equipe |
| UX 2º ano, p.9 | Pesquisas, CSD, benchmark, persona, jornada, protótipo mobile, heurística, testes, A/B, features, valor; extras V2/JTBD/UI Kit | Fora do Web | Entregas UX e mobile da equipe |
| Modelagem de Dados, pp.9–10 | 3FN, 500 registros, RPA, Data Mart/ETL, funções, procedures, auditoria, índices; extras catálogo, backup, DAU, CTE | Pendente externo | Banco, scripts e evidências de execução |
| IA 2º ano, p.11 | API IA multiagente (5), LangChain/LangGraph, sessões, memória, MCP/A2A, RAG, juiz, guardrail, observabilidade, arquitetura | Pendente externo | Serviço de IA; [`manuService.ts`](../src/services/manuService.ts) é somente resposta guiada |

## Bloqueios para a versão final integrada

1. Contrato de API e autenticação real, incluindo autorização do gestor, técnico, eventos, perfil e Manu.
2. Tabelas administrativas e regras de cadastro acordadas com POO/Backend; o formulário do Figma contém campos cuja persistência e política de senha ainda não foram definidas.
3. Fonte analítica, métricas e relatório da equipe de BI.
4. Repositório remoto, hospedagem e URL pública. A pasta recebida não continha `.git`; qualquer histórico iniciado agora tem datas reais e não comprova quatro semanas passadas.
5. Testes de leitor de tela, tablet físico e comparação visual final de todos os estados com Figma. Os viewports foram medidos no navegador, mas a captura visual falhou nesta sessão.
