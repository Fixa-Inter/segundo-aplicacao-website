# Verificação no navegador local

Executada na aplicação Vite em `http://127.0.0.1:5173`, na sessão de 25/09/2026. Esta evidência distingue a interação observada da comparação visual ainda pendente.

| Verificação | Resultado observado | Limite |
| --- | --- | --- |
| Rota privada sem sessão | Abrir `/equipe` levou a `/login` | Proteção apenas no cliente; autorização real depende do backend |
| Login | Campos preenchidos, estado “Entrando…” e abertura da Home | Serviço de autenticação demonstrativo |
| Home | Cards, gráfico e evento semanal presentes; logo, avatar e banner carregados | Captura visual indisponível nesta sessão |
| Dashboard | Rota, filtros, quatro indicadores, dois gráficos circulares e gráficos analíticos renderizados; transbordamento horizontal encontrado no celular e corrigido, com nova medição nas três resoluções | Métricas vêm de fixture; análise visual fina pendente |
| Equipe | Listagem, busca, cadastro e erros por campo observados; tabela em cartões no celular. Aba Gestores mostra a conta demonstrativa e link para o perfil | Cadastro completo do Figma e regras de API ainda pendentes |
| Calendário | Grade, seleção, criação, edição e exclusão de evento em memória observadas; formulário com início, término, local e observação aparece | Automação não conseguiu alterar o `input type=time` para testar o erro no navegador; a regra de término posterior ao início passou no teste unitário |
| Perfil | Edição do nome exibiu mensagem de sucesso e atualizou o nome da interface | Persistência somente na sessão |
| Manu | Pergunta, histórico da sessão e resposta guiada observados | Não há serviço de IA conectado |
| Navegação móvel | Menu abriu e fechou com `Escape` | Percurso integral por teclado e leitor de tela pendentes |
| Página pública | `/sobre` abriu e seus links de acesso estavam disponíveis | Sem frame específico de landing no Figma Website v2 |
| Rota inválida | `/rota-inexistente` levou à página 404 com link de retorno | Retorno autenticado não foi testado nessa visita, pois a navegação direta recarregou a sessão em memória |
| Recuperação | Erro por e-mail ausente e avanço até etapa do código foram observados | Não foi validado o percurso completo de troca de senha no navegador; nenhuma credencial real é alterada pelo mock |

## Tamanhos e recursos

Foram aplicados os viewports **1340 × 800**, **800 × 1340** e **390 × 844**. Nas rotas Home, Dashboard, Equipe, Calendário, Perfil, Manu e Sobre, `document.documentElement.scrollWidth` não excedeu `clientWidth` depois do carregamento. As imagens dessas rotas estavam completas e com `naturalWidth > 0`. O conteúdo de Equipe permaneceu acessível por rolagem vertical no celular, e sua tabela foi exibida no layout de cartões. A viewport temporária foi restaurada após a verificação.

A ferramenta de captura de imagem do navegador retornou **“Unable to capture screenshot”** inclusive após restaurar a viewport. Portanto, as telas **não foram aprovadas em comparação visual pixel a pixel** com o Figma nesta sessão. Os frames da cópia [Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628) orientaram implementação e revisão estrutural. Ainda são necessários capturas no navegador, inspeção de contraste, teste completo de teclado, leitor de tela e tablet físico.

## Revisão incremental — 26 e 27/09/2026

Esta seção atualiza o registro histórico acima. A sessão de 27/09 utilizou o build em `http://127.0.0.1:4173`; o navegador foi recarregado após cada reconstrução para evitar referências a chunks antigos. Capturas voltaram a funcionar, embora mudanças rápidas de viewport ocasionalmente produzissem imagens cortadas ou com áreas pretas. Essas capturas não foram usadas como aprovação visual.

