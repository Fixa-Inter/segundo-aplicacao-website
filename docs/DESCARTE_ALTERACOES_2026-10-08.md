# Descarte de alterações — 08/10/2026

## Implementação

Técnicos (cadastro e edição), eventos (cadastro e edição) e perfil registram se os campos editáveis diferem dos valores iniciais. Voltar todos os campos aos valores originais remove o estado de alteração. Datas incompletas e campos esvaziados também contam como alterações; a comparação inclui o texto digitado, além da data normalizada. A senha provisória do cadastro participa da comparação sem ser armazenada.

Cancelar ou Voltar abre “Descartar alterações?” sobre a tela atual quando há alterações. Cancelar o pop-up, clicar fora ou pressionar Escape preserva o rascunho. Descartar executa a saída solicitada. Sem alterações, a saída é imediata. O perfil restaura os valores salvos ao descartar; um salvamento bem-sucedido atualiza a referência para a próxima edição.

O guard compartilhado também cobre links da sidebar e o botão Voltar do navegador. Na saída da conta, a confirmação de sair é seguida pela de descarte quando necessário; cancelar o descarte mantém a sessão e o rascunho. As ações do pop-up ficam bloqueadas durante o salvamento.

O roteamento passou a usar `createBrowserRouter` para habilitar o [`useBlocker` do React Router](https://reactrouter.com/api/hooks/useBlocker). Há um único blocker no layout autenticado. O layout é carregado sob demanda para preservar o tamanho do pacote inicial: 407,83 kB no build desta revisão, sem aviso de chunk acima de 500 kB.

Foi registrado `beforeunload` apenas enquanto há alterações. Recarregar, fechar a aba ou navegar para outro site usa o aviso nativo permitido pelo navegador, cujo texto e aparência não podem ser personalizados. Esse aviso nativo não foi conferido manualmente nesta revisão; a navegação interna foi.

## Ilustração

A arte foi criada com o ImageGen integrado, com fundo transparente, e está em [`src/assets/illustrations/confirm-discard.png`](../src/assets/illustrations/confirm-discard.png). É uma ilustração nova inspirada na família enviada pelo usuário, não uma exportação do Figma. Foi conferida isoladamente e dentro do pop-up no desktop e no celular. O componente mantém dimensões, botões, sobreposição e comportamento das demais confirmações.

### Prompt utilizado

```text
Use case: stylized-concept. Asset type: isolated illustration for an existing Portuguese maintenance web app confirmation popup, displayed at 240x240 px. Create ONLY the illustration, not a popup or UI mockup. Subject: discarding unsaved edits and returning to the original document. A white upright sheet of paper tilted slightly to the left with a folded upper-right corner and several abstract pale-blue horizontal lines, a medium blue curved undo arrow on the right pointing back toward the document, and a small white circular badge with a clean dark navy X at the lower right. A small blue eraser beside the document suggests erasing draft edits. Style: polished flat vector-like editorial illustration with crisp shapes, subtle gradients on blue objects, minimal navy outlines, clean curved edges. Match a family of corporate confirmation illustrations featuring blue paperwork, pencils, trash can and door, with soft pale blue organic backdrop blobs, two small blue leaf sprigs at the lower left, a delicate dotted curved orbit, a few small blue dots, and a pale elliptical ground shadow. Palette: deep blue #173D7B, navy #0C1A58, medium #578BD6, light #BFD0EE, very pale #E8F0FD, white. Composition: one cohesive centered compact icon-like scene, balanced, generous transparent outer margins, all objects fully visible. Genuine transparent background outside the local pale-blue decorative blob and shadow. No text, letters, numbers, typography, frame, buttons, logos or watermark. The undo arrow and X must be clearly drawn and readable at small size. Avoid photorealism, 3D plastic, crowded details or a full background rectangle.
```

## Verificação

- `npm run build`: aprovado (TypeScript e Vite).
- `npm run lint`: aprovado.
- `npm run format:check`: aprovado.
- `npm test`: 35/35 testes aprovados, incluindo três novos testes de comparação de rascunhos, reversão e datas incompletas.
- `git diff --check`: aprovado.

### Navegador local

Verificação em português e tema claro, com sessão e dados fictícios em memória, desktop 1280 × 720 e celular 390 × 844.

| Cenário                                                   | Resultado                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Técnico sem alterações → Cancelar                         | Retorna sem pop-up                                                |
| Nome alterado → Cancelar o formulário → Cancelar o pop-up | Mantém o texto digitado                                           |
| Restaurar todos os valores → Cancelar                     | Retorna sem pop-up                                                |
| Status alterado → Voltar → Descartar → reabrir            | Mantém o status anteriormente salvo                               |
| Data de nascimento incompleta → sidebar Calendário        | Bloqueia a navegação; Cancelar preserva o texto, Descartar navega |
| Data de evento incompleta → Voltar → Escape               | Mantém o rascunho                                                 |
| Alterar local do evento → confirmar salvamento → reabrir  | Valor salvo; Cancelar não pede descarte                           |
| Perfil → alterar nome → Cancelar / Descartar              | Cancelar mantém o rascunho; Descartar restaura os valores salvos  |
| Perfil → salvar complemento → reabrir → Cancelar          | Referência atualizada; sem pop-up                                 |
| Novo técnico vazio / com nome → Voltar do navegador       | Vazio sai direto; com nome exige confirmação                      |
| Perfil alterado → confirmar Sair → Cancelar descarte      | Mantém a sessão e a edição                                        |
| Perfil alterado → confirmar Sair → Descartar              | Sai para Login                                                    |
| Pop-up no celular                                         | Cabe na tela (320 × 350 px) e mantém a tela de origem ao fundo    |

Durante a atualização do roteador por HMR, o console acumulou nove avisos sobre blockers antigos do módulo anterior. Após recarregar a aplicação, a navegação por sidebar e pelo Voltar do navegador foi repetida sem novos avisos; não foram registrados erros de console. A revisão não cobre visualmente todos os idiomas, tema escuro ou dispositivos físicos.

### Capturas

- [Equipe: cancelar edição](evidencias/descarte-2026-10-08/equipe-descartar-1280x720.png).
- [Equipe: tentar navegar pela sidebar](evidencias/descarte-2026-10-08/equipe-navegacao-1280x720.png).
- [Evento: voltar com data incompleta](evidencias/descarte-2026-10-08/evento-descartar-1280x720.png).
- [Perfil: pop-up no celular](evidencias/descarte-2026-10-08/perfil-descartar-390x844.png).
