# Revisão visual — Website v2

Referência somente para leitura: [cópia do Figma](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628), seção `5631:5628`. Os IDs abaixo pertencem à cópia, não ao arquivo anterior. Revisão incremental de 26–28/09/2026; resultados de interação em [QA_NAVEGADOR.md](QA_NAVEGADOR.md).

As coordenadas abaixo registram as comparações feitas antes do ajuste de ergonomia solicitado em 28/09. A largura da navegação, as alturas da Home e a composição da Manu mudaram depois dessa medição para atender melhor o notebook mostrado nas capturas do usuário. Esses números permanecem como histórico e **não aprovam a posição atual** dessas telas no Figma.

## Comparações e diferenças conhecidas

| Tela / nó | Implementação | Conferência e diferença |
| --- | --- | --- |
| Login / `5631:5629` | `src/pages/Login` | Captura e coordenadas DOM em 1440 × 1024: título y=175,85, email y=389,59, senha y=546,03, botão y=703,74 e Manu x=766,98/y=175,85. Referência: 176/391/549/705 e Manu 766/176. Campos com cerca de 681 px, botão 290 × 70 e Manu 659 × 620. Aviso de mock, link público e controle de senha são adaptações funcionais. Conferidos também 1340 × 800, 800 × 1340 e 390 × 844, sem transbordamento horizontal. |
| Recuperação / `5631:5663`, `5679`, `5700`, `5729` | `src/pages/Recovery` | As quatro etapas foram comparadas diretamente com os frames em 1440 × 1024. Cada etapa usa sua própria ilustração original. No e-mail, campo e botão começam em y≈642/739, contra ≈642/738 na referência. No código, as seis caixas não se sobrepõem ao botão após corrigir a altura do contêiner. Na senha, campos começam em y≈567/708, contra ≈564/706 no frame. Na conclusão, botão em y≈685, contra ≈691. Botões usam azul escuro com texto branco para contraste, diferente do azul claro do Figma; avisos deixam explícito o caráter demonstrativo. Conferidos também 1340 × 800, 800 × 1340 e 390 × 844 para o código, e o fluxo completo no celular sem transbordamento horizontal. Equivalência pixel a pixel e todos os estados de erro ainda não foram aprovados. |
| Home / `5631:5743` | `src/pages/Home` | Comparação direta em 1440 × 1024: banner x≈306/y≈127, altura 249 px; cards y≈403 e painéis inferiores y≈600, praticamente nas posições do frame. Banner e avatar originais, cards, gráfico e cinco dias úteis. A semana inicial e as contagens são de demonstração; eventos vêm do mesmo service do Calendário. Lista recebeu altura mínima de 285 px para evitar rolagem interna com um único evento. O ciano de um valor grande foi ajustado ligeiramente para atingir contraste 3:1 sobre o cartão azul. |
| Dashboard / `5631:5998` | `src/pages/Dashboard` | Comparação direta em 1440 × 1024 após compactar os filtros: título x=306/y=97, filtros y=183, cartões y=251 e gráficos y=579; no frame, posições aproximadas são 320/85, 183, 249 e 590. Quatro cards, dois gráficos circulares, barras e demais gráficos. Barras, linha, histograma e boxplot atendem à demonstração BI do PDF; filtro por técnico e dispersão completam os controles. Há três seletores e um aviso de distribuição sintética no lugar do único filtro ilustrado. Dados, escala e conteúdo diferem dos números ilustrativos do Figma. Dispersão relaciona quantidade de abertas e tempo médio por mês, com alternativa textual. Distribuição entre técnicos é sintética e preserva os totais da fixture, sem vínculo com eventos cadastrados. |
| Equipe / `5631:6232` | `src/pages/Team` | Comparação direta em 1440 × 1024: botão Adicionar x=1048/y=45, busca x=306/y=200, abas por volta de y=315 e tabela x=306/y=383. No frame, as posições aproximadas são 1048/45, 308/205, 321 e 314/388. O botão não cobre os ícones da barra superior. O filtro de situação e o aviso de dados demonstrativos são adaptações funcionais. No celular a lista vira cartões. Avatares dos técnicos usam iniciais; fotos reais não foram fornecidas. Gestores mostra a conta de demonstração. |
| Cadastro / `5631:6389`; edição / `5631:6522` | `src/components/TechnicianForm` | Comparação direta dos frames em 1440 × 1024: no cadastro, seta y≈65, título y≈129, primeiro rótulo y≈219 e campo y≈255, próximos da referência (≈65/129/219/254). Na edição, o título inclui o nome do técnico, como no frame. Acesso TÉCNICO e endereço herdado somente para leitura, conforme regra confirmada pelo usuário. Especialidade, turno e situação estão em seção operacional provisória abaixo dos campos principais, exigindo rolagem; avisos de demonstração também diferem do protótipo. Campos, validações, salvamento, cancelamento e ausência de transbordamento conferidos. Estados de erro ainda precisam de comparação visual específica. |
| Detalhes do técnico / `5631:6658` | `src/components/TechnicianDetails` | Informações, avatar de iniciais e gráfico empilhado semanal/mensal. Capturas desktop e tablet conferidas; retorno de foco verificado. Valores são fixture sintética independente dos eventos; técnico novo tem desempenho vazio. |
| Calendário / `5631:6796` | `src/pages/Calendar` | Comparação direta em 1440 × 1024: painel mensal local x≈306/y≈267/altura≈495; no frame x≈320/y≈209/altura≈370. A tela local inclui navegação entre meses, 31 dias de março e células do mês seguinte; o frame mostra só os dias 1–28 de março e nenhum controle de mês. A grade completa e o aviso de demonstração deslocam os eventos para baixo; é uma diferença visual ainda aberta. Ações por evento, teclado e CRUD demonstrativo foram verificados. Data e evento selecionados diferem dos dados ilustrativos. |
| Evento novo / `5631:7099`; edição / `5631:7208` | `src/components/EventForm` | Comparação direta dos dois frames em 1440 × 1024: seta y≈65, título y≈129 e rótulo inicial y≈218, próximos da referência. Na edição, o título inclui o nome do evento. Formulário em página com título, data, horários, responsável, local, descrição e observação. Responsável e aviso de mock são campos extras e prolongam a página. Data/hora digitáveis em DD/MM/AAAA e HH:MM evitam dependência de seletores nativos. Local é texto, pois não existe catálogo confirmado para o seletor do Figma. |
| Perfil / `5631:6890`; edição / `5631:6981` | `src/pages/Profile` | Comparação direta em 1440 × 1024 após ajuste: título x≈320/y≈79, avatar y≈182 e título “Informações” y≈367, próximos ao frame. No formulário, rótulos começam em y≈351, como na referência. Avatar original, informações em duas colunas e formulário em grade; há campos extras de nome, empresa e nascimento. Papel Gestor substitui Administrador do exemplo, conforme escopo confirmado. Botão claro tem texto escuro para contraste. Dados de empresa, nascimento e endereço são fictícios. Cancelamento, erro de data e limpeza de campos de senha verificados. |
| Manu / `5631:5893` | `src/pages/Manu` | Comparação direta em 1440 × 1024 após ajuste: balão x≈744/y≈239 e compositor x≈544/y≈548; no frame, aproximadamente x≈740/y≈232 e x≈544/y≈547. A arte original tem transparência interna; seus pixels visíveis começam próximos de x≈530/y≈250, contra x≈540/y≈235 no frame. Histórico lateral, controles de sugestão, metadados de anexo e envio funcionam localmente; respostas são guiadas. Avisos sobre ausência de IA e retenção só na sessão acrescentam conteúdo. No celular, histórico fica acima da conversa. |
| Apresentação e 404 / sem frame próprio | `src/pages/About`, `src/pages/NotFound` | Telas de apoio implementadas com identidade do FIXA; não se alega correspondência a frame inexistente. |