| Fluxo verificado | Evidência observada | Limite |
| --- | --- | --- |
| Cadastro completo do técnico | Em 26/09, erro da senha sem maiúscula focou o campo; dados fictícios válidos salvaram e apareceram na busca e nos detalhes. Acesso TÉCNICO e endereço herdado estavam somente para leitura. Edição preservou nascimento e dispensou senha | Regras definitivas/credencial real dependem da API; massa e operação em memória |
| Detalhes do técnico | Em 27/09, informações e gráfico semanal apareceram; filtro mensal mostrou quatro semanas. Voltar devolveu foco à consulta de Ana Costa. Edição e salvamento funcionaram depois da separação dos services dos componentes | Gráfico usa fixture sintética independente dos eventos; técnico novo retorna desempenho vazio no teste automatizado |
| Abas da Equipe | ArrowRight alternou Técnicos → Gestores e moveu o foco; ArrowLeft retornou. A conta gestora e link de Perfil apareceram | Autorização e outras contas gestoras aguardam contrato |
| Eventos | Em 26/09, término anterior ao início exibiu erro e focou término. Criação, edição de título/data, consulta de texto literal e exclusão do evento de teste foram observadas. ArrowLeft moveu seleção e foco no calendário | Formato DD/MM/AAAA e HH:MM manual; catálogo de locais ainda não definido |
| Home e Calendário | Em 27/09, evento descartável “Evento compartilhado QA” salvo no Calendário apareceu na Home após navegar; estado de carga inicial também apareceu | A Home mostra cinco dias úteis da semana demonstrativa de março/2026 |
| Dashboard | Últimos 3 meses + Abertas mostraram 74 abertas, 54 concluídas, 20 pendentes e média de 5 h; barras mostraram Mai 20, Jun 30, Jul 24. Histograma e boxplot renderizados no celular com alternativa textual; mediana 4,5 h | Fórmulas e valores de fixture, sem Data Mart; não comprova relatório BI real |
| Perfil | Data 31/02/2000 rejeitada com foco no campo; cancelar e reabrir restaurou 11/03/2000. Papel exibido é Gestor. Senha sem maiúscula focou Nova senha; fechar/reabrir por Escape mostrou campos vazios | Nenhuma credencial é verificada/alterada pelo mock |
| Login | Submit vazio exibiu erros e focou Email/CNPJ; login com valores fictícios abriu Home; carregamento e foco no conteúdo foram observados | Autenticação apenas demonstrativa |
| Recuperação completa | Código 000000 rejeitado; 123456 avançou. Confirmação diferente rejeitada; Exemplo! nos dois campos levou à conclusão e informou que nenhuma senha real mudou | E-mail e redefinição não são reais; 4 etapas observadas |
| Manu | Sugestão foi enviada por Ctrl + Enter e gerou resposta guiada. Busca sem resultado mostrou estado vazio. Conversa permaneceu ao navegar Perfil → Manu. Escape fechou sugestões e devolveu foco ao botão | Sem IA; histórico em memória, limpo ao logout/reload |
| Anexo da Manu | Arquivo fictício `tests/fixtures/anexo-demonstracao.txt` selecionado; nome, tamanho e ação Remover apareceram | Conteúdo não lido/transmitido/analisado. Limites do service testados; seleção de todos os formatos não foi executada |
| Menu móvel | Abrir moveu foco ao controle Fechar menu; Escape retornou o foco ao botão Abrir menu | Percurso completo com leitor de tela não executado |

### Medições de responsividade

Foram repetidas medições em **1340 × 800**, **800 × 1340** e **390 × 844** nas telas alteradas. Home, Dashboard, Manu, detalhes de técnico, formulários de técnico/evento e edição de Perfil não excederam a largura do documento nas medições realizadas. Quando há barra vertical, `clientWidth` é menor que a viewport nominal (por exemplo 375 em 390); `scrollWidth` permaneceu igual a `clientWidth`. Imagens inspecionadas da Home/Manu e das rotas anteriores carregaram com `naturalWidth > 0`.

Rolagem vertical é necessária para tabelas/cartões, formulários, gráficos e histórico que excedam a altura disponível. A lista de eventos da Home e a conversa usam rolagem interna quando o conteúdo não cabe. Nenhuma medição no navegador equivale a teste de tablet físico.

### Qualidade automatizada em 27/09

