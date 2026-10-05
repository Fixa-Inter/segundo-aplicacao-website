# Roteiro de demonstração — FIXA Web

Este roteiro apresenta o **protótipo local do gestor**. Use a [matriz de requisitos](./MATRIZ_REQUISITOS.md) para conferir o estado de cada critério da DAD. Os dados e a autenticação são demonstrativos; alterações de equipe, calendário e perfil somem ao atualizar a página.

## Preparação

1. Na pasta `fixa-web`, execute `npm ci`, `npm run build`, `npm run lint`, `npm test` e `npm run format:check`. Registre o resultado real de cada comando na apresentação.
2. Execute `npm run dev` e abra a URL informada pelo Vite.
3. Use uma janela limpa ou atualize a página antes de começar. A sessão fica somente em memória.
4. Tenha abertos o [Figma Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628), esta matriz e o PDF da disciplina.

## Fluxo sugerido

| Etapa | Ação na interface | O que conferir e dizer |
| --- | --- | --- |
| Apresentação pública | Abra `/sobre` e use “Explorar o protótipo”. | Objetivo do FIXA, funções da demonstração e limites explícitos da integração. |
| Acesso privado | Abra `/equipe` sem sessão. | A rota pede login. O backend ainda terá de impor autenticação e autorização reais. |
| Login | Entre com `demo@fixa.test` e `demo1234`. | Carregamento e redirecionamento para Home. O mock aceita quaisquer campos não vazios; não use senha real. |
| Recuperação | Saia, abra “Esqueci minha senha”, use um e-mail válido e o código `123456`. | Validação, erros e etapas. Nenhum e-mail é enviado e nenhuma senha é alterada. Entre novamente. |
| Home e navegação | Percorra cards, gráfico, calendário semanal com sete dias, seletor semanal: abra o calendário mensal e escolha um dia da semana desejada, menu e avatar. | Arte exportada do Figma, links funcionais, modo responsivo e evento de sábado acessível. Os limites dos mocks estão nesta documentação. |
| Dashboard | Altere técnico, período e métrica; volte a Todos os técnicos e Últimos 3 meses. | Totais 74 abertas, 54 concluídas, 20 pendentes e média de 5 h na fixture original. Barras, linha, histograma, boxplot e dispersão têm alternativas textuais. Por técnico, a repartição é sintética; não demonstra Data Mart nem desempenho real. |
| Equipe | Pesquise técnicos, filtre a situação, navegue entre páginas, abra Ana Costa e altere desempenho semanal/mensal. Depois tente cadastro vazio, cadastre, edite e exclua um técnico fictício. | Acesso TÉCNICO automático e endereço do gestor somente para leitura. Use nascimento 18/04/1995, e-mail único `tecnico-qa@fixa.test`, celular `(11) 99999-1234` e senha fictícia `Exemplo!`. Regra de senha provisória. Técnico novo tem desempenho vazio; técnico vinculado a evento não pode ser excluído. |
| Calendário | Mude o mês, mova seleção com setas, crie evento no sábado 14/03/2026, confira na Home, edite e exclua. | Data DD/MM/AAAA, horas HH:MM. Término deve ser posterior ao início no mesmo dia; tente 10:00 → 09:00 e confira foco/erro. Dados de responsável, local, descrição e observação são demonstrativos. |
| Perfil | Abra o perfil, edite o nome e salve. Abra a troca de senha. | Nome atualizado na interface; troca de senha apenas valida campos e informa que a credencial não mudou. |
| Manu | Abra sugestões, escolha uma pergunta, envie com Enter, navegue Perfil → Manu, abra Novo chat e pesquise. Selecione apenas `tests/fixtures/anexo-demonstracao.txt`, confira metadados e remova. | Shift + Enter quebra linha; Escape fecha sugestões e retorna foco. Histórico permanece entre rotas e é limpo ao sair/entrar. Anexo não é transmitido/analisado; resposta guiada sem IA. |
| Configurações | Use a engrenagem; escolha português, inglês, espanhol e mandarim; alterne Claro/Escuro e recarregue. | Textos e datas traduzidos, nomes e dados cadastrados preservados. Somente idioma/tema persistem no navegador; recarregar encerra a sessão e restaura os mocks. |
| Rota desconhecida | Abra uma URL inexistente, como `/nao-existe`. | Página 404 e retorno para a aplicação. |

## Conferência visual e acessibilidade

Compare login, recuperação, Home, Dashboard, Equipe, Calendário, Perfil e Manu com os frames correspondentes da cópia do Figma. Execute a navegação por `Tab`, `Shift+Tab`, `Enter` e `Escape`, observe o foco e leia mensagens de erro e sucesso. Verifique o navegador em celular, desktop, **1340 × 800** e **800 × 1340**; confira imagens, rolagem horizontal e acesso a botões e formulários. Registre separadamente qualquer etapa que não conseguir executar. Um build aprovado não comprova fidelidade visual nem WCAG integral.

## Evidências e limites da entrega

- Mostre o resultado atual de `git log --oneline` e `git status`. A pasta inicial não tinha `.git`; o histórico criado para esta entrega usa commits e datas reais e não comprova quatro semanas anteriores.
- Mostre os arquivos em `src/types`, `src/services`, `src/mocks`, `src/pages`, `src/components`, `src/contexts` e `tests`. O service de gestão substitui fixtures em memória e expõe Promises tipadas.
- Registre aqui, quando existirem: **URL do repositório:** pendente; **URL da aplicação publicada:** pendente; **contrato da API:** pendente; **fonte e relatório de BI:** pendentes.
- A aplicação React não demonstra JDBC/Postgres, API Spring, bancos, app mobile, Data Mart/ETL ou agente de IA. Essas evidências pertencem às respectivas entregas da equipe e estão discriminadas nos [critérios externos](CRITERIOS_EXTERNOS.md).
- Use a [revisão visual](FIDELIDADE_VISUAL.md) para apresentar as diferenças conhecidas e os novos IDs dos frames, sem tratar QA parcial como aprovação integral.