## Como encerrar a revisão

1. Abrir o build, carregar o frame correspondente e comparar na dimensão original. Distinguir diferenças de dados das diferenças de espaçamento, tipografia, imagens e cores.
2. Percorrer estado inicial, carregamento, vazio, erro, sucesso, edição e confirmações de cada fluxo. Registrar somente os estados realmente observados.
3. Repetir 1340 × 800, 800 × 1340 e celular; conferir foco, alvos de interação, rolagem e imagens. Tablet físico e leitor de tela são verificações adicionais ainda não executadas.
4. Conferir com a equipe as diferenças condicionadas ao contrato: métricas do BI e vínculo com técnicos, catálogo de locais, fotos, campos obrigatórios e política definitiva de senha.

Esta revisão registra comparações feitas e diferenças rastreáveis. **Não é aprovação visual integral de todos os frames e estados**, nem certificação WCAG. Avisos de demonstração permanecem enquanto não houver integração real.

## Ajuste de ergonomia solicitado pelo usuário — 28/09

A navegação desktop passou a ter largura menor e controle de recolher/expandir em todas as rotas. O cabeçalho fica no topo durante a rolagem, com notificações, configurações e avatar alinhados à direita. A Home usa alturas mínimas mais estáveis para banner e indicadores; em largura de tablet, os cartões e painéis passam a uma composição mais folgada. A Manu amplia o compositor, mantém imagem e saudação após o primeiro envio, distingue visualmente o estado disponível de “Novo chat” e aplica o foco ao contêiner arredondado dos campos. No Calendário, o marcador de evento fica dentro do círculo da data e o hover não acrescenta outra superfície ao dia selecionado.

