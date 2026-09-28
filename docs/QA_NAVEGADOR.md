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
