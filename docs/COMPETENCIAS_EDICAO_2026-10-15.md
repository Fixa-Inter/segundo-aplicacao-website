# Competências: consulta e edição — 15/10/2026

Continuação da [Issue #9](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/9), na branch `feature/login-competencias-tecnicos`, conforme ajuste solicitado pelo usuário. Implementação, testes e conferência de interface feitos com assistência do Codex. Sem novo PR nesta etapa, por solicitação do usuário; sem aprovação, merge ou homologação presumidos.

## Alterações

- Detalhes: resumo e lista somente para leitura, sem lápis, botões de edição ou sublegendas. Campo vazio aparece como `_`, com peso normal; a indicação de ausência permanece acessível por nome para leitores de tela. O botão Ver todas/Ver resumo foi mantido.
- Cadastro/edição: dez campos opcionais, com os nomes e IDs do enum existente. Aceitam inteiros de 0 a 10; vazio remove/deixa sem avaliação, e zero continua sendo uma nota. Layout em duas colunas no desktop e uma no celular, seguindo as cores, campos e cantos do restante da interface.
- Edição aguarda o carregamento das notas antes de montar o rascunho. Erro de leitura oferece nova tentativa e retorno; não substitui notas existentes por campos vazios. Leitura cancelada ao desmontar.
- O formulário mantém os valores locais até confirmar Salvar. Dados do cadastro e lote de notas são validados antes de qualquer alteração no repositório em memória. Uma nota inválida ou falha no cadastro não produz gravação parcial.
- `isDirty` considera notas e cadastro. Cancelar preserva o diálogo de descarte; restaurar os valores originais permite sair diretamente. Texto ainda inválido também conta como alteração não salva.

## Verificações

`npm run format:check`, `npm run lint`, `npm test` e `npm run build` aprovados, com **43 testes**. Dois cenários adicionais verificam salvamento conjunto das dez notas, remoção, preservação das demais categorias/técnicos, rejeição sem gravação parcial e encerramento de sessão durante uma gravação. A conversão dos campos também rejeita frações, expoentes e texto inválido.

| Cenário no navegador local | Resultado |
| --- | --- |
| Detalhes expandidos | Dez notas; único controle da seção é Ver resumo; sem campos editáveis e sem sublegendas visíveis |
| Editar técnico | Dez campos carregados com os valores salvos |
| Salvar zero, 10 e campos vazios | Valores preservados; zero conta como avaliação |
| Nota 1,5 / texto `1e1` | Erro no campo, foco no primeiro erro e nenhuma confirmação de salvamento |
| Cancelar após alterar apenas notas | Abre descarte; Cancelar no diálogo mantém rascunho |
| Confirmar descarte | Valor anterior permanece ao reabrir edição |
| Voltar sem alteração / restaurar valor original | Retorna à equipe sem diálogo de descarte |
| Limpar uma nota e salvar | Consulta mostra `_` e atualiza contador; demais notas preservadas |
| Desktop 1280 × 720 / celular 390 × 844 | Campos e consulta legíveis; sem transbordamento horizontal; foco por teclado visível |
| Console na conferência final | Sem avisos ou erros |

Não foi feita validação com leitor de tela, todos os idiomas/temas ou API real. As notas permanecem no mock da sessão; não há sincronização com mobile ou persistência após recarregar/login/logout. O impedimento de gravação parcial refere-se ao serviço demonstrativo local, sem alegação de transação de backend.

## Capturas

- [Consulta desktop](evidencias/competencias-edicao-2026-10-15/consulta-1280x720.jpg).
- [Edição desktop](evidencias/competencias-edicao-2026-10-15/edicao-1280x720.jpg).
- [Consulta celular](evidencias/competencias-edicao-2026-10-15/consulta-390x844.jpg).
- [Edição celular](evidencias/competencias-edicao-2026-10-15/edicao-390x844.jpg).
- [Confirmação de descarte](evidencias/competencias-edicao-2026-10-15/descarte-1280x720.jpg).