Essas escolhas respondem às capturas do notebook e à preferência expressa pelo usuário. A comparação com todos os estados correspondentes da cópia do Figma e a revisão nas dimensões 1340 × 800 e 800 × 1340 precisam ser repetidas após o ajuste.


### Calendário da Home e preferências — 05/10

Esta revisão aplica decisões novas do usuário: Home com sete dias (segunda a domingo), escolha de mês e semana, Equipe restrita a técnicos, retirada das notificações e dos selos repetidos de demonstração. Essas adaptações substituem as abas Gestores e os avisos descritos nas comparações anteriores. A gestão de gestores fica no escopo de Administração/RH; não foi criada autorização simulada para esse papel.

O tema claro conserva a composição existente, com 32 px de espaço inferior no desktop e 28 px no celular. A retirada das abas e selos abre espaço na Equipe. O tema escuro usa superfícies, textos, bordas e estados adaptados; as ilustrações originais permanecem com suas cores. Não há frame de referência para Configurações e modo escuro. Os quatro idiomas são escolhas novas do usuário; mandarim usa chinês simplificado (`zh-CN`). Os títulos dos eventos, nomes e endereços cadastrados permanecem no idioma original.

[Home com sábado selecionado](evidencias/home-semana-completa-2026-10-05.jpg) e [configurações em mandarim e modo escuro](evidencias/configuracoes-mandarim-2026-10-05.jpg) documentam a revisão. Esta alteração não constitui nova comparação integral com todos os frames do Figma nem aprovação de WCAG completa.


### Seletor semanal com calendário mensal — 05/10

A pedido do usuário, os dois dropdowns da Home foram substituídos por um botão com ícone de calendário e a data inicial da semana. Ao abrir, o calendário mensal mostra a semana como uma faixa azul contínua e o dia escolhido em outro tom, seguindo o estilo da captura enviada. As semanas continuam de segunda a domingo para manter a mesma ordem dos sete dias da Home. Dias dos meses vizinhos aparecem discretamente para permitir selecionar semanas completas nas viradas de mês.

A troca do mês navega somente pelo seletor; clicar em um dia confirma sua semana e atualiza os eventos. O popover abre acima ou abaixo conforme o espaço, sem deslocar o conteúdo. [Captura do seletor aberto](evidencias/home-seletor-semanal-2026-10-05.jpg).


### Refinamento do calendário e controles — 06/10

A nova referência enviada pelo usuário substitui a ordem de segunda a domingo da revisão de 05/10: o calendário da Home agora usa **domingo a sábado**. O painel recebe mais largura (proporção 3:2 entre gráfico e calendário), espaçamento de 20 px e seleção circular somente no número do dia, com o rótulo fora do círculo. O botão mostra a data escolhida, como na referência.

Clicar no mês/ano abre uma grade de 12 meses; as setas mudam o ano nessa grade e mudam o mês na visão de dias. Clicar em um dia confirma a semana correspondente. A faixa azul contínua, o dia em outro tom e o hover circular reproduzem a interação solicitada. Dias vizinhos permanecem discretos para escolher semanas completas entre meses. O popover abre acima do controle quando falta espaço abaixo. [Calendário com 5 de outubro selecionado](evidencias/home-calendario-dia-semana-2026-10-06.jpg).

Na Manu, Novo chat ocupa toda a largura útil do histórico e distingue os estados disponível/desabilitado. A alça nativa de redimensionamento do textarea foi removida; o campo conserva rolagem interna para texto longo. [Conversa com os controles ajustados](evidencias/manu-controles-2026-10-06.jpg).

Estas alterações seguem as capturas e decisões recentes do usuário; não representam aprovação integral de todos os frames do Figma.
