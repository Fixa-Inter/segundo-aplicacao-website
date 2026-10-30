# Consolidação da Web e preparação de publicação — 30/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), responsável Gkso31 com apoio do Codex. Branch `feature/integracao-ia-manu`. O usuário autorizou consolidar a Web em PR antes da publicação na Vercel e indicou `ryancursinom` para Code Review.

## Escopo consolidado

A branch contém 48 commits de integração ainda não incorporados a `dev`, além deste preparo de configuração. A comparação inicial não tinha commits exclusivos de `origin/dev`, preservando o histórico da importação e as mudanças anteriores.

- Autenticação real com CNPJ/e-mail/senha, renovação, recuperação de senha, equipe, competências decimais opcionais, perfil e eventos pela API Web AWS.
- Equipe do RH em abas Gestores/Técnicos; regras de unidade e de edição respeitam os contratos disponíveis.
- Manu com Bearer, upload Cloudinary, histórico, emoções, confirmação/correção, encerramento em Novo chat, exclusão confirmada e imagens recuperadas no reload.
- Databricks por iframe em Dashboard, Home e ficha do técnico; seleção de gráfico e filtro de nome onde o contrato foi conferido.
- Organização em serviços/hooks/DTOs, quatro idiomas, acessibilidade, descarte de alterações e responsividade com áreas de toque adequadas.
- Testes de contrato e navegador, guias locais, relatórios datados e evidências.

## Preparação da Vercel

- `vercel.json`: framework Vite, instalação `npm ci`, build `npm run build` e saída `dist`.
- `package.json` e lock alinhados em Node.js `24.x`, como no CI.
- Rotas de API avaliadas antes do fallback da SPA: `/api/web/*` → API Web AWS; `/api/ia/*` → IA AWS. Caminhos `/api/*` desconhecidos retornam 404.
- Respostas de API com `Cache-Control: private, no-store` e cache externo da Vercel desabilitado.
- A origem do navegador é removida apenas no encaminhamento servidor→servidor da API Web; o Bearer permanece e as permissões continuam sendo verificadas pelo backend. A API Web recusou com 403 a origem de teste da Vercel em chamada direta. O proxy local da build de produção passou em login e leituras reais.
- `.gitignore` inclui `.vercel`; `.vercelignore` exclui dependências, `.env*`, builds e material local/QA da carga de publicação.

A configuração foi validada contra as regras do schema oficial da Vercel. O validador Python não estava instalado; o AJV existente foi usado sem adicionar dependências. A conferência do próprio metaschema foi desativada porque o schema oficial combina declaração draft-04 com palavras-chave numéricas mais recentes. As regras aplicadas ao arquivo passaram. O comportamento da hospedagem ainda precisa de validação na Vercel; o preview local não comprova implantação pública.

## Variáveis da hospedagem

Configurar antes do build, tanto em Preview quanto em Production:

```dotenv
VITE_API_BASE_URL=/api/web
VITE_AI_BASE_URL=/api/ia
VITE_CLOUDINARY_CLOUD_NAME=<cloud_name público autorizado>
VITE_CLOUDINARY_UPLOAD_PRESET=<preset unsigned autorizado>
VITE_CLOUDINARY_FOLDER=solicitacoes
VITE_DATABRICKS_DASHBOARD_URL=<URL de embed publicada>
VITE_DATABRICKS_HOME_WIDGET=a5185eb0~solicitacoes-por-periodo
VITE_DATABRICKS_TECHNICIAN_WIDGET=37645ca6~os-criadas-por-periodo
VITE_DATABRICKS_TECHNICIAN_FILTER=f_37645ca6~tecnico1.s
```

As variáveis `VITE_*` são públicas. Senhas de banco/e-mail, JWT_SECRET, chaves de modelos e Cloudinary API Secret não pertencem ao frontend. A cópia de build usada no teste foi gerada em `dev.local` apenas a partir da lista explícita de nove campos públicos; não entrou no Git.

## Verificação de Git e execução

- `.env`, `.env.local`, `.env.production`, `node_modules`, `dist`, `dev.local` e `.vercel` foram conferidos com `git check-ignore`.
- Nenhum desses arquivos/pastas aparece nos 475 arquivos rastreados examinados.
- Não foram encontrados padrões de chave privada, chave de acesso AWS, senha Aiven ou JWT completo nos arquivos examinados e nas adições dos 48 commits. Os valores nunca foram impressos no relatório.
- `LICENSE` e `.github/workflows/criar-releases.yaml` permanecem iguais à base `dev`.
- Build de produção com as variáveis de hospedagem: aprovado. No Edge, login 200, equipe e recarregamento de rota direta aprovados, histórico da IA 200, Bearer observado nos acessos protegidos e nenhum erro de JavaScript. Não foram criados registros operacionais.
- Formatação, lint, **146 testes de unidade/contrato**, **31 testes de navegador** e build aprovados. A rodada final incluiu os fluxos móveis, sessão/histórico da Manu e as validações de carregamento cancelado.

## Fluxo e dependências

1. Abrir PR da integração para `dev`, preencher o template e solicitar Code Review a `ryancursinom`.
2. Depois da revisão/CI e merge, promover `dev` → `hml` para homologação real.
3. Após homologação, promover `hml` → `main`.
4. Só então conectar a Vercel ao repositório, com Production apontando para `main`, e validar a URL pública. Os próximos pushes/PRs podem gerar previews; a produção acompanha a branch configurada.

Não há autenticação Vercel confirmada nem projeto publicado nesta etapa. A implantação foi adiada por orientação do usuário; não depende de conectar a Vercel para abrir o PR.

BI: o domínio final precisa ser aprovado no Databricks e o visitante precisa da autenticação exigida por ele. A autorização por unidade não é garantida por um filtro visual. O código de preparação desse filtro continua sem ativação nas telas e aguarda o contrato/restrição do BI/API, conforme [registro específico](BI_UNIDADE_PREPARACAO_2026-10-27.md). Isso é um ponto de atenção para a homologação, não uma alegação de isolamento concluído.

O vínculo/status do GitHub Project continua dependente de acesso da equipe; não foi simulado nem marcado como Finalizado.

## Evidências

- [Resumo e tempo medido](evidencias/preparacao-pr-2026-10-30/resumo.json).
- [Arquivos rastreados](evidencias/preparacao-pr-2026-10-30/git-hygiene.json).
- [Adições no histórico pendente](evidencias/preparacao-pr-2026-10-30/history-hygiene.json).
- [Teste real da build de produção local](evidencias/preparacao-pr-2026-10-30/production-smoke.json).

Referências primárias: [rotas e transformações Vercel](https://vercel.com/docs/project-configuration/vercel-json), [controle de cache de rewrites](https://vercel.com/docs/routing/rewrites), [Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [integração Git](https://vercel.com/docs/git).

Início observado: 30/10/2026 às 12h38m16s. Registro final das verificações: 12h58m09s, America/Sao_Paulo. Tempo decorrido observado: **19.9 minutos**, estimativa inicial 45 minutos. O intervalo inclui o preparo inicialmente solicitado para a Vercel e a consolidação de PR priorizada em seguida.
