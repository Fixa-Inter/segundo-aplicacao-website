# Integração da Manu — 25/10/2026

Web [#11](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/11), branch `feature/integracao-ia-manu`, criada de `origin/dev` atualizado e avançada por fast-forward para incorporar a dependência da API na Issue #10, preservando seu histórico. Serviço de IA: [Issue #46](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/issues/46), branch `feature/integracao-web-manu`, criada de `origin/dev` do próprio repositório.

## O que está conectado

- Mensagens reais por `POST /api/v1/chat`, até 4000 caracteres; continuidade pelo `thread_id` devolvido pelo servidor.
- Histórico recente e mensagens consultados no MongoDB pelo serviço autenticado. A web não grava transcrições em localStorage/sessionStorage.
- Novo chat, busca entre as 50 conversas recentes, retomada, encerramento e consulta de conversa encerrada.
- Propostas com `confirmacao: "sim"` mostram os botões Confirmar e Cancelar ação. Nenhuma confirmação é enviada automaticamente.
- Até três links HTTP/HTTPS de imagens, conforme o contrato `imagens: list[str]`. Não há upload de arquivos binários neste contrato.
- Mensagens de carregamento e falha, bloqueio de envio duplicado, cancelamento de requisições ao sair e proteção contra respostas de uma sessão de autenticação anterior.
- Respostas renderizadas como texto React, sem executar HTML retornado pelo modelo.

O transporte compartilha a sessão da API de gestão: Bearer é enviado ao serviço configurado; um 401 renova em `/auth/refresh` da API Java e repete com o novo token. Um 403 não é tratado como expiração. Timeout e falhas 5xx não repetem automaticamente uma mensagem que possa ter provocado uma operação; a interface orienta conferir o histórico.

As respostas antigas de demonstração foram movidas para `src/mocks/services/manuService.ts` e continuam somente nos testes históricos. Não existe fallback dessas respostas no chat real.

## Compatibilidade do serviço

A API Java devolve `tipoAcesso` como objeto e não devolve CNPJ no perfil. O serviço de IA foi adaptado para normalizar o enum e resolver o CNPJ no banco a partir do usuário autenticado. Não foi concedida confiança à identidade informada pelo frontend e não foi preciso modificar a API Java.

O serviço também recebeu CORS configurável e os endpoints GET de histórico, no [commit 1ba4ccd](https://github.com/Fixa-Inter/segundo-inteligencia-artificial/commit/1ba4ccdbe7a3cc8280e7b48600c961c36394ceed). Portanto, a web precisa do commit de compatibilidade indicado no bootstrap `scripts/local-ia.mjs`; a versão anterior da main não oferece esse contrato completo. A branch da IA continua pendente de revisão e merge, conforme o fluxo da organização.

Os perfis aceitos pela IA continuam sendo gestor, técnico e solicitante. A web autentica gestores/administradores para gestão; administrador recebe a negação de permissão do serviço de IA, sem conversão automática em gestor.

## Executar localmente

```bash
npm run ia:prepare
npm run ia:up
npm run dev
```

URLs: web `http://localhost:5173`, IA `http://localhost:8000`, documentação da IA `http://localhost:8000/docs`, API Java `http://localhost:8080`.

`ia:up` prepara a API de gestão e inicia o perfil Compose `ia` com MongoDB, Qdrant e o serviço Python. `ia:down` para somente esses três serviços e preserva os volumes. `local:down` encerra o projeto Compose, também preservando os volumes. `ia:logs` e `ia:status` ajudam no diagnóstico.

Coloque `OPENAI_API_KEY`, `TYPESAFE_API_KEY` e `GEMINI_API_KEY` em **`dev.local/ia.env`**, ignorado pelo Git. Reinicie com `npm run ia:up` após alterar o arquivo. A variável pública `.env.local`/build recebe apenas `VITE_AI_BASE_URL=http://localhost:8000`, sem `/api/v1` no final. Um valor existente não é sobrescrito.

O bootstrap gera o token do Qdrant em `dev.local/stack.env` e preserva credenciais já existentes. Banco relacional, MongoDB e Qdrant não publicam portas no host. O ambiente local usa o banco FIXA isolado; configuração de produção, bancos por perfil e origens HTTPS continuam responsabilidade da implantação.

Collections Qdrant vazias não substituem a ingestão de FAQ e cadastros. Nenhum PDF de FAQ foi fornecido no clone consultado. O modelo e os agentes originais foram preservados; não foi feita validação de respostas dos provedores.

## Evidências e resultados

- Web: formatação, lint, 66 testes e build.
- IA: 219 testes aprovados e 1 `xfail` preexistente, em contêiner sem rede; não comprova inferência real.
- Real: login HTTP 200, perfil obtido na API Java, resolução da unidade no PostgreSQL, histórico persistido no MongoDB e recuperado após recarregar. Sem Bearer: 401. Histórico de outro usuário: 404. Dados sintéticos de QA removidos ao final.
- Real: envio sem credenciais dos provedores retorna 503 antes de criar conversa; a web informa indisponibilidade e conserva o texto.
- Controlado no navegador: resposta, anexos por link, continuidade, bloqueio de duplo envio, confirmação explícita, recarregamento e encerramento. Texto semelhante a script não é executado. Sem erro JavaScript; 390×844 sem transbordamento horizontal.

Imagens:

- [Histórico no banco real, com conteúdo sintético de QA](evidencias/integracao-ia-2026-10-25/manu-historico-local.png)
- [Indisponibilidade real sem chaves](evidencias/integracao-ia-2026-10-25/manu-sem-chaves-local.png)
- [Interação com respostas controladas — desktop](evidencias/integracao-ia-2026-10-25/manu-chat-controlado-desktop.png)
- [Interação com respostas controladas — celular](evidencias/integracao-ia-2026-10-25/manu-chat-controlado-mobile.png)

## Dependências para concluir a validação funcional

1. Fornecer/configurar as três chaves no arquivo local. Até esse momento, não foram fornecidas e não houve inferência com modelos reais.
2. Carregar fontes reais de FAQ e sincronizar os índices/cadastros necessários às ferramentas da IA; conferir os fluxos com os dados da equipe.
3. Homologar as ferramentas que alteram registros, a comunicação com o mobile e a implantação remota. Testes controlados não equivalem a essas verificações.
4. Revisão/merge dos repositórios e vínculo ao GitHub Projects, cujo acesso segue pendente. Não houve novo PR, aprovação ou promoção presumida.
