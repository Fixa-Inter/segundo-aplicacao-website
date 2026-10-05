# FIXA Web

Aplicação de gestão de manutenção para o perfil gestor, em **React 19, TypeScript e Vite**. A interface segue os frames **Website v2** do [Figma acadêmico](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628). O projeto está em fase de **demonstração local**: a API e a base analítica ainda não foram entregues.

## Executar e verificar

Requer Node.js 22.18+ (os testes importam TypeScript pelo suporte nativo do Node). Verificado com Node **24.11.1**. Dentro de `fixa-web`:

```bash
npm ci
npm run dev
npm run build
npm run lint
npm test
npm run format:check
```

O Vite informa a URL local. `npm run preview` serve o build de `dist/`.

## Demonstração

Entre com `demo@fixa.test` e `demo1234`. Qualquer identificação e senha não vazias são aceitas **somente no mock**; não use credenciais reais. A sessão termina ao atualizar a página. Em recuperação, use um e-mail válido e o código `123456`; nenhum e-mail é enviado e nenhuma senha é alterada.

| Rota | Fluxo disponível nesta versão |
| --- | --- |
| `/sobre` | Página pública de apresentação do projeto e acesso à demonstração |
| `/login`, `/recuperar-senha` | Login, recuperação demonstrativa em quatro etapas, validação e feedback |
| `/` | Home com banner original, indicadores, gráfico e calendário com sete dias e seletor semanal em calendário mensal e eventos compartilhados com o Calendário |
| `/dashboard` | KPIs, dois gráficos circulares, filtros de técnico/período/métrica, barras, linha, histograma, boxplot e dispersão com dados demonstrativos |
| `/equipe` | Busca, filtro, paginação, detalhes com desempenho semanal/mensal, cadastro, edição e exclusão **em memória** de técnicos |
| `/calendario` | Grade mensal, seleção de dia e criação, edição e exclusão **em memória** de eventos com local, descrição, observação e horários |
| `/perfil` | Dados do gestor editáveis **em memória** e validação demonstrativa de troca de senha |
| `/configuracoes` | Português, inglês, espanhol e mandarim (chinês simplificado); temas claro e escuro, aplicados na hora |
| `/manu` | Conversas guiadas, sugestões, busca e metadados de anexos **sem IA conectada** e sem gravação persistente |

As ações em memória são perdidas ao sair, entrar novamente ou recarregar. Uma gravação iniciada antes do logout não altera a sessão seguinte. Não há endpoints inventados nem afirmação de persistência real. Os dados de exemplo estão em `src/mocks`; páginas acessam os services tipados de `src/services`. O cliente Axios em `src/services/api.ts` ficará disponível para integrar o contrato real quando existir. `.env.example` deixa `VITE_API_BASE_URL` comentada e sem URL presumida; variáveis `VITE_` são públicas e não devem conter segredos.

O cadastro do gestor define acesso **TÉCNICO** automaticamente e copia seu endereço ao salvar. Os campos de endereço são somente para leitura. A senha de criação segue uma regra provisória e não é armazenada. Veja as [regras e decisões do cadastro](docs/REGRAS_CADASTRO_TECNICOS.md), incluindo os pontos a confirmar com a API.

A Manu preserva conversas entre rotas, inclusive respostas que terminem durante a navegação; login, logout e recarregamento limpam o histórico. Anexos guardam somente nome e tamanho: nenhum conteúdo é lido, enviado ou analisado. Use `Ctrl + Enter` para enviar a mensagem; `Enter` insere uma nova linha.

A Equipe do gestor mostra apenas técnicos. A administração de gestores pertence ao escopo de Administração/RH, ainda sem interface e contrato nesta aplicação. As notificações e os selos repetidos de dados demonstrativos foram removidos por decisão do usuário; os limites dos mocks continuam descritos nesta documentação.

No desktop, o botão no topo da navegação lateral recolhe e expande o menu em qualquer rota. Em telas menores, o botão do cabeçalho abre o menu móvel. Na Manu, a saudação permanece visível durante a conversa e “Novo chat” só fica disponível depois que a conversa atual recebe uma mensagem.

Indicadores e desempenho usam fixtures sintéticas, independentes dos eventos criados. No Dashboard, a distribuição demonstrativa entre os seis técnicos iniciais preserva os totais e amostras de cada mês. Técnicos novos mostram indicadores vazios. Isto não representa produtividade real nem conexão com Data Mart.

## Estrutura

