# Critérios externos detalhados — PDF interdisciplinar

Revisão das 11 páginas do PDF de 14/05/2026, em 27/09/2026. Esta lista complementa a [matriz Web](MATRIZ_REQUISITOS.md), que contém DAD, Desenvolvimento 1 e BI. Cada linha abaixo permanece pendente de evidência no artefato indicado. Não equivale a uma entrega aprovada da equipe. M = mínimo; E = extra.

**Arquivo atual no Web:** inexistente para os artefatos externos, salvo quando a linha aponta explicitamente para código/documentação deste repositório. **Teste e demonstração:** executar ou apresentar a evidência da última coluna, incluindo seu link direto no documento de entregas da equipe. Nenhum resultado externo foi validado nesta sessão.

| ID / página | Requisito | Estado / artefato esperado | Teste e forma de demonstrar |
| --- | --- | --- | --- |
| BD1-M1 / 1 | Modelo conceitual | Fora do Web / diagrama | Conferir entidades e regras com o projeto |
| BD1-M2 / 1 | Modelo lógico | Fora do Web / diagrama | Conferir dados, chaves e relações |
| BD1-M3 / 1 | Script SQL do banco do primeiro ano; banco independente e consumido por sua série | Pendente externo / SQL | Criar database limpo e executar scripts |
| BD1-E1 / 1 | DEFAULT e CHECK | Pendente externo / SQL | Mostrar valores padrão e rejeição de dados inválidos |
| BD1-E2 / 1 | DataLoad inicial | Pendente externo / SQL | Executar carga e consultar registros |
| BD1-E3 / 1 | Convenção de nomenclatura | Fora do Web / documento | Relacionar nomes do documento ao esquema |
| LP-M1 / 1 | Organização, indentação e nomenclatura | Parcial / src e Prettier | Build, lint e format:check do Web; avaliar também código da disciplina |
| LP-M2 / 1 | Comentários úteis e estrutura clara | Parcial / src | Inspeção das responsabilidades; sem comentários óbvios |
| LP-M3 / 1 | Exceções quando aplicável | Parcial / páginas e services | Erros no DOM; integração externa ainda ausente |
| LP-E1 / 1 | Validação de entradas e nomes adequados | Parcial / src/utils e tests | npm test; regras definitivas da API pendentes |
| POO-M1 / 2 | CRUD administrativo de pelo menos três tabelas em Java | Pendente externo / Java | Demonstrar criar, listar, editar e excluir no banco |
| POO-M2 / 2 | IntelliJ; pacotes servlet, dao e model | Pendente externo / Java | Inspecionar projeto e responsabilidade dos pacotes |
| POO-M3 / 2 | Postgres via JDBC | Pendente externo / Java e SQL | Mostrar conexão e execução real |
| POO-M4 / 2 | Acesso Web em HTML/CSS | Parcial / interface React | Interface existe; vínculo ao sistema Java ainda não |
| POO-M5 / 2 | Servlet para receber/responder HTTP | Pendente externo / Java | Executar requisição e resposta |
| POO-E1 / 2 | CRUD de mais três tabelas | Pendente externo / Java | Demonstrar seis tabelas completas |
| POO-E2 / 2 | Alterar/excluir por campos diferentes | Pendente externo / Java | Executar variações com filtros seguros |
| POO-E3 / 2 | Filtros e informações correlacionadas | Pendente externo / Java | Apresentar consultas relacionais, além dos filtros locais do Web |
| SO-M1 / 2 | Planilha: tarefas/demandas e entregas por participante | Fora do Web / planilha | Mostrar registros reais por pessoa |
| SO-M2 / 2 | Percentual de conclusão e tarefas por situação | Fora do Web / planilha | Conferir fórmulas e totais |
| SO-M3 / 2 | Prazos e manipulação de datas | Fora do Web / planilha | Mostrar cálculo dos prazos |
| SO-M4 / 2 | Validação, proteção de edição e fórmulas | Fora do Web / planilha | Testar valor inválido e célula protegida |
| SO-M5 / 2 | ENVs para banco e APIs externas | Parcial / .env.example e backend | Web documenta URL pública; segredos devem permanecer no backend |
| SO-M6 / 2 | Git/GitHub; remoto criado pelo primeiro ano, membros e Germinatech como colaborador | Pendente externo / GitHub | Conferir remoto e colaboradores; não adicionar sem autorização específica |
| SO-E1 / 2 | Gráficos na planilha | Fora do Web / planilha | Conferir atualização com os dados |
| SO-E2 / 2 | REGEX CPF e/ou celular | Parcial / managementValidation.ts | Telefone validado no Web; testes de entradas válidas/inválidas |
| IIA-M1 / 3 | Memorial: etapas, problemas, contribuição da IA e trabalho sem IA | Pendente externo / memorial | Evidências reais do grupo, sem reconstruir participação inexistente |
| IIA-M2 / 3 | Prompts, resultados após melhorias e justificativas | Pendente externo / memorial | Anexar processo real e mudanças |
| IIA-M3 / 3 | Ferramentas: nome, finalidade e etapa | Pendente externo / memorial | Inventariar todas as ferramentas usadas |
| IIA-M4 / 3 | Validação: erros, conferência, correções e limitações | Pendente externo / memorial | Apontar casos concretos |
| IIA-M5 / 3 | Reflexão: limites, decisões não delegáveis e riscos éticos/sociais | Pendente externo / memorial | Relacionar análise ao projeto |
| IIA-M6 / 3 | Dados pessoais, proteção, LGPD e riscos da IA | Pendente externo / memorial | Explicar fluxo real de dados e controles |
| IIA-E1 / 4 | GEM especializado ligado ao problema | Pendente externo / agente | Demonstrar ao menos um GEM funcional |
| IIA-E2 / 4 | Proposta: problema, público, objetivo e relação com projeto | Pendente externo / memorial | Descrever e comparar com o agente |
| IIA-E3 / 4 | Persona, instruções, comportamento, limitações, formato e regras | Pendente externo / prompt do GEM | Testar respostas adequadas e inadequadas |
| UX1-M1 / 4 | Apresentação com pesquisa qualitativa/quantitativa | Fora do Web / pesquisa | Mostrar resultados e método |
| UX1-M2 / 4 | CSD, benchmark e desk research | Fora do Web / estudos | Vincular fontes e decisões |
| UX1-M3 / 4 | Persona e mapa de empatia | Fora do Web / estudos | Relacionar às necessidades levantadas |
| UX1-M4 / 4 | Jornada e fluxo/site map | Fora do Web / diagramas | Percorrer principais caminhos |
| UX1-M5 / 4 | Testes de usuários: tempo e dificuldade | Fora do Web / relatório | Mostrar participantes, tarefas e resultados reais |
| UX1-M6 / 4 | Protótipo Web de alta fidelidade e análise heurística | Parcial / Figma informado | Implementação consultou Website v2; relatório heurístico não fornecido |
| UX1-E1 / 4 | Priorizar ajustes por severidade pós testes | Fora do Web / matriz | Vincular problema, severidade e ajuste |
| UX1-E2 / 4 | UI Kit / design system | Fora do Web / Figma | Apresentar documentação dos componentes |
| UX1-E3 / 4 | V2 com alterações | Parcial / cópia Website v2 | Confirmar versão e histórico UX com a equipe |
| MPTI-M1 / 5 | Termos de abertura e encerramento | Fora do Web / documentos | Apresentar ambos e seus responsáveis |
| MPTI-M2 / 5 | Ferramentas de gerenciamento no planejamento | Fora do Web / quadro | Mostrar acompanhamento real |
| MPTI-M3 / 5 | Cronograma em ferramenta de planejamento | Fora do Web / cronograma | Comparar planejado e executado |
| MPTI-E1 / 5 | Planejamento e alocação de recursos | Fora do Web / documento | Conferir recursos, pessoas e períodos |
| MPTI-E2 / 5 | Alinhamento ao negócio | Fora do Web / documento | Relacionar objetivos às empresas do grupo |
| BD2-M1 / 5 | MongoDB em interação conversacional | Pendente externo / backend | Persistir e consultar conversa real |
| BD2-M2 / 5 | Redis em fila e/ou ranking em tempo real | Pendente externo / backend | Executar processamento e observar atualização |
| BD2-E1 / 5 | Neo4j: entidades em grafo e pergunta com traversal | Pendente externo / grafo | Executar consulta que percorra relações |
| ES-M1 / 5 | Quadro de planejamento com professor incluído | Pendente externo / quadro | Conferir acesso e atualização |
| ES-M2 / 5 | Documento de requisitos funcionais | Pendente externo / documento | A matriz técnica Web não substitui RF do sistema |
| ES-M3 / 5 | Casos de uso relacionados aos RF | Fora do Web / diagrama | Conferir rastreabilidade de todos os casos |
| ES-M4 / 5 | Dois diagramas de atividades | Fora do Web / diagramas | Demonstrar dois processos do sistema |
| ES-M5 / 5 | Dinâmica e responsáveis por back/front/banco | Pendente externo / documento | Registrar responsabilidades reais |
| ES-E1 / 5 | Padrão de projeto com local/finalidade | Parcial / services e Context | Explicar separação do Web; padrões do sistema ainda dependem do grupo |
| ES-E2 / 5 | Padrão de testes, local e aplicação | Parcial / tests | Testes automatizados reais; não afirmar TDD retrospectivamente |
| MOBILE-M1 / 5 | Controle de acesso | Fora do Web / app | Testar no aplicativo móvel |
| MOBILE-M2 / 6 | Recurso de hardware: câmera/telefone/SMS | Fora do Web / app | Executar em dispositivo |
| MOBILE-M3 / 6 | Consumo de API | Fora do Web / app | Demonstrar requisição e resposta |
| MOBILE-M4 / 6 | Persistência Firebase ou SQLite | Fora do Web / app | Reiniciar app e conferir dados |
| MOBILE-M5 / 6 | Chatbot operacional | Fora do Web / app | Percorrer conversa real |
| MOBILE-E1 / 6 | Avatar no perfil | Fora do Web / app | Alterar e carregar avatar |
| MOBILE-E2 / 6 | Notificações | Fora do Web / app | Receber notificação no dispositivo |
| MOBILE-E3 / 6 | Ajuste celular e tablet | Fora do Web / app | Testar ambos fisicamente |
| MOBILE-E4 / 6 | GPS | Fora do Web / app | Autorizar e verificar posição no fluxo |
| DEV2-M1 / 6 | API REST Java Spring MVC e Postgres | Pendente externo / backend | Executar API e consultas reais |
| DEV2-M2 / 6 | Spring Data JPA | Pendente externo / backend | Conferir entidades e repositórios |
| DEV2-M3 / 6 | CRUD via API | Pendente externo / backend | Demonstrar todas as operações |
| DEV2-M4 / 6 | Pacotes MVC | Pendente externo / backend | Conferir responsabilidades |
| DEV2-M5 / 6 | Validação e integridade das entradas | Pendente externo / backend | Enviar dados inválidos e conferir rejeição |
| DEV2-M6 / 6 | Exceções centralizadas e HTTP útil | Pendente externo / backend | Testar validação, conflito e falha de banco |
| DEV2-E1 / 6 | Swagger: endpoints, parâmetros e respostas | Pendente externo / documentação | Executar exemplos do contrato |
| DEV2-E2 / 6 | Procedures e Functions da Modelagem | Pendente externo / backend e SQL | Evidenciar chamadas e resultados |
| DEV2-E3 / 6 | Spring Security autenticação/autorização | Pendente externo / backend | Testar acesso permitido e negado por papel |
| DEV2-E4 / 6 | Outra API REST Java Spring MVC / NoSQL | Pendente externo / backend | Executar segundo recurso e banco |
| OA-M1 / 8 | Code review, pull requests e aprovações | Pendente externo / GitHub | Mostrar PRs reais com revisão |
| OA-M2 / 8 | Hospedagem cloud | Pendente externo / deploy | Abrir URL publicada |
| OA-M3 / 8 | Containers e orquestração | Pendente externo / infraestrutura | Mostrar configuração e execução |
| OA-E1 / 8 | README completo | Parcial / README.md | Documento Web preparado; preencher URLs e validar publicação |
| OA-E2 / 8 | Template de PR aplicado | Parcial / `.github/PULL_REQUEST_TEMPLATE.md`; aplicação pendente em GitHub | Mostrar template usado em PR real |
| OA-E3 / 8 | Pipeline de implantação | Pendente externo / deploy; workflow local de qualidade em `.github/workflows/qualidade.yml` | Demonstrar pipeline de **implantação** e resultado real; configuração local de qualidade não comprova deploy |
| OA-ENTREGA / 8 | Documento de entregas com links diretos | Parcial / matriz e roteiro | Completar links externos e URLs após entrega |
| UX2-M1 / 9 | Pesquisa qualitativa/quantitativa, CSD, benchmark e desk research | Fora do Web / apresentação | Conferir evidências e fontes |
| UX2-M2 / 9 | Persona/empatia, jornada e fluxo/site map | Fora do Web / estudos | Percorrer e relacionar aos dados |
| UX2-M3 / 9 | Protótipo mobile de alta fidelidade | Fora do Web / Figma mobile | Demonstrar navegação do protótipo |
| UX2-M4 / 9 | Análise heurística | Fora do Web / relatório | Apontar problemas e recomendações |
| UX2-M5 / 9 | Testes com usuários: tempo/dificuldade | Fora do Web / relatório | Evidenciar sessões reais |
| UX2-M6 / 9 | A/B e priorização por severidade | Fora do Web / relatório | Comparar alternativas e decisões |
| UX2-M7 / 9 | Mapa de features core/adjacente/transformacional | Fora do Web / mapa | Relacionar às funcionalidades |
| UX2-M8 / 9 | Matriz de proposta de valor | Fora do Web / matriz | Relacionar público, dores e benefícios |
| UX2-E1 / 9 | V2 e nova documentação de testes | Fora do Web / protótipo e relatório | Evidenciar alterações e nova rodada |
| UX2-E2 / 9 | JTBD, jornada ideal e melhorias | Fora do Web / relatório | Comparar jornadas e oportunidades |
| UX2-E3 / 9 | UI Kit documentado | Fora do Web / design system | Mostrar tokens e componentes |
| MD-M1 / 9 | Novo Postgres até 3FN (5FN se necessário) | Pendente externo / esquema | Justificar normalização |
| MD-M2 / 9 | PKs, FKs e cardinalidades 1:1, 1:N, N:N | Pendente externo / modelo | Conferir esquema e restrições |
| MD-M3 / 9 | Carga com ao menos 500 registros verossímeis | Pendente externo / SQL | Contar registros e testar volume |
| MD-M4 / 9 | RPA legado → banco novo com integridade e falhas | Pendente externo / automação | Executar carga e falha controlada |
| MD-M5 / 9 | Views analíticas e modelagem dimensional Star/Snowflake | Pendente externo / Data Mart | Consultar fonte do dashboard |
| MD-M6 / 9 | CTEs nas transformações | Pendente externo / SQL | Executar transformação |
| MD-M7 / 9 | Window Functions: total/ranking nas views BI | Pendente externo / SQL | Conferir cálculo com amostra |
| MD-M8 / 10 | Duas Functions e duas Procedures | Pendente externo / SQL | Executar regras críticas |
| MD-M9 / 10 | Auditoria em duas tabelas: NEW/OLD/TG_OP/CURRENT_USER | Pendente externo / SQL | Atualizar dados e consultar logs |
| MD-M10 / 10 | EXPLAIN ANALYZE e índices | Pendente externo / SQL | Comparar consulta antes/depois |
| MD-E1 / 10 | Catálogo: tabelas/colunas/regras/acesso | Pendente externo / metadados | Consultar catálogo técnico |
| MD-E2 / 10 | Backup e recuperação documentados | Pendente externo / procedimento | Executar restauração de teste |
| MD-E3 / 10 | DAU automático no Postgres | Pendente externo / SQL | Conferir acessos diários |
| MD-E4 / 10 | CTE recursiva ou herança, onde fizer sentido | Pendente externo / SQL | Justificar e executar uso real |
| BI-E1 / 10–11 | Pipeline Databricks: ler/tratar/transformar/calcular/salvar | Pendente externo / pipeline | Executar sobre dados da aplicação |
| BI-E2 / 10–11 | Job manual/agendado; dashboard pela base final | Pendente externo / job e base | Mostrar conexão com resultado do pipeline |
| BI-E3 / 11 | Configuração, histórico, status e resultado do job | Pendente externo / evidências | Apresentar execução real |
| BI-E4 / 11 | Relatório explica automação e relação com KPIs | Pendente externo / relatório | Percorrer fluxo de origem até visualização |
| IA-M1 / 11 | API FastAPI/Flask com modelo, escopo e custos assumidos pelo grupo | Pendente externo / API IA | Executar conversa; escola não paga API |
| IA-M2 / 11 | Ao menos cinco agentes | Pendente externo / serviço IA | Mostrar papéis e colaboração real |
| IA-M3 / 11 | LangChain para agentes | Pendente externo / serviço IA | Inspecionar e executar agentes |
| IA-M4 / 11 | LangGraph para orquestração | Pendente externo / serviço IA | Demonstrar fluxo e estados |
| IA-M5 / 11 | Sessões por usuário | Pendente externo / serviço IA | Testar isolamento de dois usuários |
| IA-M6 / 11 | Memória de longo prazo | Pendente externo / serviço IA | Retomar conversa persistida |
| IA-M7 / 11 | Integração MCP/A2A externa | Pendente externo / serviço IA | Executar integração entre sistemas/agentes |
| IA-M8 / 11 | RAG com indicação e consumo de pelo menos uma fonte externa | Pendente externo / serviço IA | Conferir fonte e resposta fundamentada |
| IA-M9 / 11 | Agente juiz contra alucinações | Pendente externo / serviço IA | Demonstrar avaliação/correção |
| IA-M10 / 11 | Guardrail | Pendente externo / serviço IA | Testar entrada/saída inadequada |
| IA-M11 / 11 | Observabilidade: custo 100/1000 usuários semanais, latência interagentes/total, erros, ROI e custo/resolução | Pendente externo / métricas | Mostrar cálculos e medições reais |
| IA-M12 / 11 | Arquitetura de alto nível | Fora do Web / diagrama | Relacionar desenho à execução |
| IA-E1 / 11 | Complexidade do projeto | Pendente avaliação / sistema | Professor avalia a solução completa |

A Manu local é um guia de respostas estáticas com histórico em memória; não atende aos critérios de API IA, cinco agentes, RAG ou persistência. Os testes de viewports do Web não comprovam o aplicativo mobile nem tablet físico.
