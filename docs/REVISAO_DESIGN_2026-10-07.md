# Revisão do Website v2 — 07/10/2026

Referência atual: [Figma original, Website v2](https://www.figma.com/design/VeZNU2w9BMTKBpa3z24BxL/Fixa?node-id=3665-79544), seção `3665:79544`. Esta revisão substitui as decisões de 06/10 sobre confirmações, cinco dias da Home, posição de Adicionar e troca de senha dentro do layout. A cópia consultada anteriormente permanece no histórico.

## Recursos originais e confirmações

O usuário forneceu `pop-up.svg`, `pop-up (1).svg` e `pop-up (2).svg`. As imagens PNG incorporadas nesses SVGs foram extraídas sem redesenhar nem modificar seus pixels e salvas em `src/assets/figma/confirm-delete.png`, `confirm-save.png` e `confirm-logout.png`. Os arquivos completos fornecidos continuam na pasta Downloads; os textos e botões são elementos HTML traduzíveis e acessíveis.

Referências: excluir `4526:8501`, salvar `4526:8510`, sair `4526:8518`. A consulta detalhada de excluir foi obtida; as consultas seguintes atingiram o limite do Figma. As artes entregues pelo usuário completaram a referência visual. Não houve alteração no arquivo do Figma.

Os pop-ups têm largura de 320 px, altura inicial de 340 px, raio de 30 px, arte de 200 × 200 px, título de 17 px, subtítulo de 12 px e botões de 115 × 35 px. Os alvos dos botões recebem extensão invisível para facilitar o clique. Textos traduzidos podem aumentar a altura. O fundo é `#f6f9fc`, Cancelar usa `#c4cfe0` e a ação usa `#153d7d`, seguindo os SVGs. Esta paleta permanece clara também no tema escuro: o fundo opaco das ilustrações originais se integra ao cartão, sem um quadrado claro isolado numa superfície escura.

Foi corrigida a causa do efeito de nova tela: em Mantine 9, `className` de `Modal.Content` também afetava o contêiner que ocupa a viewport. A classe agora é aplicada especificamente ao slot `content`, preservando a página sob a sobreposição semitransparente. A mesma correção vale para Informações sobre o evento. Escape, Cancelar e retorno de foco continuam disponíveis; ações em andamento bloqueiam fechamento e envio duplicado.

Salvar técnico, evento e perfil abre a confirmação depois da validação. Cancelar mantém o formulário sem gravar; confirmar executa o service demonstrativo. Exclusão e saída usam suas próprias artes originais.

## Ajustes da interface

| Parte | Alteração atual | Verificação |
| --- | --- | --- |
| Home | Resumo simples de segunda a domingo, sem calendário mensal detalhado; hover ocupa a mesma cápsula de dia/rótulo da seleção. Painel mais largo para sete colunas | Evento fictício de sábado criado no Calendário apareceu na Home ao selecionar 14/03/2026 |
| Banner | Imagem original recomposta com CSS: Manu inteira, dimensão proporcional e mesclagem das margens vazias com o fundo; sem arte gerada | Inspeção visual em 1340 × 800, 1280 × 720, tablet e celular; ajuste móvel do título para não colidir com a arte |
| Sidebar recolhida | Largura de 104 px, botão de recolher centralizado e logo original com margem lateral | Recolher e expandir observado |
| Header e Adicionar | Header e conteúdo preservam os mesmos gutters; ações ficam à direita do título dentro da main | Equipe e Calendário observados, sem portal para o header |
| Dashboard | Seta original branca dimensionada em 14 × 8 px no seletor de técnico | Selecionar Ana e restaurar Todos os técnicos conferido |
| Filtrar | Padding equilibrado do botão e opção Limpar filtros | Equipe voltou a Todos, busca vazia e primeira página; Dashboard voltou a todos os técnicos, sete meses e Concluídas |
| Calendário | Padding nativo removido das células e line-height consistente | Centros de cabeçalho e números das sete colunas alinhados com diferença inferior a 0,01 px na medição DOM em 1340 × 800 |
| Informações do evento | Modal original com fundo da página visível, raio de 50 px | Reunião de equipe exibiu local, data, horário, descrição e observação |

## Telas e entrada da recuperação

Referências do arquivo original: e-mail `3665:81521`, código `3667:81563`, nova senha `3667:81588`, troca autenticada `3930:604`, conclusão pública `3667:81630` e autenticada `3930:648`. As ilustrações originais já existentes são reutilizadas em cada etapa.

- Em Login, Esqueci minha senha com e-mail válido preenchido abre diretamente o código com aquele e-mail parcialmente oculto. Campo vazio, CNPJ ou identificação que não seja e-mail abre a etapa de informar e-mail.
- O estado de navegação é validado como entrada do protótipo; não é uma autorização de backend.
- No Perfil, Alterar senha abre `/alterar-senha`, página própria fora do AppLayout, com senha antiga e nova. A etapa pública de definir nova senha conserva nova senha e confirmação.
- Voltar e concluir levam ao Perfil para usuário conectado e ao Login no fluxo público. Ações de Login e recuperação não concorrem enquanto houver solicitação em andamento.
- A conclusão diz **Senha validada!**: nenhum e-mail é enviado, a senha antiga não é autenticada e nenhuma credencial é persistida ou alterada. Isto é uma adaptação do texto de sucesso do Figma à demonstração local.

No navegador: e-mail preenchido abriu código; vazio abriu e-mail; `000000` foi rejeitado; `123456` permitiu continuar, validar senha fictícia e retornar ao Login. O fluxo autenticado com dois campos levou à conclusão e retornou ao Perfil, cabendo em 1280 × 720. Nenhuma credencial real foi usada.

## Verificação e evidências

Em 07/10/2026: `npm run build`, `npm run lint`, `npm run format:check` e **30/30 testes Node** aprovados. Os novos testes cobrem entrada segura da recuperação, máscara do e-mail e validação da troca demonstrativa. QA local em `http://localhost:5175`, sem publicação.

| Cenário | Evidência |
| --- | --- |
| Excluir sobre a Equipe, 1340 × 800 | [Captura](evidencias/design-2026-10-07/excluir-1340x800.png) |
| Salvar sobre formulário de evento, 1340 × 800 | [Captura](evidencias/design-2026-10-07/salvar-1340x800.png) |
| Home com sábado selecionado, 1340 × 800 | [Captura](evidencias/design-2026-10-07/home-1340x800.png) |
| Sair sobre a Home, 390 × 844 | [Captura](evidencias/design-2026-10-07/sair-390x844.png) |
| Informações sobre o Calendário, 1340 × 800 | [Captura](evidencias/design-2026-10-07/evento-1340x800.png) |

Home: altura de rolagem igual à área disponível em 1340 × 800 e 1280 × 720; Calendário inicial também coube em 1340 × 800. Pop-up de saída coube no celular. Em celular, formulários, listas longas e gráficos continuam acessíveis por rolagem quando necessário. Cancelar exclusão e Escape restauraram foco; cancelar Salvar preservou o formulário; confirmar Salvar no evento e no perfil atualizou apenas a sessão local. Inglês e tema escuro foram percorridos no pop-up de saída, depois restaurados para português e claro. As novas mensagens têm traduções nos quatro idiomas, mas não se alega QA visual integral de todos os estados e idiomas.

Limites: não há API, autorização de servidor, envio de código, persistência de senha nem deploy. A comparação completa de todos os frames, tablet físico e leitor de tela permanece pendente. Esta revisão não certifica equivalência pixel a pixel de toda a aplicação.


## Complemento — faixa mensal e controles

O feedback seguinte do usuário atualizou o resumo da Home: agora todos os dias do mês aparecem numa faixa horizontal rolável, com aproximadamente sete dias visíveis por vez. Isto substitui a faixa fixa de sete dias descrita acima. O calendário detalhado continua na aba Calendário.

- A seleção inicial fica centralizada somente na faixa; a página não muda de posição. As setas de mês selecionam o dia 1 do mês anterior/seguinte. Os dias são calculados pela função existente `monthDays`, removendo as células de meses vizinhos. Não há seletor detalhado adicional.
- Clique escolhe o dia e exibe seus eventos. Teclas esquerda/direita movem entre dias; Home/End acessam o primeiro/último. A faixa também tem rolagem horizontal nativa por mouse/trackpad/toque e barra fina. O foco usa contorno interno, evitando recorte nas bordas.
- No Dashboard, a seta branca original passou a imagem independente do fundo do select, com largura de 16 px e altura automática (8,31 px medida). Ela permanece centralizada à esquerda, sem deformação, sem capturar cliques e sem depender do background global dos selects. O controle nativo de seleção foi preservado.
- No botão de detalhes do técnico, hover e foco realçam o fundo e a borda; o avatar muda de cor e o texto não recebe sublinhado. Cores usam os tokens do tema, com transição breve respeitando a preferência por movimento reduzido.
- Equipe e Calendário agora usam a mesma classe de Adicionar em `management.module.css`: raio de 999 px, altura mínima de 44 px, peso de fonte 500, gap de 12 px e ícone “+” de 18 × 18 px. Os rótulos específicos e os handlers existentes foram preservados.

Verificação local: março exibiu os dias 1–31 e fevereiro os dias 1–28. Home/End selecionaram as duas extremidades; rolagem horizontal por mouse mudou a posição da faixa e deixou `main.scrollTop` em zero. Em 1340 × 800, a main mediu 720/720 px de altura disponível/altura de rolagem; em 1280 × 720, 640/640 px. Em 390 × 844, largura total de 390 px, sem transbordamento horizontal da página; apenas a faixa tem conteúdo mais largo. No Dashboard, seleção de Ana Costa funcionou e a seta foi conferida visualmente e por DOM. O destaque dos técnicos foi observado em foco por teclado, com a mesma regra CSS usada no hover. Ambos os botões Adicionar mediram 44,4 px de altura, raio de 999 px e mesmo ícone/gap. Console sem erros na sessão de QA.

Build, lint, formatação e os 30 testes existentes passaram novamente. Não foram criados testes que apenas repetem as alterações de estilo. Essas verificações não representam QA visual integral de todos os idiomas, estados ou dispositivos físicos.

Capturas adicionais:

- [Home, último dia do mês, 1280 × 720](evidencias/design-2026-10-07/home-mes-1280x720.png)
- [Dashboard, seta proporcional, 1340 × 800](evidencias/design-2026-10-07/dashboard-seta-1340x800.png)
- [Equipe, destaque por foco e botão Adicionar, 1340 × 800](evidencias/design-2026-10-07/equipe-destaque-1340x800.png)
- [Calendário, botão Adicionar padronizado, 1340 × 800](evidencias/design-2026-10-07/calendario-adicionar-1340x800.png)


## Complemento — leitura dos gráficos e ações de visualizar

Este complemento atende ao feedback seguinte do usuário e substitui as decisões anteriores sobre o select nativo de Técnico, acesso pelo nome do técnico, tamanho das confirmações e informações do evento. Foram usadas as capturas fornecidas e as artes locais já obtidas do Figma.

- Home e Dashboard compartilham `DataChart`, com escalas iniciadas em zero, marcações numéricas, linhas de referência e valores nas barras/pontos da linha. O componente mede a área disponível para manter as fontes legíveis ao redimensionar; não deforma o SVG. Dispersão tem duas escalas numéricas e identificação de cada mês no tooltip nativo. Histograma mantém os intervalos existentes e o boxplot mostra a escala em horas e a mediana. Os dados e cálculos dos services foram preservados.
- A escala escolhe intervalos legíveis, cobre o maior valor e usa marcações inteiras para contagens. Dois testes novos cobrem valores zero, fracionários e grandes, intervalos uniformes e rejeição de limites inválidos.
- Os cards circulares distribuem título, anel e legenda no espaço disponível. As duas cores recebem rótulos de Concluídas/Pendentes e suas quantidades; porcentagem e contagem central continuam visíveis. O total demonstrativo inicial permanece 213 abertas, 165 concluídas e 48 pendentes.
- Técnico passou a menu Mantine com opções arredondadas, indicação do técnico selecionado, navegação por teclado e retorno do foco. A seta é um ChevronDown vetorial sem preenchimento, de 20 px, que gira para a direita enquanto aberto. Hover e abertura realçam o azul e a borda. Os demais botões de ação, filtros, navegação e compositor receberam transições curtas de cor; a regra global de movimento reduzido continua aplicável.
- Os dias da Home têm largura mínima de 58 px, altura de 80 px em notebook e 88 px em celular. Em áreas largas, sete dias cabem; em áreas menores, a faixa preserva o tamanho dos botões e continua rolável até o fim do mês. O encaixe automático foi retirado para não recortar o último dia, e ResizeObserver mantém a seleção visível ao redimensionar a área. Home/End e setas continuam disponíveis. O primeiro evento cabe inteiro no painel inicial em 1280 × 720.
- Equipe agora tem Visualizar, Editar e Excluir, nessa ordem. O olhinho abre os detalhes e recebe novamente o foco ao voltar; o nome é informação estática. O botão de cadastro diz Adicionar técnico, com o mesmo “+”, altura e raio do Adicionar evento.
- Eventos também têm olhinho explícito antes de Editar/Excluir. O resumo deixou de ser um botão. As informações mantêm o desenho de campos do Figma, com largura de 760 px, raio de 28 px, espaçamentos menores e uma única família tipográfica. Em celular, os campos ficam numa coluna. Fechar/Escape devolvem foco ao olhinho.
- Confirmações passaram de 320 para 400 px no desktop, com arte de 240 px, título de 20 px, texto de 14 px e botões de 44 px de altura. As três ilustrações originais foram preservadas. Em celular, a largura fica em 320 px e a arte em 200 px.
- Na Manu, o histórico ocupa a altura da tela e começa a 24 px do topo no desktop. O header ocupa apenas a região da conversa; o chat mantém espaço acima para os controles. Em celular, o header volta ao fluxo normal.
- Sidebar aberta e recolhida usam os mesmos ícones de 28 × 28 px, padding e altura de cada item. Apenas os textos se ocultam; largura, logo e textos têm transição. A logo usa um único vetor nos dois estados, corrigido por espelhamento horizontal para corresponder ao PNG oficial da FIXA. A imagem completa com o nome FIXA continua preservada.

### Verificação deste complemento

Build, ESLint, Prettier e **32/32 testes Node** aprovados. Navegador local em `localhost:5175`, sem publicação.

- Em 1340 × 800, os cinco ícones de navegação mediram 28 × 28 px, x = 36 px e y = 204/264/324/384/444 px, antes e depois de expandir. O título da Manu ficou a 24 px do topo nos dois estados.
- Home em 1280 × 720: main com 640 px disponíveis e 640 px de conteúdo; primeiro evento com 56 px disponíveis e 56 px de conteúdo. End selecionou 31/03 mantendo a main em scrollTop = 0.
- Dashboard: escolher Ana Costa atualizou os indicadores para 38 abertas, 29 concluídas e 9 pendentes; Limpar filtros restaurou 213/165/48. Enter abriu o menu; seta para baixo moveu o foco; Enter selecionou Ana; Escape fechou e devolveu o foco ao botão. O grupo de opções usa Menu.RadioGroup/RadioItem para anunciar a seleção. Menu, legendas e escalas foram conferidos visualmente. Os gráficos inferiores continuam acessíveis pela rolagem da main.
- Equipe: olhinho abriu Ana Costa; voltar restaurou foco. Confirmação de excluir foi aberta e cancelada, sem excluir registros. Calendário: olhinho abriu o evento e Escape restaurou foco.
- Em 390 × 844, Home e Calendário ficaram com largura de página de 390 px. O modal de evento mediu aproximadamente 351 × 625 px, com toda a informação visível; a confirmação manteve texto e ações acessíveis. Na Equipe, os três botões de ação ficaram na mesma linha, com 44 × 44 px cada. No Dashboard, o menu também coube sem transbordamento. Após redimensionar a Home, o dia 31 ficou totalmente visível (extremo direito do botão: 334,8 px; extremo da faixa: 335,2 px).

Capturas deste complemento:

- [Home com gráfico e dias, 1280 × 720](evidencias/design-2026-10-07/home-grafico-dias-1280x720.png)
- [Home com gráfico e dias, 1340 × 800](evidencias/design-2026-10-07/home-grafico-dias-1340x800.png)
- [Home no celular](evidencias/design-2026-10-07/home-grafico-dias-390x844.png)
- [Dashboard: menu no celular](evidencias/design-2026-10-07/dashboard-menu-390x844.png)
- [Dashboard: menu e legendas](evidencias/design-2026-10-07/dashboard-menu-legendas-1340x800.png)
- [Dashboard: escalas dos gráficos](evidencias/design-2026-10-07/dashboard-escalas-1340x800.png)
- [Equipe: ações de visualizar](evidencias/design-2026-10-07/equipe-visualizar-1340x800.png)
- [Confirmação maior no desktop](evidencias/design-2026-10-07/popup-legivel-1340x800.png)
- [Confirmação no celular](evidencias/design-2026-10-07/popup-legivel-390x844.png)
- [Informações do evento no desktop](evidencias/design-2026-10-07/evento-compacto-1340x800.png)
- [Informações do evento no celular](evidencias/design-2026-10-07/evento-compacto-390x844.png)
- [Manu com sidebar recolhida](evidencias/design-2026-10-07/manu-historico-recolhido-1340x800.png)
- [Manu com sidebar expandida](evidencias/design-2026-10-07/manu-historico-expandido-1340x800.png)

As traduções novas existem em português, inglês, espanhol e mandarim. Não se alega QA visual integral dos quatro idiomas, equivalência pixel a pixel de todos os frames ou integração com Databricks/backend.
