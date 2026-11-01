# Contribuição no FIXA Web

As regras da organização FIXA aplicam-se a este repositório. Consulte
https://github.com/Fixa-Inter/.github/blob/main/docs/padroes-git.md e
https://github.com/Fixa-Inter/.github/blob/main/docs/organizacao-projeto.md.

- Registre ou vincule uma Issue antes de iniciar cada nova atividade. Use o template oficial, responsável, critérios e estimativa; registre apenas tempo real, sem reconstruir horas antigas.
- Crie a branch de trabalho a partir de `origin/dev` atualizado. Use `feature/`, `bugfix/`, `hotfix/`, `docs/`, `refactor/` ou `test/`, conforme o guia da organização.
- Desenvolva na branch de trabalho. Não faça commits nem push direto em `dev`, `hml` ou `main`.
- Use Conventional Commits, de preferência com escopo, e preserve autoria e datas reais.
- Use o template oficial de PR em `.github/PULL_REQUEST_TEMPLATE.md`, vincule a Issue e informe evidências, validação, limitações e uso de IA.
- Abra PR da branch de trabalho para `dev`. A promoção é `dev` → `hml` → `main`, por PR e após revisão/CI/homologação. Não simule aprovação de outro integrante nem promova antes dessas etapas.
- Vincule a Issue ao Project correspondente e mantenha o status real. Falta de acesso deve ser informada, sem marcar trabalho como aprovado ou finalizado.
- Verifique `npm run format:check`, `npm run lint`, `npm test` e `npm run build`. Confira no navegador mudanças de interface ou interação quando necessário.
- Preserve LICENSE e o workflow da organização em `.github/workflows/criar-releases.yaml`.
- Para a importação inicial da Issue #7, preserve os 64 commits locais anteriores e o histórico remoto. A importação não representa cumprimento retroativo das regras.

Veja também [CONTRIBUTING.md](CONTRIBUTING.md).