- `npm run build`: aprovado, TypeScript e Vite.
- `npm run lint`: aprovado.
- `npm test`: **18 testes, 18 aprovados** — regras de técnico/senha/data/evento/perfil; isolamento de cópias; desempenho; integração Home/Calendário; quartis/histograma; parcelas sintéticas do Dashboard por técnico; recuperação; metadados e limpeza do histórico da Manu, inclusive resposta pendente após logout e atualização entre rotas.
- `npm run format:check`: aprovado; indentação de dois espaços e formatação pelo Prettier.
- Busca em `src` não encontrou `any`, `fetch(`, `dangerouslySetInnerHTML`, `window.location.href`, `console.log` nem `alert(`. Componentes reutilizáveis não importam services; páginas fazem a orquestração.

### Verificações ainda abertas

Não foram executados leitor de tela (NVDA/VoiceOver), tablet físico, API real, falhas HTTP reais, autenticação/autorização do servidor, IA real, publicação nem comparação pixel a pixel de **todos** os estados do Figma. A revisão visual e suas diferenças conhecidas estão em [FIDELIDADE_VISUAL.md](FIDELIDADE_VISUAL.md). Estes itens permanecem pendentes na matriz.

### Complemento de 27/09 — build final local desta revisão

| Verificação | Resultado observado | Limite |
| --- | --- | --- |
| Login x Figma | Em 1440 × 1024: título y=175,85; campos y=389,59/546,03; botão y=703,74; Manu x=766,98/y=175,85. A referência posiciona aproximadamente em 176, 391, 549, 705 e 766/176 | A tela acrescenta aviso de mock e link público; demais estados não tiveram alinhamento por coordenadas |
| Login responsivo | 1340 × 800, 800 × 1340 e 390 × 844 sem transbordamento horizontal; campos, botão e aviso acessíveis | Tablet físico não testado |
| Recuperação após correção do foco | E-mail vazio focou `recovery-email`; senha sem maiúscula focou `new-password`; confirmação diferente focou `confirm-password`. Código fictício 123456 e senha `Exemplo!` chegaram a “Demonstração concluída” | Nenhum e-mail enviado/credencial alterada; botão/arte/textos adaptados em relação ao Figma |
| Dashboard por técnico | Ana Costa + últimos três meses mostrou 13 abertas, 9 concluídas, 4 pendentes, média de 4,5 h e taxa de 69%. Dispersão expôs alternativa textual e foi vista no celular. `scrollWidth` = `clientWidth` em 1340 × 800, 800 × 1340 e 390 × 844 | Repartição sintética explícita; sem vínculo com eventos ou Data Mart |
| Manu e sessão | Conversa foi preservada ao navegar para Perfil e voltar. Após logout confirmado e novo login, Manu mostrou “Nenhuma conversa nesta sessão” | A resposta pendente entre rotas tem teste de service; o navegador observou retorno depois que a resposta terminou |

`npm run build`, `npm run lint`, `npm test` e `npm run format:check` passaram após as alterações de código. A configuração local de GitHub Actions teve sintaxe/formatação conferida pelo Prettier; **não foi executada no GitHub**, pois não há repositório remoto ligado. Não foram testados os formatos de anexo além do TXT fictício.

### Revisão pontual de acessibilidade — 27/09

- A cor ciano do número grande do card “Tarefas A fazer” tinha contraste calculado de **2,95:1** sobre o azul `#396494`. Foi alterada de `#16c1ff` para `#1ac7ff`, com contraste de **3,11:1**. A cor computada `rgb(26, 199, 255)` foi confirmada no navegador. O [critério 1.4.3 da WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) exige pelo menos 3:1 para texto grande.
- Na Equipe carregada, foram inspecionados 30 controles visíveis; no Calendário carregado, 52. Nesse inventário, nenhum ficou sem nome extraído do texto, rótulo ou `aria-label`, e nenhum tinha largura ou altura inferior a 24 px. É uma inspeção dirigida do DOM; não substitui auditoria WCAG, navegação integral por Tab nem leitor de tela.

### Comparação direta da Equipe — 27/09

O frame `5631:6232` da cópia do Figma foi comparado com uma captura do build em 1440 × 1024. Após o ajuste, Adicionar ficou em x=1048/y=45, a busca em x=306/y=200 e a tabela em x=306/y=383. As posições aproximadas do frame são x=1048/y=45, x=308/y=205 e x=314/y=388, respectivamente. A barra superior mantém 20 px de separação entre Adicionar e o botão de notificações. O filtro de situação, o aviso de demonstração e os avatares de iniciais continuam diferentes da referência pelas razões registradas em [FIDELIDADE_VISUAL.md](FIDELIDADE_VISUAL.md).

