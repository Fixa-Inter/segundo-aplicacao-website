# API Web local com a dev atual — 25/10/2026

Continuação das Issues [#10](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/10) e [#11](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/11), na branch de trabalho `feature/integracao-ia-manu`.

## Configuração ativa

- API Web: `http://localhost:8080`, compilada no Docker com Java 21 a partir de `9516609b5c09436cf6b095659a946dad3519c518`, commit atual de `origin/dev` consultado nesta sessão.
- Web: `http://localhost:5173`, com `VITE_API_BASE_URL=http://localhost:8080` no `.env.local` ignorado.
- IA: serviço existente da AWS pelo proxy `/api/ia`; sua configuração foi preservada.
- Banco: compartilhado da equipe, acessado somente pela API. As credenciais fornecidas foram usadas apenas no arquivo de servidor ignorado `dev.local/api-shared.env`. Nenhum segredo foi incluído em variáveis VITE, documentação ou Git.
- Redis e SMTP continuam locais. A recuperação de senha recebe mensagens no Mailpit, sem envio a contas externas.

O código da API não foi modificado. O clone está no commit indicado, em detached HEAD. A configuração anterior da web foi preservada no arquivo ignorado `dev.local/frontend-aws.env`.

## Comando de execução

```bash
npm run local:shared
npm run dev
```

O primeiro comando exige `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET` no arquivo privado, compila/inicia a API e aguarda a saúde. Não executa seed. A execução exige Docker Desktop com motor Linux, Git e Node.js 24.

`local:up` permanece como alternativa com banco e conta exclusivos da máquina. As credenciais de `dev.local/acesso.txt` pertencem apenas a esse modo isolado.

## Divergência encontrada no backend

A primeira inicialização com validação de esquema falhou:

```text
unidade.cep: encontrado VARCHAR; esperado CHAR(8)
```

A entidade da dev contém `@JdbcTypeCode(SqlTypes.CHAR)`, mas o banco compartilhado tem VARCHAR nessa coluna. Somente a sobreposição local usa `SPRING_JPA_HIBERNATE_DDL_AUTO=none`, desativando gestão automática do esquema. Não houve DDL, migração ou alteração da entidade. A equipe da API precisa alinhar modelo e banco antes da publicação; o teste local não comprova qual versão está implantada na AWS.

## Validação real

- Saúde da API local: HTTP 200.
- Login fornecido pelo usuário: HTTP 200, papel GESTOR, com tokens válidos para a API local. Credenciais e tokens omitidos do relatório.
- Perfil autenticado: HTTP 200. As sessões de verificação foram revogadas com HTTP 204.
- Edge isolado, sem respostas simuladas: login e Home, Equipe, Calendário e Perfil. Recarregamentos restauraram a sessão. Eventos, usuários, turnos, vínculos de turno, aptidões e perfil retornaram HTTP 200.
- Nenhuma chamada da web à API Web da AWS durante esse cenário; nenhum erro JavaScript ou alerta nas telas verificadas.
- Viewport 390×844 sem transbordamento horizontal; desktop 1440×960.
- O verificador bloqueava gravações de cadastros e mensagens à IA. Nenhuma dessas gravações foi tentada. Não houve teste de CRUD no banco compartilhado.
- Saúde da IA pelo proxy da web: HTTP 200. Não houve inferência, criação ou exclusão real de conversa nesta sessão. A compatibilidade do token local com o serviço consultado pela IA na AWS segue pendente.
- Evidências com dados reais permanecem somente em `dev.local/local-api-browser-check.json` e `dev.local/login-local-home.png`, ignorados pelo Git.
- Formatação, lint, 71 testes e build passaram. Os testes automatizados usam cenários controlados; a validação real acima comprova somente os fluxos explicitamente relacionados.

## Retorno futuro à AWS

Quando a equipe confirmar a implantação e o login na API publicada:

1. Troque somente `VITE_API_BASE_URL` em `.env.local` para `https://web-api.fixa.solutions`.
2. Reinicie o Vite. Para uma publicação da web, configure a variável na hospedagem e gere um novo build.
3. Valide login, restauração/renovação da sessão e CORS da origem usada pela web. A IA permanece no endereço já publicado.

O HTTP 500 observado anteriormente continua sendo evidência do serviço remoto naquele momento, não do login local agora aprovado. PR, revisão, CI remoto, promoções de branches e publicação permanecem etapas futuras conforme a orientação do usuário.
