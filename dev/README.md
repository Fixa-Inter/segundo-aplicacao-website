# Ambiente local FIXA

Executa a API Java do repositório `Fixa-Inter/segundo-api-web` e dependências locais, sem credenciais de serviços externos. Requer Docker Desktop com o motor Linux em execução, Git e Node.js 24.

Na raiz da web:

```bash
npm run local:up
npm run dev -- --port 5173 --strictPort
```

A primeira execução baixa as imagens, o código da API no commit `9516609b5c09436cf6b095659a946dad3519c518` e as dependências Maven. O build usa o Dockerfile do próprio backend com Java 21; não depende do Java definido no PATH do Windows.

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

`local:prepare` prepara configuração e confere a versão fixada da API sem exigir motor Docker ativo. Em um clone existente, busca o commit se ele ainda não estiver disponível e só muda para ele em detached HEAD quando não há alterações locais. Se o clone estiver em outra versão e contiver arquivos modificados ou não rastreados, interrompe com uma mensagem para preservar esse trabalho; não executa reset nem força a troca. Se já estiver no commit esperado, mantém os arquivos locais como estão. `local:up` cria/inicia os contêineres, aguarda o health check da API e aplica o bootstrap. `local:down` para os contêineres e preserva os volumes de dados. Não há comando automático de apagar volumes.

O projeto Compose é `fixa-web-local`. PostgreSQL e Redis ficam na rede interna, sem porta pública no host. API e Mailpit são publicados somente em `127.0.0.1`. As configurações do banco, JWT, SMTP e Redis HTTP estão em `application-local.properties`; os valores privados vêm do arquivo local ignorado. Esse arquivo de propriedades é montado externamente e não modifica o repositório da API.

A API usa Redis via HTTP. O [Serverless Redis HTTP](https://github.com/hiett/serverless-redis-http) fornece essa interface sobre o Redis local; os registros têm persistência real no Redis. O Nginx interno de `redis-http.conf` adapta as requisições para HTTP/1.1: no teste local, a tentativa de HTTP/2 do cliente Java encerrava a conexão com a ponte. Esse proxy não publica porta no host nem altera o código da API. O [Mailpit](https://mailpit.axllent.org/docs/install/docker/) recebe o SMTP local e permite ler o código de recuperação no navegador, sem enviar mensagens para contas externas.

`.env.local` é criado com `VITE_API_BASE_URL=http://localhost:8080` se ainda não existir. Uma configuração existente não é sobrescrita; confira o valor se a web já apontava para outro servidor. Reinicie o Vite depois de alterar esse arquivo. CORS permite `localhost:5173` e `127.0.0.1:5173` neste ambiente.

## API local com banco compartilhado

Para testar uma conta já cadastrada no banco compartilhado, prepare o arquivo ignorado `dev.local/api-shared.env` com os valores autorizados de `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET`. Esse arquivo é obrigatório; o comando interrompe se ele estiver ausente ou incompleto. Nunca coloque credenciais no código, no Git ou em capturas de tela.

```bash
npm run local:shared
npm run dev -- --port 5173 --strictPort
```

`local:shared` executa a mesma versão fixada da API localmente, usando `stack.env` e `api-shared.env` com a sobreposição `dev/compose.shared.yml`. Aguarda a saúde da API, mas não executa o bootstrap de dados. A gestão automática de esquema do Hibernate fica desativada (`none`), sem validar, criar ou atualizar tabelas. As credenciais de teste geradas em `dev.local/acesso.txt` pertencem ao banco isolado e não criam uma conta no banco compartilhado.

O modo `none` permite testar a execução local apesar da divergência conhecida em `unidade.cep`: o modelo da API espera `CHAR(8)`, enquanto o banco compartilhado usa `VARCHAR`, e a validação interrompe a inicialização. O responsável pelo backend precisa alinhar o modelo e o banco antes da produção. Essa configuração local não corrige a divergência nem comprova qual versão está publicada na AWS.

Nesse modo, as alterações feitas pela aplicação são gravadas no banco compartilhado. Redis e caixa de e-mail continuam locais; mensagens de recuperação ficam no Mailpit. A web deve apontar para `http://localhost:8080`; a Manu continua usando o serviço de IA da AWS. A autenticação entre essa IA e a API deve ser validada com os serviços reais, pois o endereço e a chave JWT usados pela IA podem ser diferentes.

Para voltar ao banco isolado, execute `npm run local:up`. Para voltar à API publicada, altere `VITE_API_BASE_URL` em `.env.local` para a URL autorizada da AWS e reinicie o Vite.

## Diagnóstico

- Se `local:up` informar que o motor Docker não respondeu, confira o Docker Desktop. O processo aberto não basta: o motor precisa estar disponível para `docker info`.
- Consulte `local:logs` para erros da API. Um contêiner iniciado não significa que o servidor esteja saudável.
- Confira se 8080, 8025 e 5173 estão disponíveis antes de iniciar. O script não encerra processos alheios para liberar portas.
- A Manu consome o serviço existente na AWS pelo proxy da própria web; não é necessário clonar, modificar ou iniciar a IA localmente. Consulte [as integrações atuais](../docs/INTEGRACOES.md). O BI usa o SDK Databricks com token por unidade emitido pela API Web.