Na Equipe, `scrollWidth` não excedeu `innerWidth` em 1340 × 800, 800 × 1340 e 390 × 844. O botão Adicionar permaneceu visível, e em 800 px a tabela ocupou a largura disponível sem rolagem horizontal. Em 1340 × 800, a paginação fica abaixo da dobra e exige rolagem vertical. As capturas após mudanças rápidas de viewport exibiram artefatos de área preta ou escala; a inspeção visual válida foi a de 1440 × 1024 e 1340 × 800, complementada por medições de DOM nas demais larguras.

### Comparação direta do Dashboard — 28/09

O frame `5631:5998` foi comparado com o build em 1440 × 1024. Os controles foram compactados em uma faixa, com rótulos preservados para tecnologia assistiva e aviso visível sobre a distribuição sintética. Título x=306/y=97, filtros y=183, cartões y=251 e gráficos y=579; no Figma, as posições aproximadas são 320/85, 183, 249 e 590. Há diferenças de conteúdo e controles porque o Dashboard demonstra métricas e filtros funcionais em vez dos valores ilustrativos do frame.

Em 1340 × 800, 800 × 1340 e 390 × 844, os três seletores permaneceram visíveis e `scrollWidth` não excedeu `innerWidth`. A altura do conteúdo requer rolagem vertical. A inspeção foi no navegador emulado; leitor de tela e tablet físico continuam pendentes.

### Recuperação de senha — 28/09

Os frames `5631:5663`, `5631:5679`, `5631:5700` e `5631:5729` da cópia do Figma foram consultados individualmente e comparados com as quatro etapas em 1440 × 1024. Foram aplicadas as ilustrações específicas de código, nova senha e conclusão. Na primeira etapa, o campo e o botão começam em y≈642/739 (referência ≈642/738); na etapa de senha, os campos em y≈567/708 (referência ≈564/706); na conclusão, o botão em y≈685 (referência ≈691). Textos de demonstração e o azul escuro do botão diferem intencionalmente do frame.

No navegador local, e-mail fictício, código `123456` e senha fictícia `Exemplo!` chegaram à conclusão. O código colado nas seis caixas e a conclusão foram repetidos em 390 × 844. Foi encontrado e corrigido um transbordamento horizontal de 94 px na etapa do código no celular, causado pela largura mínima implícita da grade. Após a correção, `scrollWidth` ficou igual à largura da viewport (390 px); campo, caixas, botão e aviso ficaram inteiros e a imagem carregou. Na etapa do código, também foram conferidos 1340 × 800 e 800 × 1340, com `scrollWidth` igual à largura da viewport e imagem carregada. E-mail, senha e conclusão no celular não apresentaram transbordamento horizontal. A comparação de todos os erros, tablet físico e leitor de tela permanece aberta.

Após as alterações, `npm run build`, `npm run lint`, `npm test` (18 de 18) e `npm run format:check` passaram. A formatação foi aplicada com Prettier, mantendo indentação consistente no código.

### Home, Calendário, Perfil e Manu — 28/09

As capturas dos frames `5631:5743`, `5631:6796`, `5631:6890`, `5631:6981` e `5631:5893` foram abertas individualmente na cópia do Figma, sem edição do arquivo. A Home foi conferida em 1440 × 1024: banner em x≈306/y≈127, cards y≈403 e painéis y≈600, coincidindo com a composição principal do frame. Imagens carregaram e os dados diferentes continuam identificados como demonstração.

O Calendário, também em 1440 × 1024, mostrou o painel em x≈306/y≈267 e altura≈495, enquanto o frame posiciona o painel em x≈320/y≈209 e altura≈370. A implementação mostra março completo (31 dias), células adjacentes e navegação mensal; o frame exibe os dias 1–28 sem esses controles. A diferença de altura e o aviso de dados deslocam a lista de eventos, conforme a [revisão visual](FIDELIDADE_VISUAL.md). Essa tela não recebeu aprovação de fidelidade integral.