- `src/pages`: telas com `index.tsx` e CSS Modules.
- `src/components`: marca, campos, cards e layout reutilizáveis.
- `src/contexts`: sessão demonstrativa e preferências de idioma/tema com Context e hooks.
- `src/types`: contratos das entidades e props.
- `src/services`: interface de dados da demonstração, preparada para substituição por API.
- `src/mocks`: massa inicial e indicadores.
- `src/utils`: validação, datas, semanas e leitura segura de preferências.
- `src/i18n`: traduções da interface; nomes e conteúdo cadastrados são preservados.
- `src/assets/figma`: imagens locais exportadas do protótipo, sem URLs temporárias em runtime.

Somente idioma e tema são salvos em `localStorage`, na chave `fixa.preferences`; são preservados ao recarregar e sair da conta. Valores inválidos retornam ao português e tema claro. Não há armazenamento de senha ou conversa no navegador. `PrivateRoute` protege apenas a navegação do protótipo; autorização real precisa ser aplicada no backend. Conteúdo dinâmico é renderizado como texto JSX.

## Qualidade e evidências

- Em 05/10/2026, nesta revisão: **26 testes Node**, build, lint e formatação aprovados. A revisão no navegador validou os quatro idiomas, tema escuro, preferências após recarregar, evento de sábado na Home e semanas entre meses/anos. Home e Equipe continuam cabendo em notebook; tablet e celular foram conferidos. Veja os cenários e limites em [QA](docs/QA_NAVEGADOR.md).

- Em 28/09/2026: build TypeScript/Vite, lint, formatação e **20 testes Node** aprovados. Os testes cobrem validação, cópias independentes, eventos compartilhados, distribuição analítica, recuperação, histórico da Manu e isolamento da sessão demonstrativa.
- Em 05/10/2026: a Home foi refinada para preservar as proporções do Figma em diferentes alturas, com sidebar maior. Home, Equipe, Calendário e Perfil cabem sem rolagem em 1280 × 720 e 1340 × 800 no estado inicial. Quando necessária, a rolagem ocorre na área abaixo do cabeçalho, evitando sobreposição; as setas dos campos de seleção têm posição e espaçamento consistentes. O símbolo da FIXA foi adicionado à aba. As medidas e os limites dessa checagem estão no [QA do navegador](docs/QA_NAVEGADOR.md).
- O código usa Prettier com indentação de dois espaços, configurado em `.prettierrc.json`. Execute `npm run format` para aplicar o estilo.
- [`.github/workflows/qualidade.yml`](.github/workflows/qualidade.yml) prepara build, lint, testes e formatação em PRs e `main`; [template de PR](.github/PULL_REQUEST_TEMPLATE.md) registra verificação. O workflow ainda não rodou em GitHub, pois falta o repositório remoto.
- Login → Home, cadastro de técnico, CRUD de eventos, edição de perfil, Manu, navegação móvel, página pública e 404 foram percorridos no navegador local. Veja a [evidência de QA](docs/QA_NAVEGADOR.md) e seus limites.
- A [revisão visual](docs/FIDELIDADE_VISUAL.md) registra os IDs da cópia do Figma, comparações diretas de Login, Recuperação, Home, Dashboard, Equipe, Calendário, Perfil e Manu, além das diferenças conhecidas. Ela não aprova todos os frames e estados. A Home recebeu o banner e o avatar originais; a Manu recebeu sua arte original.
- A [matriz de requisitos](docs/MATRIZ_REQUISITOS.md) registra critério, estado, arquivo, teste e demonstração. Os [critérios externos](docs/CRITERIOS_EXTERNOS.md) detalham as entregas das demais disciplinas. O [roteiro DAD](docs/ROTEIRO_DAD.md) contém os passos de apresentação e o que ainda precisa ser validado.
- `docs/REVISAO_INICIAL.md` descreve a revisão anterior e permanece como registro histórico, **não como estado atual**.

## Pendências de integração e publicação

O backend de autenticação, CRUD, autorização e Manu ainda não possui contrato. O Dashboard não está conectado ao Data Mart. A rubrica do PDF também exige artefatos de outras disciplinas, hospedagem e histórico Git distribuído por quatro semanas reais; este frontend não comprova essas entregas. Consulte a matriz para cada dependência.

Para publicar na Vercel, use build `npm run build` e diretório de saída `dist`. [`vercel.json`](vercel.json) redireciona rotas da SPA para `index.html`. **Ainda não há URL pública**; após publicar, registre aqui a URL da aplicação e do repositório e execute o roteiro no ambiente publicado. O tablet físico, leitor de tela e todos os estados do Figma devem ser verificados antes de chamar a versão integrada de final.
