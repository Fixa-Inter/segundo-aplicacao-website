# Integração ao GitHub da FIXA - 14/10/2026

## Registro e base

- Repositório: [Fixa-Inter/segundo-aplicacao-website](https://github.com/Fixa-Inter/segundo-aplicacao-website).
- Atividade: [Issue #7](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/7), criada antes da branch de integração.
- Branch de trabalho: `feature/integrar-prototipo-web`, criada a partir de `origin/dev` em `4912abdb8d3294c83629b8e73a11ad90db483fe1`.
- Histórico local incorporado: 64 commits, até `9ac5583`, preservados com autoria e datas originais. A `main` local anterior continua como referência de recuperação; ela não é a branch de produção remota.
- Os dois históricos não possuíam ancestral comum. Foi feito merge explícito na branch de trabalho. O único conflito de conteúdo ocorreu no README; a resolução manteve a documentação completa do frontend e a identificação do repositório da organização.

Esta importação não comprova planejamento ou aprovação retroativos. O PR inicial é maior que o recomendado porque incorpora a aplicação já existente; as próximas atividades devem ser pequenas e registradas antes da implementação.

## Ajustes da integração

- LICENSE da organização preservada.
- Template de PR substituído pelo oficial da FIXA, com evidências, checklist, como testar e uso consciente de IA.
- `AGENTS.md` e `CONTRIBUTING.md` registram as regras: Issue → branch baseada em dev → PR para dev → revisão/CI → hml → homologação → main.
- CI de qualidade configurado para PRs e pushes em `dev`, `hml` e `main`.
- Textos normalizados em LF por `.gitattributes`; arquivos binários mantidos como binários.
- Workflow de release mantido na `main`. A referência antiga apontava para `criar-release.yml`, ausente no repositório da organização consultado. A chamada foi corrigida para o [workflow reutilizável existente](https://github.com/Fixa-Inter/.github/blob/main/.github/workflows/auto-release.yml), com `contents: write`, como exigido pelo job chamado. Isso não comprova execução de uma release; ela só ocorre após a promoção aprovada para main.
- Nenhuma funcionalidade de interface foi alterada nesta integração. As evidências de interação anteriores continuam em `docs/evidencias`, incluindo o descarte de alterações.

## Verificações locais

Em 14/10/2026, na árvore integrada:

- `npm run format:check`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: 35/35 aprovados.
- `npm run build`: aprovado, com chunks de páginas separados.
- `git diff --cached --check`: aprovado antes do commit.
- Busca dirigida sem marcadores de conflito e sem padrões de tokens GitHub/OpenAI ou chaves privadas nos arquivos da entrega. Essa busca não equivale a auditoria de segurança integral.

Não foram repetidos testes visuais de toda a aplicação nesta integração, pois as mudanças são de documentação e configuração. Não há nova aprovação integral de WCAG, leitor de tela, integração com API, IA, BI ou publicação.

## Revisão e homologação

O destino do PR de integração é `dev`. Ele deve passar pelo CI e pela revisão da equipe. O sucesso dos testes locais não representa aprovação de outro integrante. A Issue permanece aberta até os critérios de aceitação, aprovação e merge; nenhuma promoção para `hml` ou `main` deve antecipar essas etapas.

O vínculo da Issue com Projects exige acesso à autenticação de Projects. A permissão estava ausente na primeira consulta, e o usuário informou que irá habilitá-la. Datas de conclusão, status Finalizado e horas de desenvolvimento anteriores não devem ser inventados. O tempo da sessão de integração é separado das sessões antigas.

Fonte das regras: [padrões Git](https://github.com/Fixa-Inter/.github/blob/main/docs/padroes-git.md), [organização do projeto](https://github.com/Fixa-Inter/.github/blob/main/docs/organizacao-projeto.md).