No Perfil em 1440 × 1024, o ajuste de espaçamento posicionou título x≈320/y≈79, avatar y≈182 e seção “Informações” y≈367. O formulário de edição começa seus rótulos em y≈351, próximo ao frame. A conta de demonstração e os campos extras permanecem explícitos. Na edição, `scrollWidth` ficou igual a `clientWidth` em 1340 × 800, 800 × 1340 e 390 × 844. Avatar carregou. O tablet usado foi viewport emulado.

Na Manu em 1440 × 1024, a composição inicial foi reposicionada: balão x≈744/y≈239 e compositor x≈544/y≈548, contra x≈740/y≈232 e x≈544/y≈547 na referência. A arte carregou. Em 1340 × 800, 800 × 1340 e 390 × 844, o documento não excedeu a largura disponível. Em 390 × 844, o compositor fica abaixo da dobra e é alcançado com rolagem vertical. O console do navegador não mostrou erros na rota observada. Histórico e respostas continuam somente em memória.

### Formulários de técnico e evento — 28/09

Os frames de cadastro e edição de técnico (`5631:6389`, `5631:6522`) e de novo evento e edição (`5631:7099`, `5631:7208`) foram abertos na cópia do Figma. Após reposicionar os formulários, em 1440 × 1024, o cadastro de técnico mostrou seta y≈65, título y≈129, primeiro rótulo y≈219 e entrada y≈255; no frame, posições aproximadas y≈65/129/219/254. O tipo de acesso visível foi TÉCNICO e o endereço do gestor permaneceu somente para leitura. O título da edição passou a incluir o nome do técnico selecionado. Os campos operacionais e as notas da regra provisória mantêm a página mais longa que o frame.

No evento novo, a seta ficou em y≈65, o título em y≈129 e o rótulo “Nome do evento” em y≈218, próximos da referência. O frame de edição foi comparado com o evento “Reunião de equipe” aberto no navegador; o título passou a incluir o nome do evento, com título y≈129 e primeiro rótulo y≈218. O local continua como texto livre até existir catálogo de locais, e o técnico responsável permanece como campo adicional funcional. Os dois formulários não excederam `clientWidth` em 1340 × 800, 800 × 1340 e 390 × 844. Estados visuais de erro não foram comparados diretamente; validação e retorno de foco já têm evidência funcional anterior.

### Isolamento da sessão demonstrativa — 28/09

No navegador, o nome do perfil foi alterado para “Gestora da sessão A”. Após confirmar o logout e entrar com outra identificação fictícia, o Perfil voltou a mostrar “Raphaely Sales”. O service restaura técnicos, eventos e perfil ao sair ou entrar, e rejeita gravações pendentes da sessão encerrada. Dois testes novos cobrem restauração das três entidades e uma gravação pendente. `npm run build`, `npm run lint`, `npm test` (**20 de 20**) e `npm run format:check` passaram. O roteiro visual dos demais fluxos permanece conforme as seções anteriores.

### Checagem dirigida de nomes e teclado — 28/09

Após o ajuste de sessão, o DOM carregado de Perfil, Dashboard, Equipe, Calendário, Manu, Home, Login e primeira etapa da Recuperação foi inspecionado para IDs duplicados, imagens sem atributo `alt` e botões/campos sem texto ou rótulo. Nenhum caso apareceu nesse recorte. No login, seis pressões consecutivas de Tab focaram Email/CNPJ, Senha, Mostrar senha, Esqueci minha senha, Entrar e Conheça o projeto, nessa ordem. Em rota autenticada, Enter no link “Pular para o conteúdo” focou o elemento principal; o modal de saída abriu com Enter, fechou com Escape e devolveu o foco ao botão Sair. A inspeção não cobre estados de erro, nomes acessíveis calculados por leitor de tela, contraste de todas as combinações nem navegação integral por Tab nas demais telas.

### Estados de falha de carga — 28/09

Equipe, Calendário e Perfil passaram a exibir erro de carga separado de lista/perfil vazio, com botão “Tentar novamente”. Build, lint, formatação e os 20 testes Node passaram. Os testes existentes não exercitam a interface desses novos estados. Nesta sessão, a ferramenta de navegador recusou abrir a URL local `http://127.0.0.1:5174/login` por política de URL; portanto, **não houve validação visual ou interativa dessa mudança**. Repetir o fluxo de falha e recuperação no navegador quando o acesso estiver disponível.

