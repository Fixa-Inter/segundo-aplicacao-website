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
| Acesso privado | Abra `/equipe` sem sessão. | A rota pede login. O backend ainda terá de impor autenticação e autorização reais. |
| Login | Entre com `demo@fixa.test` e `demo1234`. | Carregamento e redirecionamento para Home. O mock aceita quaisquer campos não vazios; não use senha real. |
| Recuperação | Saia, abra “Esqueci minha senha”, use um e-mail válido e o código `123456`. | Validação, erros e etapas. Nenhum e-mail é enviado e nenhuma senha é alterada. Entre novamente. |
| Home e navegação | Percorra cards, gráfico, calendário semanal, menu e avatar. | Arte exportada do Figma, links funcionais, modo responsivo e aviso de dados demonstrativos. |
| Dashboard | Altere período e métrica. | KPIs, barras, linha, histograma, boxplot, filtros e rótulos acessíveis. A fonte é fixture, sem Data Mart conectado. |
| Equipe | Pesquise, filtre, abra um técnico, tente salvar cadastro vazio, depois cadastre, edite e exclua um técnico de teste. | Tabela, paginação, erros por campo, confirmação de exclusão e avisos de operação nesta sessão. Um técnico vinculado a evento não pode ser excluído. |
| Calendário | Mude o mês, selecione um dia, crie, edite e exclua um evento. | Grade mensal, eventos do dia, validação de data e horário e aviso de dados em memória. |
| Perfil | Abra o perfil, edite o nome e salve. Abra a troca de senha. | Nome atualizado na interface; troca de senha apenas valida campos e informa que a credencial não mudou. |
| Manu | Envie uma pergunta, abra “Novo chat” e pesquise uma conversa. | Histórico só da sessão e resposta guiada explicitamente identificada, sem IA conectada. |
| Rota desconhecida | Abra uma URL inexistente, como `/nao-existe`. | Página 404 e retorno para a aplicação. |

## Conferência visual e acessibilidade

Compare login, recuperação, Home, Dashboard, Equipe, Calendário, Perfil e Manu com os frames correspondentes da cópia do Figma. Execute a navegação por `Tab`, `Shift+Tab`, `Enter` e `Escape`, observe o foco e leia mensagens de erro e sucesso. Verifique o navegador em celular, desktop, **1340 × 800** e **800 × 1340**; confira imagens, rolagem horizontal e acesso a botões e formulários. Registre separadamente qualquer etapa que não conseguir executar. Um build aprovado não comprova fidelidade visual nem WCAG integral.

## Evidências e limites da entrega

- Mostre o resultado atual de `git log --oneline` e `git status`. A pasta inicial não tinha `.git`; o histórico criado para esta entrega usa commits e datas reais e não comprova quatro semanas anteriores.
- Mostre os arquivos em `src/types`, `src/services`, `src/mocks`, `src/pages`, `src/components`, `src/contexts` e `tests`. O service de gestão substitui fixtures em memória e expõe Promises tipadas.
- Registre aqui, quando existirem: **URL do repositório:** pendente; **URL da aplicação publicada:** pendente; **contrato da API:** pendente; **fonte e relatório de BI:** pendentes.
- A aplicação React não demonstra JDBC/Postgres, API Spring, bancos, app mobile, Data Mart/ETL ou agente de IA. Essas evidências pertencem às respectivas entregas da equipe e estão discriminadas na matriz.
