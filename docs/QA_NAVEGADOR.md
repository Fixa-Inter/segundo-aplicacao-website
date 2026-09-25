# Verificação no navegador local

Executada na aplicação Vite em `http://127.0.0.1:5173`, na sessão de 25/09/2026. Esta evidência distingue a interação observada da comparação visual ainda pendente.

| Verificação | Resultado observado | Limite |
| --- | --- | --- |
| Rota privada sem sessão | Abrir `/equipe` levou a `/login` | Proteção apenas no cliente; autorização real depende do backend |
| Login | Campos preenchidos, estado “Entrando…” e abertura da Home | Serviço de autenticação demonstrativo |
| Home | Cards, gráfico e evento semanal presentes; logo, avatar e banner carregados | Captura visual indisponível nesta sessão |
| Dashboard | Rota, gráficos e filtros renderizados | Métricas vêm de fixture; análise visual fina pendente |
| Equipe | Listagem, busca, cadastro e erros por campo observados; tabela em cartões no celular | Cadastro completo do Figma e regras de API ainda pendentes |
| Calendário | Grade, seleção, criação, edição e exclusão de evento em memória observadas; formulário com início, término, local e observação aparece | Automação não conseguiu alterar o `input type=time` para testar o erro no navegador; a regra de término posterior ao início passou no teste unitário |
| Perfil | Edição do nome exibiu mensagem de sucesso e atualizou o nome da interface | Persistência somente na sessão |
| Manu | Pergunta, histórico da sessão e resposta guiada observados | Não há serviço de IA conectado |
| Navegação móvel | Menu abriu e fechou com `Escape` | Percurso integral por teclado e leitor de tela pendentes |
| Página pública | `/sobre` abriu e seus links de acesso estavam disponíveis | Sem frame específico de landing no Figma Website v2 |
| Rota inválida | `/rota-inexistente` levou à página 404 com link de retorno | Retorno autenticado não foi testado nessa visita, pois a navegação direta recarregou a sessão em memória |
| Recuperação | Erro por e-mail ausente e avanço até etapa do código foram observados | Não foi validado o percurso completo de troca de senha no navegador; nenhuma credencial real é alterada pelo mock |

## Tamanhos e recursos

Foram aplicados os viewports **1340 × 800**, **800 × 1340** e **390 × 844**. Nas rotas Home, Dashboard, Equipe, Calendário, Perfil, Manu e Sobre, `document.documentElement.scrollWidth` não excedeu `clientWidth` depois do carregamento. As imagens dessas rotas estavam completas e com `naturalWidth > 0`. O conteúdo de Equipe permaneceu acessível por rolagem vertical no celular, e sua tabela foi exibida no layout de cartões. A viewport temporária foi restaurada após a verificação.

A ferramenta de captura de imagem do navegador retornou **“Unable to capture screenshot”** inclusive após restaurar a viewport. Portanto, as telas **não foram aprovadas em comparação visual pixel a pixel** com o Figma nesta sessão. Os frames da cópia [Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-5628) orientaram implementação e revisão estrutural. Ainda são necessários capturas no navegador, inspeção de contraste, teste completo de teclado, leitor de tela e tablet físico.