Em nova tentativa, o navegador abriu a mesma URL local. O login demonstrativo levou à Home, e Equipe, Calendário e Perfil carregaram suas fixtures. No Perfil, a captura [qa-perfil-2026-09-28.png](evidencias/qa-perfil-2026-09-28.png) registrou a tela carregada; na viewport de 1159 × 668, não havia imagem quebrada nem transbordamento horizontal, e o console não mostrou erros. **A falha de carga e a ação “Tentar novamente” continuam sem teste interativo**, pois nenhum service foi forçado a falhar nessa visita.

### Ajustes de navegação, Manu e Calendário — 28/09

Na viewport disponível do navegador interno (1280 × 720), a Home mostrou a navegação mais estreita, banner íntegro e cartões legíveis. O menu recolheu e expandiu nas rotas Home e Calendário. O documento do Calendário tinha `scrollWidth` de 1265 px para `innerWidth` de 1280 px, sem transbordamento horizontal. Após rolar 210 px, o cabeçalho continuou em `top: 0`; a borda direita do avatar ficou em x≈1239, dentro da viewport.

Na Manu, o compositor ocupou quase toda a largura da conversa. Antes do envio, “Novo chat” apareceu desabilitado; depois de enviar “Como cadastrar um técnico?”, ficou habilitado e com fundo azul claro. A imagem e a saudação continuaram visíveis acima das mensagens. O foco na busca e na mensagem alterou apenas o contorno arredondado do campo, sem retângulo interno sobre o botão de envio. No Calendário, o marcador do dia selecionado apareceu dentro do círculo e a data com evento manteve o rótulo acessível “com evento”.

O navegador desta sessão não disponibilizou controle de viewport. Assim, **1340 × 800, 800 × 1340 e celular não foram reexecutados nesta revisão**; resultados de sessões anteriores não validam automaticamente o CSS novo. Também não houve nova medição direta contra o Figma. Build, lint, formatação e 20 testes Node foram executados após o ajuste.

### Correção da sobreposição do cabeçalho — 28/09

As capturas fornecidas pelo usuário mostraram os títulos de Dashboard, Equipe e Perfil cortados pelo cabeçalho fixo. Os deslocamentos negativos dessas páginas e dos formulários de técnico/evento foram removidos. O botão “Adicionar” da Equipe e o aviso de demonstração voltaram ao fluxo normal do layout.

No navegador local, foram conferidos o topo de Dashboard, Equipe, Perfil, edição de Perfil, cadastro de técnico e formulário de evento. Títulos, botões e campos iniciais permaneceram visíveis abaixo do cabeçalho. No formulário de evento, a borda inferior do cabeçalho e o topo do botão Voltar ficaram ambos em y=80, enquanto o título começou em y=144. O documento mediu 1265 px de largura para uma viewport de 1280 px, sem transbordamento horizontal nessa tela. As resoluções 1340 × 800, 800 × 1340 e celular ainda não foram reexecutadas após esta correção.

Na revisão seguinte do cabeçalho, a sombra lateral da sidebar foi substituída por uma borda discreta e a linha inferior do cabeçalho foi removida. Na viewport de 1280 × 720, a união entre sidebar e conteúdo foi conferida com o menu aberto e recolhido; a borda permaneceu contínua e os controles superiores continuaram alinhados à direita. A comparação na janela do usuário em 1920 × 1080 permanece por repetir.

### Ajuste vertical e ícone da aba — 05/10

Na viewport de 1280 × 720 e zoom de 100%, as telas carregadas de Home, Equipe e Calendário passaram a caber sem rolagem do documento. Antes do ajuste, o `scrollHeight` era respectivamente 869, 934 e 930 px; depois, ficou em 720 px nas três. A Home também coube com a sidebar recolhida a 80 px. Em 1340 × 800, Home, Equipe, Calendário, Perfil e Manu tiveram `scrollHeight` de 800 px e nenhum transbordamento horizontal. Na Home em 800 × 1340, a grade responsiva não apresentou transbordamento horizontal nem vertical. O Dashboard continua com rolagem para mostrar os gráficos completos; formulários e estados com conteúdo adicional também podem rolar.

