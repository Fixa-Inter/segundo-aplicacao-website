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
