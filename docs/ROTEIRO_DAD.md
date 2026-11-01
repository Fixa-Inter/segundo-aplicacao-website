# Roteiro de apresentação

Versão de 01/11/2026. Consulte o [mapa de critérios](ENTREGA_DAD.md) e os [contratos atuais](INTEGRACOES.md). Os ensaios presenciais ainda não foram realizados; os passos abaixo são um roteiro, não comprovantes de execução.

## Preparar

1. Executar as verificações do README e abrir a Web local ou a implantação aprovada quando disponível.
2. Usar contas autorizadas de Gestor e RH e dados de homologação. Não mostrar senhas/tokens nem editar registros compartilhados durante a apresentação sem planejamento.
3. Conferir login, API Web, Manu e acesso ao BI. Se o embed continuar em 502, explicar a dependência externa; não apresentar dados simulados como reais.
4. Depois da publicação, incluir a URL no README e testar acesso direto e recarga das rotas.

## Demonstrar a interface

| Fluxo        | O que mostrar                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Navegação    | Sobre, login, 404, rota privada sem sessão e retorno de foco                                               |
| Equipe       | Abas do RH, busca, filtro, paginação, detalhe por URL e ID inexistente                                     |
| Formulários  | Erros por campo, competências opcionais, seleção de turno e cancelamento de alterações                     |
| Calendário   | Selecionar data, ver eventos e, com registros de teste autorizados, criar/editar/excluir                   |
| Perfil       | Edição dos dados pessoais e leitura da localização da unidade                                              |
| Manu         | Histórico, envio, loader que termina com a resposta, emoções, anexos, proposta/correção e links de ofertas |
| Gráficos     | Visualização Recharts, tabela de dados e tratamento de contrato inválido; BI autenticado quando disponível |
| Preferências | Idioma/tema, recarga e recuperação de versão antiga ou armazenamento indisponível                          |
| Teclado      | Abas, menus, filtros, diálogos, confirmação e restauração de foco                                          |

A persistência real deve ser demonstrada com um registro próprio de homologação, consultando novamente após recarregar. Os testes de navegador usam respostas controladas e não substituem essa etapa. Recuperação de senha usa o código recebido por e-mail, sem código fixo.

## Explicar o código

1. Seguir `App` → página → componente → hook → serviço por recurso → DTO/validação, usando Equipe como exemplo.
2. Mostrar `useState` com campos relacionados e atualizações imutáveis.
3. Mostrar `useEffect` e suas dependências em uma consulta; retirar temporariamente uma dependência para demonstrar o efeito e restaurar o arquivo em seguida.
4. Explicar `AuthContext`/`PreferencesContext`, seus Providers/hooks e o prop drilling evitado.
5. Percorrer `AuthState`, `AuthAction` e o reducer, justificando por que as transições de autenticação usam esse modelo.
6. Mostrar o cancelamento no desmontar em `useResourceOptions`; não repetir gravações para demonstrar requisições.
7. Abrir build de produção com cache desabilitado e observar no Network os chunks de `React.lazy` e o fallback de `Suspense`.
8. Mostrar `_versao` e migração das preferências no localStorage; não expor sessionStorage com credenciais.
9. Mostrar as keys estáveis das listas, a validação dos formulários e os dados externos tratados antes do JSX/Markdown.
10. No React DevTools Profiler, comparar uma interação com e sem `useMemo`/`useCallback`. Medir renderizações/duração antes de afirmar ganho; restaurar a implementação.
11. Percorrer landmarks, campos, menus, mensagens e diálogos usando NVDA/VoiceOver. A verificação automática não substitui esse ensaio.
12. Mostrar o histórico Git real, PRs, CI, revisão e URL pública. Não simular datas, aprovações ou demonstrações não executadas.