O novo `/favicon.svg` exibe o símbolo recortado da logo original e foi aberto no navegador. `npm run build`, `npm run lint`, `npm test` (20 de 20) e `npm run format:check` passaram. A janela real do usuário no Edge e os estados dinâmicos com vários eventos ainda precisam de nova conferência visual; não há teste automatizado de geometria de layout.

### Refinamento das proporções — 05/10

Após o retorno visual do usuário, foi removida a grade que esticava os painéis da Home para preencher a altura. Banner, cartões, texto e painéis agora diminuem juntos em janelas baixas; em 1440 × 1024, a sidebar mede 251 px (250 px no frame), o banner começa em x≈307/y≈126 e mede 250 px de altura, os cartões começam em y≈403 e os painéis inferiores em y≈599. O frame `5631:5743` indica aproximadamente x=306/y=127, cartões y=403 e painéis y=600. Em 1280 × 720, a Home cabe sem rolagem e a sidebar aberta mede 223 px; recolhida, mede 80 px com o cabeçalho alinhado. Em 1340 × 800, Home, Equipe e Calendário não rolam e não apresentam transbordamento horizontal.

Em 1280 × 720, Equipe e Calendário recuperaram linhas e dias de tamanho legível. O conteúdo termina respectivamente em y≈705 e y≈702, dentro da janela; o espaço inferior do layout produz rolagem de cerca de 21 e 18 px. A rolagem permanece disponível quando houver mais eventos ou mensagens. Na Home, 800 × 1340 e 390 × 844 não tiveram transbordamento horizontal; no celular, os cartões medem 136 px de altura. A janela Edge de 1920 × 1080 do usuário e os demais estados de cada página ainda não foram reexecutados nesta revisão.

A Home também foi conferida em 1910 × 910, área útil semelhante à captura enviada pelo usuário: documento com 1910 × 910, sem rolagem, banner com cerca de 228 px de altura e painéis inferiores com 328 px. A [captura desta revisão](evidencias/home-proporcoes-2026-10-05.jpg) registra o resultado em zoom de 100%. Dashboard, Perfil e Manu foram inspecionados em 1440 × 1024; títulos e controles ficaram visíveis. O Dashboard mantém rolagem para os gráficos adicionais exigidos pelo PDF. Essa conferência no navegador do ambiente não substitui um teste na janela real do Edge do usuário.

Após as alterações, build, lint, verificação de formatação e os 20 testes de comportamento existentes passaram.

### Rolagem abaixo do cabeçalho e setas dos dropdowns — 05/10

A captura seguinte do usuário mostrou o botão “Adicionar” cortado durante a rolagem. O layout agora reserva uma linha para o cabeçalho e uma área independente para o conteúdo. Somente essa área rola; o conteúdo não é desenhado atrás do cabeçalho. A troca de rota devolve a área ao topo. O espaço inferior foi reduzido de 36 para 12 px no desktop, eliminando a rolagem residual da Equipe e do Calendário sem reduzir novamente seus elementos. A coluna de histórico da Manu foi ajustada à área disponível abaixo do cabeçalho, inclusive à altura de 76 px no celular.

Em 1280 × 720 e 1340 × 800, Home, Equipe, Calendário e Perfil carregados apresentaram altura de conteúdo igual à área disponível, sem rolagem nem transbordamento horizontal. A Manu em desktop também coube, com menu lateral aberto e recolhido em 1280 × 720 e após enviar uma mensagem em 1340 × 800. A Equipe coube em 1910 × 910. A [captura da Equipe em 1340 × 800](evidencias/equipe-rolagem-dropdown-2026-10-05.jpg) mostra título, botão “Adicionar”, dropdown e paginação inteiros.

O Dashboard foi levado ao fim com `Ctrl + End` em 1280 × 720: somente o conteúdo rolou (área de 640 px, conteúdo de 1813 px), enquanto o cabeçalho permaneceu entre y=0 e y=80. O cadastro de técnico também foi conferido até os campos inferiores e os botões Salvar/Cancelar. Voltar à Equipe a partir do Dashboard restaurou `scrollTop=0`; a paginação para a segunda página e o popover de notificações funcionaram.

