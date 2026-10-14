# Revisão do Website v2 — 06/10/2026

**Registro histórico:** decisões de confirmações, calendário resumido, ações e troca de senha foram atualizadas na [revisão de 07/10/2026](REVISAO_DESIGN_2026-10-07.md).

Referência: [Figma acadêmico, Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628). Os frames foram consultados em leitura, sem modificar o arquivo. Esta revisão atende às diferenças apontadas pela designer e **substitui as decisões anteriores sobre o seletor da Home**. Os services continuam demonstrativos, sem endpoints inventados.

## Alterações e verificação

| Parte / frame | Implementação | Verificação executada / demonstração |
| --- | --- | --- |
| Home / `5631:5743` | [`Home`](../src/pages/Home/index.tsx): resumo de segunda a sexta, mês com setas, seleção de dia e link para o Calendário; retirado WeekPicker. Painéis na proporção 700:360, seleção envolvendo dia e rótulo, cores e ícones originais | Comparação com o frame em 1440 × 1024; cabe em 1280 × 720 e 1340 × 800. Selecionar dia e abrir seu evento no Calendário |
| Sidebar e header / frames principais | [`AppLayout`](../src/components/AppLayout/index.tsx), [`Brand`](../src/components/Brand/index.tsx), [`FigmaIcon`](../src/components/FigmaIcon/index.tsx): símbolos e ícones originais, incluindo Manu e estados ativos; header e main compartilham largura e margem. Ações das páginas usam a posição do protótipo no header | Em 1440 × 1024, extremidade direita do banner e avatar em x=1384. Recolher/expandir menu observado; sem sobreposição dos títulos |
| Equipe / `5631:6232` | [`Team`](../src/pages/Team/index.tsx), [`FilterButton`](../src/components/FilterButton/index.tsx), [`Pagination`](../src/components/Pagination/index.tsx): Filtrar com funil, cabeçalhos brancos, cores das linhas, lápis/lixeira originais, páginas numeradas e setas sem texto | Filtrar Inativo exibiu Diego; Escape retornou foco ao filtro. Página 2 mostrou Elisa/Fábio; anterior restaurou página 1. Edição de Ana salva; cadastro com TÉCNICO e endereço somente para leitura conferido |
| Excluir e sair / `5631:7380`, `7373` | [`ConfirmDialog`](../src/components/ConfirmDialog/index.tsx): superfície, proporções, pergunta e botões do protótipo; nome acessível e descrição identificando o registro | Cancelar conservou Diego e devolveu foco. Confirmar removeu o registro de demonstração. Sair retornou ao Login; novo login restaurou fixtures |
| Calendário e informações / `5631:6796`, `7387` | [`Calendar`](../src/pages/Calendar/index.tsx), [`EventDetails`](../src/components/EventDetails/index.tsx): cores de grade, dia selecionado e registros; clicar no registro abre modal com local/data/horário/descrição/observação | Reunião de equipe abriu os dados corretos. Fechar e Escape retornaram foco ao registro. Modal adaptado e inteiramente acessível em 390 × 844; inglês e mandarim/tema escuro conferidos |
| Dashboard / `5631:5998` | [`Dashboard`](../src/pages/Dashboard/index.tsx): Técnico em botão azul, Filtrar, superfícies neutras, valores azuis, anéis verde e ciano/azul; barras e dispersão nos primeiros painéis | Comparação em 1440 × 1024; filtros alteraram indicadores e amostras. Sem transbordamento horizontal em 1340 × 800, 800 × 1340 e 390 × 844 |
| Perfil e senha / `5631:6890`, `6981`, `5714` | [`Profile`](../src/pages/Profile/index.tsx): tipografia, cores, lápis original, calendário/localização corretos; troca de senha em página com arte original, em vez de modal genérico | Página de senha cabe em 1280 × 720. Submit vazio focou senha atual; voltar restaurou foco em Alterar senha. Nenhuma credencial real foi alterada |
| Cadastro, edição e recuperação / `5631:6389`, `6522`, `7099`, `7208`, `5663` | [`TechnicianForm`](../src/components/TechnicianForm/index.tsx), [`EventForm`](../src/components/EventForm/index.tsx), [`Recovery`](../src/pages/Recovery/index.tsx): alinhamento, títulos, ícone original de retorno e cores | Frames de formulário consultados, retorno e edição de técnico percorridos. Regras confirmadas do cadastro preservadas; validações existentes continuam nos testes |
| Manu / `5631:5893` | [`Manu`](../src/pages/Manu/index.tsx): ícones originais de busca/anexo/novo chat/envio; adaptação de altura em tablet e celular | Enter enviou e limpou campo; Shift+Enter inseriu linha. Novo chat habilitou após mensagem e ficou desabilitado ao reiniciar. Saudação preservada; compositor visível em tablet/celular |

