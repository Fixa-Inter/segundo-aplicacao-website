# Contribuir com o FIXA Web

Este repositório segue os [padrões Git](https://github.com/Fixa-Inter/.github/blob/main/docs/padroes-git.md) e a [organização de atividades](https://github.com/Fixa-Inter/.github/blob/main/docs/organizacao-projeto.md) da FIXA.

## Ordem de trabalho

1. Registre a atividade em uma Issue do repositório, com o template adequado, responsável, motivação, critérios de aceitação e estimativa em minutos. Vincule ao Project correspondente.
2. Atualize `origin/dev` e crie uma branch de trabalho a partir dessa referência. Exemplos: `feature/nome-da-feature`, `bugfix/nome-da-correcao`, `docs/nome-do-documento`, `refactor/nome-do-ajuste` e `test/nome-do-teste`.
3. Desenvolva e faça commits no padrão `tipo(escopo): descrição`, com datas e autoria reais.
4. Execute as verificações abaixo e registre evidências de interface quando aplicável.
5. Envie a branch de trabalho e abra PR para `dev`, preenchendo o [template oficial](.github/PULL_REQUEST_TEMPLATE.md). Referencie a Issue com `Closes #numero` e explique o uso de IA.
6. Passe por Code Review e pelo CI. A resolução de uma Issue ocorre após aprovação, merge e atendimento dos critérios; abrir um PR não significa concluir a atividade.
7. Consolide as entregas por PR de `dev` para `hml`. Após homologação, promova por PR de `hml` para `main`. As aprovações e validações da equipe devem ser reais.

Nunca desenvolva diretamente em `main` ou `hml`, nem faça push direto nas branches permanentes. O workflow de qualidade verifica PRs e as três branches permanentes. A release da organização é acionada pela `main`.

## Verificação local

```bash
npm ci
npm run format:check
npm run lint
npm test
npm run build
```

Use Node.js 24, alinhado ao CI. O projeto normaliza textos em LF por `.gitattributes` para manter a formatação consistente entre Windows e Linux.

## Kanban e horas

Use os estados e campos descritos no guia da organização. Mova a atividade para Em Revisão quando existir o PR; Finalizado exige aprovação e merge. Registre sessões reais nos comentários da Issue, por exemplo:

```text
+30m

Verificação e integração da branch de trabalho.
```

Não invente horas anteriores ou datas retroativas. Se a autenticação não permitir acessar Projects, registre a limitação e obtenha o vínculo com a equipe.

## Importação inicial

A [Issue #7](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/7) registra a importação dos 64 commits do protótipo local. A branch `feature/integrar-prototipo-web` foi criada a partir de `origin/dev`; o histórico local independente foi incorporado sem reescrita. Isso preserva o trabalho anterior, mas não representa planejamento ou aprovação retroativa. Novas atividades seguem o fluxo acima.