Os selects continuam nativos, com uma única seta centralizada verticalmente a 14 px da borda direita e 42 px reservados para evitar colisão com o texto. O filtro Situação da Equipe e a Situação do cadastro foram alterados por teclado; no celular o dropdown abriu normalmente. A regra também se aplica aos selects do Dashboard, do formulário de evento e do desempenho do técnico. A alternativa nativa para alto contraste está no CSS, mas não foi testada com alto contraste ativado nesta sessão.

Em 800 × 1340, Home, Equipe e Calendário couberam sem rolagem ou transbordamento horizontal. Em 390 × 844, Equipe e Calendário mantiveram rolagem vertical dentro do conteúdo, com o cabeçalho fora dessa área e sem transbordamento horizontal. A janela real do Edge e dispositivos físicos permanecem por conferir. Build, lint, formatação e os 20 testes existentes passaram; as verificações de geometria acima são manuais no navegador do ambiente.


### Sete dias, Equipe do gestor e configurações — 05/10

Revisão no navegador do ambiente em `http://127.0.0.1:5173`, com dados fictícios. A pasta estava sem alterações locais no início desta etapa. Foram removidos a aba Gestores, o botão/popover de notificações e o componente DemoBadge. Mensagens de validação e feedback das ações permanecem; os limites dos mocks estão documentados.

| Cenário executado | Resultado observado |
| --- | --- |
| Home em 1280 × 720 e 1340 × 800 | Sete dias e seletores de mês/semana visíveis, sem rolagem da área principal: respectivamente 640/640 e 720/720 px de altura disponível/conteúdo. Evento de sábado 14/03/2026 criado no Calendário apareceu ao selecionar sábado na Home. |
| Viradas de mês e ano | Escolher semana 30/03 e avançar levou a abril; escolher 28/12 e avançar levou a 04/01/2027. Trocar mês seleciona seu primeiro dia. Testes cobrem meses curtos, longos e fevereiro bissexto. |
| Equipe em 1280 × 720 | Apenas técnicos, tabela e paginação visíveis com espaço inferior; área de 640/640 px, sem rolagem residual. Cadastro vazio exibiu erros em inglês e focou nome. Tipo automático e endereço somente para leitura permaneceram. |
| Preferências | Português, inglês, espanhol e mandarim selecionados com atualização imediata. Recarregar encerrou a sessão, conservando mandarim e tema escuro; novo login manteve ambos. Armazenamento contém somente idioma/tema. |
| Perfil em espanhol | Data exibida no formulário como 11/03/2000, salva sem trocar mês/dia; apresentação localizada e feedback traduzido. |
| Manu em mandarim | Sugestão de agenda enviada com Ctrl+Enter; resposta guiada apareceu em chinês, saudação continuou visível e Novo chat ficou habilitado. Texto enviado pelo usuário foi preservado. |
| Tema escuro | Conferidos Configurações, Home, Equipe/cadastro, Perfil, Calendário, Dashboard (incluindo gráficos inferiores), Manu e Login. Ajustados contraste dos pontos/linhas, mediana, dia selecionado e botão azul do Perfil. As ilustrações originais mantêm suas cores; a marca recebe brilho adicional no tema escuro para melhorar a visibilidade. |
| Tablet 800 × 1340 | Home e Configurações conferidas, sem transbordamento horizontal; Home com área/conteúdo de 1260/1260 px. Configurações também abriu na orientação horizontal. |
| Celular 390 × 844 | Configurações, menu em mandarim e sete dias da Home utilizáveis; rolagem da Home contida na área abaixo do cabeçalho (768 px disponíveis, conteúdo 1157 px). Largura do documento 390 px, sem transbordamento horizontal. |

`npm test`: 26/26 aprovados; build TypeScript/Vite, lint e Prettier aprovados. Novos testes verificam cobertura de semanas, preferências corrompidas/indevidas, tradução com valores, datas por idioma e reconhecimento das sugestões pela Manu. Teste compartilhado Home/Calendário passou a usar evento de sábado.

Foi observado um aviso de `createRoot` durante a edição de `main.tsx` com hot reload; uma recarga limpa foi feita para verificar a versão estável. Não há aprovação de leitor de tela, alto contraste, dispositivo físico, fluência por revisores nativos ou de todos os fluxos em todas as combinações de tema/idioma. A janela real do Edge do usuário e a integração com API/BI/IA continuam externas a esta checagem.
