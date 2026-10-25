# Ambiente local FIXA

Executa a API Java do repositório `Fixa-Inter/segundo-api-web` e dependências locais, sem credenciais de serviços externos. Requer Docker Desktop com o motor Linux em execução, Git e Node.js 24.

Na raiz da web:

```bash
npm run local:up
npm run dev -- --port 5173 --strictPort
```

A primeira execução baixa as imagens, o código da API no commit `1927e92cb36c335744b599e11d024593326d0265` e as dependências Maven. O build usa o Dockerfile do próprio backend com Java 21; não depende do Java definido no PATH do Windows.

| Serviço               | Endereço                                    |
| --------------------- | ------------------------------------------- |
| Web                   | http://localhost:5173                       |
| API                   | http://localhost:8080                       |
| Swagger               | http://localhost:8080/swagger-ui/index.html |
| Caixa de e-mail local | http://localhost:8025                       |

## Acesso de teste

O bootstrap cria instituição, unidade, gestor ativo, turno Diurno e local Auditório. CNPJ: `12.345.678/0001-95`; e-mail: `gestor@fixa.test`. A senha inicial é aleatória e fica em **`dev.local/acesso.txt`**, junto com os endereços. O arquivo `dev.local/stack.env` guarda as credenciais técnicas geradas para esta máquina. Ambos são ignorados pelo Git.

O bootstrap é idempotente: não altera a senha ou os dados de um cadastro existente. Se trocar a senha pela web, use a nova senha nos próximos acessos; o texto de acesso continua mostrando a senha inicial.

## Operação

```bash
npm run local:prepare
npm run local:status
npm run local:logs
npm run local:down
```

`local:prepare` prepara configuração e baixa o código sem exigir motor Docker ativo. `local:up` cria/inicia os contêineres, aguarda o health check da API e aplica o bootstrap. `local:down` para os contêineres e preserva os volumes de dados. Não há comando automático de apagar volumes.

O projeto Compose é `fixa-web-local`. PostgreSQL e Redis ficam na rede interna, sem porta pública no host. API e Mailpit são publicados somente em `127.0.0.1`. As configurações do banco, JWT, SMTP e Redis HTTP estão em `application-local.properties`; os valores privados vêm do arquivo local ignorado. Esse arquivo de propriedades é montado externamente e não modifica o repositório da API.

A API usa Redis via HTTP. O [Serverless Redis HTTP](https://github.com/hiett/serverless-redis-http) fornece essa interface sobre o Redis local; os registros têm persistência real no Redis. O Nginx interno de `redis-http.conf` adapta as requisições para HTTP/1.1: no teste local, a tentativa de HTTP/2 do cliente Java encerrava a conexão com a ponte. Esse proxy não publica porta no host nem altera o código da API. O [Mailpit](https://mailpit.axllent.org/docs/install/docker/) recebe o SMTP local e permite ler o código de recuperação no navegador, sem enviar mensagens para contas externas.

`.env.local` é criado com `VITE_API_BASE_URL=http://localhost:8080` se ainda não existir. Uma configuração existente não é sobrescrita; confira o valor se a web já apontava para outro servidor. Reinicie o Vite depois de alterar esse arquivo. CORS permite `localhost:5173` e `127.0.0.1:5173` neste ambiente.

## Diagnóstico

- Se `local:up` informar que o motor Docker não respondeu, confira o Docker Desktop. O processo aberto não basta: o motor precisa estar disponível para `docker info`.
- Consulte `local:logs` para erros da API. Um contêiner iniciado não significa que o servidor esteja saudável.
- Confira se 8080, 8025 e 5173 estão disponíveis antes de iniciar. O script não encerra processos alheios para liberar portas.
- Este ambiente local não conecta Dashboard/BI ou Manu, pois seus endpoints não constam no contrato da API.
