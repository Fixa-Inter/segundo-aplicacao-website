# Integração com API — 25/10/2026

Issue [#10](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/10). Branch `feature/integracao-api-web`, criada de `origin/dev` e avançada preservando os quatro commits de `feature/login-competencias-tecnicos`. Sem reescrever histórico ou promover branches permanentes.

Contrato consultado: [API Web FIXA, commit 1927e92](https://github.com/Fixa-Inter/segundo-api-web/tree/1927e92cb36c335744b599e11d024593326d0265). A implementação segue controllers, DTOs, services, enums e configuração de segurança, pois o README da API ainda é o template inicial.

## Endpoints conectados

| Interface | Contrato |
| --- | --- |
| Login | `POST /auth/login`, `{email, senha, cnpj}`; resposta com usuário, papel, access token e refresh token |
| Sessão | `POST /auth/refresh`, `POST /auth/logout`; GET `/api/v1/perfil` na restauração |
| Recuperação | `POST /auth/recuperar-senha`, `{email}`; POST `/auth/recuperar-senha/confirmar`, `{email, codigo, novaSenha}` |
| Troca autenticada | `POST /auth/alterar-senha`, `{senhaAtual, novaSenha, confirmarNovaSenha}` |
| Perfil | `GET/PATCH /api/v1/perfil`; nome, e-mail e nascimento |
| Técnicos | `GET/POST /api/v1/usuarios`, `GET/PATCH /api/v1/usuarios/{id}`, PATCH `/{id}/ativar` ou `/{id}/desativar` |
| Turnos | `GET /api/v1/turnos`, GET `/api/v1/usuarios/{id}/turnos`, POST `/api/v1/turnos/{turnoId}/usuarios/{id}` e PATCH `/api/v1/turnos-usuarios/{id}/desativar` |
| Competências | `GET/POST /api/v1/aptidoes`, PATCH `/{id}`, PATCH `/{id}/desativar`; criação com enum string, leitura com enum objeto |
| Locais | `GET /api/v1/locais` para seleção do local cadastrado |
| Eventos | `GET/POST /api/v1/eventos`, `GET/PATCH/DELETE /api/v1/eventos/{id}` |
| Unidade de administrador | `GET /api/v1/unidades`, selecionada pelo CNPJ usado no login; nunca chamado para GESTOR |

## Regras preservadas e adaptações

- A interface continua para gestão; não concede permissões apenas com base no estado do navegador. APIs autenticadas fazem a autorização real.
- `GET /api/v1/unidades` é exclusivo de ADMINISTRADOR. Para GESTOR, usuários, turnos e locais são filtrados no servidor. O ID da unidade de um novo técnico vem do turno selecionado. Isso permite cadastrar o primeiro técnico sem consultar endpoints de administrador.
- Nome de usuário: 3–100 caracteres; cargo: 2–100; e-mail até 100; nascimento no passado. A senha inicial é enviada apenas na criação, com 8–100 caracteres, conforme DTO. Telefone não consta no contrato.
- O tipo do novo usuário é sempre `TECNICO`. Turnos são selecionados de registros reais e podem ser múltiplos. Não se cria um turno implícito a partir de texto livre.
- Ausência de avaliação é distinta de zero. A remoção desativa a aptidão; uma nova nota atualiza e reativa o mesmo registro. As dez categorias preservam os IDs 1–10 do enum.
- A API aceita notas decimais, mas a web conserva a regra solicitada pelo usuário: edição somente com inteiros de 0 a 10. Uma nota decimal vinda de outro cliente é exibida como recebida e precisa ser ajustada para um inteiro antes de ser salva pela web.
- As etapas de usuário, turno, notas e situação não formam uma transação única na API. A validação do lote ocorre antes de gravar; falhas posteriores informam salvamento parcial, mantêm o ID no formulário e permitem nova tentativa. Cancelar recarrega a equipe para mostrar o estado persistido.
- A ação de excluir técnico do protótipo virou desativação, com confirmação específica. O cadastro inativo continua consultável e pode ser reativado na edição.
- Eventos exigem local cadastrado, título, descrição, descrição do local e período válido. Datas são `LocalDateTime` sem conversão UTC; há campo de data de término para eventos que atravessam dias.
- Na criação, “Meu usuário” associa o evento ao gestor autenticado; outro técnico pode ser escolhido. O responsável fica bloqueado na edição, pois o DTO de atualização não aceita `usuarioId`.
- Perfil: apenas nome, e-mail e nascimento são editáveis. Endereço/empresa são consultados somente para administrador; o contrato de perfil do gestor não os devolve. Telefone não é gravado. Não há simulação de atualização desses campos.
- O código de recuperação não é validado isoladamente pelo backend. A etapa dos seis dígitos apenas confere o formato; a confirmação real ocorre ao enviar código e nova senha. Não há código fixo. A resposta genérica ao pedir recuperação evita afirmar que um e-mail existe no cadastro.
- A troca de senha invalida refresh tokens no backend; a tela de sucesso orienta nova entrada e limpa a sessão ao voltar ao login.
- A API atual normaliza CNPJ somente numérico. A integração real recusa CNPJ alfanumérico em vez de remover letras silenciosamente; o suporte futuro depende do backend.

## Transporte e sessão

Bearer somente em chamadas autenticadas. Apenas respostas 401 iniciam renovação; 403 é erro de permissão. Chamadas 401 simultâneas compartilham uma renovação e usam o token rotacionado. Erro temporário de conexão não apaga a sessão; refresh inválido encerra. Uma resposta antiga não repõe tokens nem dados após logout ou entrada em outra sessão.

Tokens e identificação mínima ficam no `sessionStorage` da aba, com cópia em memória. Senhas e cadastros não são armazenados no navegador. O acesso continua em memória caso o navegador bloqueie `sessionStorage`. A restauração valida a sessão no servidor antes de renderizar rotas privadas. O logout limpa os dados locais imediatamente e tenta revogar o refresh token no servidor; se o servidor estiver indisponível, a revogação remota não é confirmada.

## Verificação realizada

- Dez testes de produção em `tests/api-contract.test.mjs`: Bearer/público, erro de campos, renovação concorrente, 403, refresh inválido, isolamento após logout, falha transitória, papéis/escopo, zero/sem nota, desativação/reativação, IDs reais, senha de criação, falha parcial/nova tentativa, horários locais e campos de perfil.
- As 45 verificações históricas continuam sobre fixtures explicitamente isoladas; não constituem evidência de backend real. Nenhum fallback dessas fixtures é usado pela aplicação.
- Navegador Edge isolado, respostas HTTP controladas: login, restauração ao recarregar, consulta/edição de técnico, notas 0/10, calendário com local/usuário reais do contrato, perfil, recuperação sem código fixo e Manu indisponível. Papel GESTOR recebe 403 em unidades no cenário controlado. Sem erros de JavaScript; 390×844 sem transbordamento horizontal.
- [Edição de técnico — desktop](evidencias/integracao-api-2026-10-25/tecnico-edicao-desktop.png), [celular](evidencias/integracao-api-2026-10-25/tecnico-edicao-mobile.png), [evento](evidencias/integracao-api-2026-10-25/evento-edicao-desktop.png).

## Resultado das verificações locais

`npm run format:check`, `npm run lint`, `npm test` (**55 aprovados, 0 falhas**) e `npm run build` passaram nesta sessão. Não foi aberto novo PR, seguindo a preferência anterior de preparar as alterações antes de solicitar revisão. Não houve aprovação, merge, promoção ou homologação presumida.

## Dependências restantes

1. Informar URL da API em execução e configurar `.env.local`/ambiente de build. Não havia servidor respondendo em `localhost:8080` durante a verificação.
2. Disponibilizar conta de teste GESTOR e dados de unidade, turnos e locais. O backend depende de PostgreSQL, Redis, JWT e SMTP para os respectivos fluxos.
3. Permitir a origem da web em `app.cors.allowed-origins`; por padrão, `http://localhost:5173` é permitido.
4. Percorrer os fluxos com backend/banco reais, incluindo recarregamento, segunda sessão e e-mail recebido. A sincronização com mobile não foi comprovada.
5. Dashboard, desempenho e Manu não têm endpoints nesse repositório. A interface informa indisponibilidade e não usa números/respostas simulados como dados reais.
6. GitHub Projects: a credencial consultada ainda retorna `INSUFFICIENT_SCOPES` para `read:project`; vínculo e status no Kanban dependem de permissão/equipe. Issue não é marcada Finalizada sem aprovação, merge e homologação.

Não houve alteração no repositório da API nem no servidor. Build e testes da web não equivalem a uma implantação ou validação integrada real.
