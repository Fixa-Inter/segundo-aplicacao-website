# FIXA Web

Aplicação de gestão de manutenção para o perfil gestor, em **React 19, TypeScript e Vite**. A interface segue os frames **Website v2** do [Figma acadêmico](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628). O projeto está em fase de **demonstração local**: a API e a base analítica ainda não foram entregues.

## Executar e verificar

Requer Node.js 22.12+ ou 20.19+. Dentro de `fixa-web`:

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
| `/` | Home com banner original, indicadores, gráfico e calendário semanal |
| `/dashboard` | KPIs, filtros de período/métrica, barras, linha, histograma e boxplot com dados demonstrativos |
| `/equipe` | Busca, filtro, paginação, consulta, cadastro, edição e exclusão **em memória** de técnicos |
| `/calendario` | Grade mensal, seleção de dia e criação, edição e exclusão **em memória** de eventos com local, descrição, observação e horários |
| `/perfil` | Dados do gestor editáveis **em memória** e validação demonstrativa de troca de senha |
| `/manu` | Conversas guiadas **sem IA conectada** e sem gravação persistente |

As ações em memória são perdidas ao recarregar. Não há endpoints inventados nem afirmação de persistência real. Os dados de exemplo estão em `src/mocks`; páginas acessam os services tipados de `src/services`. O cliente Axios em `src/services/api.ts` ficará disponível para integrar o contrato real quando existir. `.env.example` documenta `VITE_API_BASE_URL`; variáveis `VITE_` são públicas e não devem conter segredos.

## Estrutura

- `src/pages`: telas com `index.tsx` e CSS Modules.
- `src/components`: marca, campos, cards e layout reutilizáveis.
- `src/contexts`: sessão demonstrativa com Context, reducer tipado e hook.
- `src/types`: contratos das entidades e props.
- `src/services`: interface de dados da demonstração, preparada para substituição por API.
- `src/mocks`: massa inicial e indicadores.
- `src/utils`: validação e datas.
- `src/assets/figma`: imagens locais exportadas do protótipo, sem URLs temporárias em runtime.

Não há armazenamento de senha ou conversa no navegador. `PrivateRoute` protege apenas a navegação do protótipo; autorização real precisa ser aplicada no backend. Conteúdo dinâmico é renderizado como texto JSX.

## Qualidade e evidências

- Build TypeScript/Vite, lint e testes Node podem ser executados pelos comandos acima.
- O código usa Prettier com indentação de dois espaços, configurado em `.prettierrc.json`. Execute `npm run format` para aplicar o estilo.
- Login → Home, cadastro de técnico, CRUD de eventos, edição de perfil, Manu, navegação móvel, página pública e 404 foram percorridos no navegador local. Veja a [evidência de QA](docs/QA_NAVEGADOR.md) e seus limites.
- Foram comparados os frames Home, Dashboard, Equipe, Calendário, Perfil e Manu da cópia do Figma. A Home recebeu o banner e o avatar originais; a Manu recebeu sua arte original.
- A [matriz de requisitos](docs/MATRIZ_REQUISITOS.md) registra critério, estado, arquivo, teste e demonstração. O [roteiro DAD](docs/ROTEIRO_DAD.md) contém os passos de apresentação e o que ainda precisa ser validado.
- `docs/REVISAO_INICIAL.md` descreve a revisão anterior e permanece como registro histórico, **não como estado atual**.

## Pendências de integração e publicação

O backend de autenticação, CRUD, autorização e Manu ainda não possui contrato. O Dashboard não está conectado ao Data Mart. A rubrica do PDF também exige artefatos de outras disciplinas, hospedagem e histórico Git distribuído por quatro semanas reais; este frontend não comprova essas entregas. Consulte a matriz para cada dependência.

Para publicar na Vercel, use build `npm run build` e diretório de saída `dist`. [`vercel.json`](vercel.json) redireciona rotas da SPA para `index.html`. **Ainda não há URL pública**; após publicar, registre aqui a URL da aplicação e do repositório e execute o roteiro no ambiente publicado. O tablet físico, leitor de tela e todos os estados do Figma devem ser verificados antes de chamar a versão integrada de final.
