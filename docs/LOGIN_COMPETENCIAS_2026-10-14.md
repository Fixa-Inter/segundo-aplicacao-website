# Login e competências — 14/10/2026

Registro histórico. Em 15/10/2026, a edição de competências foi transferida para o formulário do técnico, e os detalhes passaram a ser somente leitura. Veja a [implementação e QA atuais](COMPETENCIAS_EDICAO_2026-10-15.md).

Atividade registrada na [Issue #9](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/9) antes da implementação. Branch `feature/login-competencias-tecnicos`, criada a partir de `origin/dev` em `2434a4d`, após o merge da importação. Nenhum novo PR foi aberto nesta etapa, conforme solicitado pelo usuário.

## Login

- Três campos obrigatórios: CNPJ, e-mail e senha. Erros específicos associados aos campos e foco no primeiro erro.
- CNPJ aceita formato numérico e alfanumérico, com ou sem máscara. A compatibilidade de formato considera o [CNPJ alfanumérico da Receita Federal](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico). A validação local é apenas de formato; não consulta registro de empresa nem calcula/verifica os dígitos verificadores.
- E-mail validado separadamente. CNPJ é normalizado ao entrar no mock; senha não é retornada no objeto da sessão nem armazenada.
- Esqueci minha senha continua usando o e-mail preenchido para abrir diretamente a etapa de código. CNPJ vazio não impede recuperar pelo e-mail.
- Layout ajustado para os três campos. Desktop mantém a Manu e celular usa uma coluna.

Exemplo fictício para testar: CNPJ `12.345.678/0001-95`, e-mail `demo@fixa.test`, senha `demo1234`. Autenticação real depende do backend.

## Competências dos técnicos

| ID  | Código do enum      | Categoria             |
| --- | ------------------- | --------------------- |
| 1   | ELETRICA            | Elétrica              |
| 2   | HIDRAULICA          | Hidráulica            |
| 3   | MECANICA            | Mecânica              |
| 4   | INFORMATICA         | Informática           |
| 5   | MOBILIARIO          | Mobiliário            |
| 6   | CLIMATIZACAO        | Climatização          |
| 7   | REDE_CONECTIVIDADE  | Rede e Conectividade  |
| 8   | SEGURANCA           | Segurança             |
| 9   | ILUMINACAO          | Iluminação            |
| 10  | LIMPEZA_CONSERVACAO | Limpeza e Conservação |

Os IDs e nomes seguem o enum da imagem enviada; não foram usados os rótulos repetidos da ilustração mobile. A interface adapta o resumo de três cards, lista e editor antigo/novo da referência ao visual atual da web.

- Notas opcionais, inteiras, de 0 a 10. Ausência de avaliação usa `null`, distinta de zero. Nenhuma nota inicial foi inventada para os técnicos.
- Resumo com três competências e lista completa em Ver todas, ordenadas por nota decrescente; empates e competências sem nota usam o ID estável. A ordenação não compara técnicos nem constitui classificação de funcionários.
- Editor sobreposto à página, com nota antiga, novo valor e botões Cancelar/Salvar. Deixar em branco remove a avaliação. Erros aparecem no DOM com `role=alert` e foco no campo.
- Salvar atualiza resumo, lista e contador de avaliações. Cancelar, Escape e voltar preservam ou descartam o rascunho mediante confirmação quando necessário.
- A proteção de alterações foi movida para `useLayoutEffect` para cobrir navegação imediata após digitar; a confirmação tem z-index acima do editor. O foco retorna ao botão que abriu o modal após a transição, com fallback para Ver todas quando a ordenação remove um card do resumo.
- Estado de carregamento, erro com nova tentativa, salvamento e sucesso. O hook tipado `useTechnicianCompetencies` acessa os services e usa AbortController ao desmontar. O service respeita o sinal no carregamento e salvamento e impede operações de sessões encerradas.
- Notas são mantidas por ID do técnico somente na sessão em memória. Editar o cadastro não elimina as notas; excluir o técnico remove as avaliações. Logout/login e recarregamento limpam os dados demonstrativos.

**Integração pendente:** não há contrato de API fornecido. A implementação não sincroniza notas com o app, não identifica empresas reais pelo CNPJ e não altera credenciais reais. `competencyId` e `rating` são contratos internos desta demonstração; não são endpoints ou payloads de backend presumidos. Não há armazenamento das notas ou senhas em localStorage.

## Verificações

Build, lint, Prettier e 41 testes aprovados. Os seis testes novos cobrem login com campos obrigatórios e formatos, catálogo, ausência/zero, notas independentes, valores inválidos, cópias, remoção, cadastro, cancelamento e encerramento da sessão.

| Cenário no navegador local                       | Resultado                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| Enviar Login vazio                               | Três erros específicos; foco no CNPJ                                     |
| Recuperar com e-mail e CNPJ vazio                | Abre etapa de código com e-mail mascarado                                |
| Login em desktop 1280 × 720 e celular 390 × 844  | Três campos e botão acessíveis; celular sem transbordamento horizontal   |
| Abrir competências                               | Dez categorias e avaliações vazias; resumo e lista por ID                |
| Nota 11 ou 1,5                                   | Rejeitada; foco no Novo valor                                            |
| Cancelar nota alterada → Cancelar descarte       | Mantém o rascunho                                                        |
| Descartar nota alterada                          | Mantém o valor anteriormente salvo                                       |
| Salvar 9, zero e 10                              | Atualiza contador, lista e resumo; zero conta como avaliação             |
| Abrir outro técnico                              | Notas independentes; voltar para Ana mantém as notas salvas              |
| Navegação Voltar imediatamente após digitar      | Bloqueada; Cancelar mantém o rascunho                                    |
| Restaurar valor original → Cancelar              | Fecha sem confirmação de descarte                                        |
| Salvar e remover Rede e Conectividade no celular | Categoria volta a sem avaliação; outras notas preservadas                |
| Escape com alteração / sem alteração             | Com alteração pede descarte; sem alteração fecha e devolve foco ao botão |
| Logout e novo login                              | Todas as avaliações demonstrativas voltam a vazias                       |

Durante a troca de `useEffect` por `useLayoutEffect` por hot reload, o console registrou um aviso de ordem de hooks da versão anterior. Após recarregar a aplicação e repetir login, salvar, foco e navegação protegida, não houve novos avisos/erros. A sessão limpa é a referência de QA. Não foram executados API real, integração mobile, leitor de tela ou inspeção de todas as combinações de idioma/tema.

## Capturas

- [Login desktop](evidencias/login-competencias-2026-10-14/login-1280x720.jpg).
- [Login celular](evidencias/login-competencias-2026-10-14/login-390x844.jpg).
- [Competências desktop](evidencias/login-competencias-2026-10-14/competencias-1280x720.jpg).
- [Resumo no celular](evidencias/login-competencias-2026-10-14/competencias-resumo-390x844.jpg).
- [Editor desktop](evidencias/login-competencias-2026-10-14/competencia-modal-1280x720.jpg).
- [Editor celular](evidencias/login-competencias-2026-10-14/competencia-modal-390x844.jpg).
- [Confirmação de descarte sobre o editor](evidencias/login-competencias-2026-10-14/competencia-descarte-1280x720.jpg).
