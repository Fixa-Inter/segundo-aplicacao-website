# Validação de DAD e acesso — 26/10/2026

## Conclusão

**Ainda não é possível declarar todos os critérios de DAD cumpridos nem certificar acessibilidade integral.** Os testes executados passaram após correções de contraste, foco e nomes acessíveis. A API Web publicada autenticou Gestor e RH. Permanecem pendências de organização do código, demonstração de rota parametrizada, publicação da Web e extras; a IA continua recusando o RH.

A [matriz atual](MATRIZ_REQUISITOS.md) relaciona separadamente os **14 mínimos e 10 extras** das páginas 6–8. Critérios parcialmente comprovados não foram convertidos em aprovação por suposição.

## Fonte e rastreabilidade

- Documento fornecido: Requisitos por disciplina — Interdisciplinar — Maio2026 (5).pdf, cabeçalho 14/05/2026, 11 páginas; DAD nas páginas 6–8, extraídas e inspecionadas visualmente.
- SHA-256 do PDF: `418CCDE9BC1466B868AA47467D7B3D81D36DA4E6F21D65C0C51849E19C39D82F`.
- Base Git examinada: `5897c82`, branch `feature/integracao-ia-manu`, acrescida das correções descritas abaixo.
- Atividade registrada antes da execução na [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12#issuecomment-6429611959), início 20:16:56 de 26/10/2026, America/Sao_Paulo.
- Não houve novo PR, merge, deploy, alteração de backend nem gravação operacional no banco compartilhado nesta rodada. Autenticação/renovação/logout e consultas reais foram permitidos; alterações de formulários foram testadas com respostas controladas.

## Problemas corrigidos

| Problema observado                                                               | Correção                                                                                                         |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Branco sobre azul claro nos cabeçalhos de tabelas (aproximadamente 2,06:1)       | Texto azul escuro no tema claro, branco sobre azul escuro no tema escuro; fundo original preservado.             |
| Texto branco em alguns botões de Perfil/Recuperação (aproximadamente 3,46:1)     | Token de ação com azul mais escuro e hover correspondente.                                                       |
| Nome acessível dos dias da Home não incluía exatamente o texto abreviado visível | Aria-label contém o dia abreviado, número e data completa; espaço explícito entre os textos.                     |
| Foco dos campos de autenticação pouco evidente, especialmente em erro            | Anel de foco de 3px em focus-visible.                                                                            |
| Três contratos de props definidos fora de types                                  | InformationItemProps, TechnicianPerformanceProps e UnsavedChangesProviderProps centralizados em src/types/ui.ts. |
| Matriz e roteiro ainda descreviam o protótipo com mocks                          | Documentação atualizada para a integração AWS, sem credenciais fictícias apresentadas como login válido.         |

A revisão manual também corrigiu agrupamentos de dias e eventos em Home/Calendário com papéis semânticos adequados. Na Equipe, o nome completo passou a existir como texto acessível, separado do texto visual truncado, sem aria-label em elemento genérico.

As capturas abaixo usam **dados sintéticos**, servidos ao build de produção, e foram inspecionadas visualmente:

- [Perfil](evidencias/validacao-dad-2026-10-26/final-profile.png).
- [Equipe RH](evidencias/validacao-dad-2026-10-26/final-team.png).
- [Resumo técnico sem credenciais](evidencias/validacao-dad-2026-10-26/resumo.json).

## Verificações executadas

| Verificação          | Resultado e limite                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run format:check | Aprovado.                                                                                                                                                                                                |
| npm run lint         | Aprovado, incluindo regras de hooks.                                                                                                                                                                     |
| npm test             | **114 aprovados, zero falhas**, zero ignorados. Há testes com fixtures antigas e testes de contrato HTTP controlado; não equivalem a 114 testes contra a AWS.                                            |
| npm run build        | Aprovado; TypeScript e build de produção.                                                                                                                                                                |
| npm audit --omit=dev | Zero vulnerabilidades reportadas para dependências de produção na consulta. Não é certificação geral de segurança.                                                                                       |
| Inspeção estática    | 85 fontes TS/TSX, sem JS/JSX ou any; 24 efeitos com dependências explícitas; sem fetch nas views, dangerouslySetInnerHTML ou atribuição a window.location.href.                                          |
| axe-core 4.14.0      | **72 cenários, zero violações detectadas após as correções**. Antes: 139 ocorrências repetidas de nós, concentradas em contraste e nome visível/acessível dos dias; não eram 139 defeitos independentes. |
| Teclado              | Login inválido; editar/cancelar/descartar perfil; Escape preservando edição; contenção de foco e retorno ao acionador; abas RH com setas/Home/End; detalhes; filtro; Drawer móvel.                       |
| Rotas privadas       | Oito rotas redirecionaram ao login sem sessão. API Web recusou consulta anônima a /api/v1/perfil com 401.                                                                                                |
| XSS dirigido         | Valor externo contendo tag de imagem e handler foi exibido como texto; nenhum elemento/handler executável criado.                                                                                        |
| Lazy loading         | Build servido localmente: seis chunks de página obtidos após navegar para Dashboard, Equipe, Calendário, Perfil, Manu e Configurações. Ausentes Team/Calendar/Manu no carregamento inicial do Login.     |
| AWS real             | **28 visitas**: sete rotas, dois perfis, larguras 1440 e 390. Login de ambos funcionou; sem erros JS, transbordamento horizontal ou loading preso. Preferências persistiram e logout retornou 204.       |

Os cenários axe incluíram páginas públicas, páginas privadas dos dois perfis, desktop/celular, temas claro/escuro e estados adicionais de formulário/detalhes/erro. O motor também marcou 23 ocorrências repetidas de regras como “incomplete”, exigindo julgamento manual; não foram tratadas como aprovação automática. Nem toda combinação foi repetida em todos os temas e tamanhos. A leitura real AWS usou os temas/preferências de seu próprio navegador de teste.

## Pendências encontradas

### Critérios mínimos e organização

1. **M3:** EventForm e TechnicianForm ainda importam services; extrair carregamentos e orquestração para hooks/controladores para atender à redação literal do PDF.
2. **M5:** apiManagement.ts reúne usuários, turnos, unidades, competências e eventos; dividir o adaptador por recurso mantendo o transporte centralizado.
3. **M9:** não existe useParams ou rota parametrizada. Detalhes/edição estão em estado local de /equipe. Uma rota adequada precisa tratar parâmetro ausente e registro inexistente; alternativamente, confirmar a aplicabilidade com o professor. A ausência de uso não comprova esse item.
4. **M13:** não foi encontrada URL pública da Web; o usuário informou que provavelmente ainda não foi publicada. Configuração vercel.json e APIs na AWS não substituem o frontend acessível ao vivo e link no README.
5. **M11:** os cenários automatizados e dirigidos passaram, mas não cobrem uma certificação WCAG completa, todo o conteúdo remoto ou todas as interações possíveis.

### Extras e apresentação

- State do reducer de autenticação ainda é interface; Action é union. Atender à exigência literal e explicar a complexidade real do estado.
- Preferências têm validação/migração, mas não o campo `_versao` solicitado para localStorage.
- useMemo/useCallback existem; falta comprovação comparativa no React DevTools Profiler.
- Fazer demonstrações orais de Context/prop drilling, reducer, dependências de useEffect e Network de lazy loading.
- Executar NVDA/VoiceOver e revisar todos os landmarks/ARIA, incluindo a experiência nos iframes.
- Validações tipadas passaram nos casos cobertos; não foi executada uma prova exaustiva de todas as entradas/combinações.

### Serviços externos

- **IA para RH:** GET /api/v1/sessoes retornou **403 — “Usuário sem permissão de acesso.”** no proxy para a IA publicada. O histórico do Gestor retornou **200**. O Authorization Bearer enviado à IA foi comparado em memória com o enviado ao perfil Web e era o mesmo para cada conta. Não há token nas evidências versionadas. Solicitar ao responsável a liberação/compatibilidade do perfil RH/ADMINISTRADOR e revalidar.
- **Databricks:** os iframes reais da Home e do técnico pediram login no perfil de QA. Isso limita a verificação atual, sem comprovar defeito nos gráficos. A renderização autenticada relatada/testada em rodadas anteriores é histórica; precisa ser repetida na apresentação.
- **Persistência real de CRUD:** não alteramos técnicos, competências, eventos, e-mail ou senhas no banco compartilhado nesta rodada. Testes de criação/edição/exclusão e falhas usam contratos controlados ou registros históricos, identificados como tais. Homologar escritas em ambiente/contas de teste antes de produção.

## Limites das evidências

- O axe examinou a interface própria com iframes internos excluídos; o conteúdo Databricks não é acessível para essa auditoria a partir da origem da Web.
- Nos testes gerais de rotas e contraste, o conteúdo remoto do BI foi controlado para não confundir erro de autenticação do fornecedor com falha da página. A sondagem real de BI está registrada separadamente.
- Não foram executados leitor de tela, dispositivo físico, testes completos de penetração, auditoria integral de segredos no histórico ou compatibilidade com todos os navegadores.
- Somente arquivos de exemplo de ambiente são rastreados; a busca dirigida no conteúdo atual não encontrou os padrões de segredo examinados. Isso não permite garantir ausência de qualquer segredo em todo o histórico.
- O inventário Git antes desta alteração tinha 106 commits, 102 convencionais, com 61,46 dias entre o primeiro e último convencional. O commit inicial e três merges foram identificados separadamente.
- Outros requisitos interdisciplinares exigem artefatos da equipe e não foram aprovados por esta revisão de DAD.

## Reprodução e próximos passos

Use Node.js 24, instale as dependências e configure .env.local conforme o README. Execute os quatro comandos de qualidade e `npm run dev`; acesse http://localhost:5173. Para testar as integrações, use contas autorizadas fornecidas por canal privado e autentique-se no Databricks no mesmo navegador.

Siga o [roteiro de demonstração](ROTEIRO_DAD.md). Os logs detalhados desta máquina permanecem em `dev.local/dad-validation/`, ignorado pelo Git, sem distribuir perfis de navegador, tokens ou credenciais. O resumo versionado conserva métricas, limites e a evidência de carregamento dos chunks.

Prioridade: corrigir autorização do RH na IA; resolver os mínimos M3/M5/M9 e publicar/homologar o frontend; completar evidências de acessibilidade e apresentação. Extras devem ser concluídos conforme a meta acadêmica do grupo, sem transformar este relatório em aprovação presumida.
