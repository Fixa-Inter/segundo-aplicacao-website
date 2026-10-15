# Acabamento das competências — 15/10/2026

Continuação da [Issue #9](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/9), na branch `feature/login-competencias-tecnicos`. Ajustes e validações feitos com assistência do Codex. Nenhum novo PR aberto, conforme pedido do usuário; aprovação, merge e homologação continuam pendentes. O acesso ao Projects ainda depende da permissão previamente informada.

## Resultado

- Especialidade da equipe e do cabeçalho calculada pela competência com maior nota. Sem avaliações: **Sem notas**. Zero é uma avaliação válida; empates usam o menor ID, mantendo a ordenação previsível. O formulário mostra a especialidade automaticamente e permite criar técnicos sem avaliações.
- Destaque de até três competências avaliadas; ao expandir, mostra somente as restantes. Com três destaques são sete itens abaixo; com uma nota, um destaque e nove itens; sem notas, estado vazio e acesso às dez categorias.
- Botão de expansão com `ChevronDown` do mesmo conjunto de ícones do Dashboard, hover com a cor usada no filtro, rotação vertical suave e respeito a movimento reduzido. `aria-expanded` e navegação por teclado preservados.
- Texto explicativo removido da apresentação visual do formulário; instrução associada aos campos permanece disponível para tecnologia assistiva. Conforme refinamento final do usuário, **os inputs não têm placeholder**: ficam vazios com ou sem foco. `_` continua apenas na consulta de notas ausentes.

## Verificação

`npm run format:check`, `npm run lint`, `npm test` e `npm run build` aprovados, com **45 testes**. Dois novos cenários cobrem a partição sem duplicação, ausência de destaques vazios, desempate, zero válido, especialidade após salvar/remover e isolamento entre técnicos. Também foi conferido cadastro sem especialidade/avaliações obrigatórias.

Conferência no navegador local:

| Cenário | Resultado |
| --- | --- |
| Técnico sem notas | Equipe/cabeçalho/formulário mostram Sem notas; nenhum destaque vazio |
| Apenas nota zero | Um destaque, nove itens restantes; especialidade correspondente |
| Quatro notas | Três destaques e sete itens, sem repetição; maior nota define especialidade |
| Expandir/recolher com Enter | Atualiza estado e seta vertical |
| Consulta em 1280 × 720 e 390 × 844 | Layout legível, sem transbordamento horizontal |
| Formulário sem descrição visual | Dez campos continuam nomeados e opcionais |
| Refinamento final em desktop | Dez campos sem atributo placeholder; preenchidos mostram 5 e 10, vazios permanecem em branco com e sem foco |

Dados continuam em memória durante a sessão, sem sincronização com mobile ou API. Não foi executado teste com leitor de tela, todas as combinações de idioma/tema ou backend real. As capturas móveis de consulta foram feitas antes da remoção final do placeholder, que alterou somente o editor; a captura final do editor é desktop.

## Capturas

- [Equipe sem notas](evidencias/competencias-acabamento-2026-10-15/equipe-sem-notas-1280x720.jpg).
- [Consulta sem repetição no desktop](evidencias/competencias-acabamento-2026-10-15/competencias-sem-repeticao-1280x720.jpg).
- [Consulta no celular](evidencias/competencias-acabamento-2026-10-15/competencias-sem-repeticao-390x844.jpg).
- [Editor final sem placeholder](evidencias/competencias-acabamento-2026-10-15/edicao-sem-placeholder-1280x720.jpg).