## Assets originais

Exportações retornadas pelo contexto de design foram salvas em [`src/assets/figma`](../src/assets/figma), sem redesenhar seus traços e sem URL temporária em runtime:

- 36 SVGs em `icons/`: navegação e variantes ativas dos frames principais; customizados Manu `5631:5890`/`5984` e Calendário ativo `7997`; ações da Home `5743`, Equipe `6232`, modal de evento `7387`, Perfil `6890`/`8210` e Manu `5893`.
- `sidebar-logo.svg` e `sidebar-logo-compact.svg`: versões vetoriais originais dos menus; substituem o recorte do raster usado antes.
- `manu-change-password.png`: ilustração original da página `5631:5714`.
- Retorno dos formulários/recuperação baseado no nó `5631:5676`. Banner, avatar e artes já existentes foram preservados.

Os ícones decorativos têm `alt=""`; nomes acessíveis permanecem nos controles. As versões coloridas originais são usadas no tema claro; o tema escuro adapta a visibilidade por CSS.

## Evidência no navegador

Execução local no navegador integrado, usando dados fictícios. Capturas em [`evidencias/design-2026-10-06`](evidencias/design-2026-10-06); medidas em [`medidas.json`](evidencias/design-2026-10-06/medidas.json). São capturas da janela, não imagens de todas as áreas roláveis.

| Janela | Resultado observado |
| --- | --- |
| 1440 × 1024 | Referência para comparar composição, tipografia, ícones, cores, modais e formulários com os frames; Home sem rolagem |
| 1280 × 720 | Home, Equipe e Manu: área/conteúdo 640/640 px. Calendário, Perfil e página de senha também percorridos sem corte no estado inicial |
| 1340 × 800 | Home, Equipe, Calendário, Perfil e Manu: 720/720 px; sem transbordamento horizontal/imagens quebradas. Dashboard permite acessar gráficos adicionais abaixo do header |
| 800 × 1340 | Home, Equipe, Calendário e Perfil: 1260/1260 px. Manu conferida após correção de altura, compositor visível; Dashboard: 1260/1824 px, sem transbordamento horizontal |
| 390 × 844 | Todas as seis páginas principais conferidas sem transbordamento horizontal nem imagens quebradas. Home/Equipe/BI usam rolagem abaixo do header; Calendário/Perfil/Manu cabem no estado inicial. Modal de evento adaptado para uma coluna |

Capturas úteis: [Home](evidencias/design-2026-10-06/home-1340x800.jpg), [Equipe](evidencias/design-2026-10-06/equipe-1440x1024.jpg), [Dashboard](evidencias/design-2026-10-06/dashboard-1440x1024.jpg), [evento](evidencias/design-2026-10-06/evento-1340x800.jpg), [exclusão](evidencias/design-2026-10-06/excluir-1280x720.jpg), [Manu no celular](evidencias/design-2026-10-06/manu-390x844.jpg).

Após recarga limpa, navegação e filtros sem erros/avisos no console. Durante a edição com hot reload ocorreu erro transitório de contexto de preferências; ele não se repetiu após recarga e nova sessão. **Build, lint, Prettier e 27/27 testes Node aprovados.**

## Adaptações preservadas e limites

1. Home voltou aos cinco dias do frame por solicitação mais recente. Eventos de sábado/domingo ficam no Calendário completo, que mantém todos os dias reais do mês e navegação; a grade ilustrativa do frame não contém todos os dias de março.
2. Notificações e aba Gestores continuam removidas por decisão anterior do usuário. Settings conserva quatro idiomas e temas, sem frame correspondente.
3. Nomes, iniciais, totais e métricas representam os dados tipados da sessão; não são cópias dos textos e números ilustrativos do Figma. Fotos reais de técnicos não estão disponíveis.
4. BI conserva linha, histograma e boxplot exigidos pelo PDF abaixo dos painéis principais. Formulários, listas maiores e telas estreitas podem rolar; o conteúdo não fica atrás do header.
5. Senha mantém três campos para validar atual/nova/confirmação; cadastro mantém campos operacionais, tipo TÉCNICO e endereço herdado. Política provisória e integração aguardam contrato da API.
6. Manu mantém compositor largo, Novo chat na largura da coluna, saudação persistente e Enter/Shift+Enter, pedidos anteriores do usuário. Essas adaptações diferem do frame estático.
7. Esta evidência não certifica todos os estados/combinações de idioma/tema, igualdade de cada pixel, fluência das traduções, WCAG completa, Edge, IME físico, leitor de tela ou tablet físico. API, BI real e publicação permanecem pendências externas.

Os registros antigos de QA/fidelidade descrevem versões anteriores. Para esta implementação, prevalecem esta revisão e a [matriz atualizada](MATRIZ_REQUISITOS.md).
