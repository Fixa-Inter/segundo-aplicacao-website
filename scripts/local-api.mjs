import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const local = path.join(root, 'dev.local')
const source = path.join(local, 'api')
const envFile = path.join(local, 'stack.env')
const composeFile = path.join(root, 'dev', 'compose.yml')
const docker = process.env.FIXA_DOCKER_BINARY || 'docker'
const apiRepo = 'https://github.com/Fixa-Inter/segundo-api-web.git'
const apiRef = '1927e92cb36c335744b599e11d024593326d0265'
function run(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    ...options,
  })
  if (result.error)
    throw new Error(
      `${path.basename(program)}: ${result.error.code === 'ETIMEDOUT' ? 'tempo de resposta excedido' : result.error.message}`,
    )
  if (result.status !== 0)
    throw new Error(`${path.basename(program)} terminou com código ${result.status}.`)
  return result
}
const compose = (args, options) =>
  run(
    docker,
    [
      'compose',
      '--project-name',
      'fixa-web-local',
      '--env-file',
      envFile,
      '-f',
      composeFile,
      ...args,
    ],
    options,
  )
function environment() {
  const values = {}
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator > 0) values[line.slice(0, separator)] = line.slice(separator + 1)
  }
  return values
}
function prepare() {
  fs.mkdirSync(local, { recursive: true })
  if (!fs.existsSync(envFile)) {
    const values = {
      FIXA_DB_PASSWORD: randomBytes(24).toString('base64url'),
      FIXA_JWT_SECRET: randomBytes(32).toString('base64'),
      FIXA_REDIS_TOKEN: randomBytes(24).toString('base64url'),
      FIXA_LOCAL_PASSWORD: randomBytes(12).toString('base64url'),
    }
    fs.writeFileSync(
      envFile,
      Object.entries(values)
        .map(([name, value]) => `${name}=${value}`)
        .join('\n') + '\n',
      { mode: 0o600 },
    )
  }
  const env = environment()
  if (
    !env.FIXA_DB_PASSWORD ||
    !env.FIXA_JWT_SECRET ||
    !env.FIXA_REDIS_TOKEN ||
    !env.FIXA_LOCAL_PASSWORD
  )
    throw new Error(
      'Configuração local incompleta em dev.local/stack.env; preserve a senha do banco já criado.',
    )
  const frontend = path.join(root, '.env.local')
  if (!fs.existsSync(frontend))
    fs.writeFileSync(frontend, 'VITE_API_BASE_URL=http://localhost:8080\n')
  fs.writeFileSync(
    path.join(local, 'acesso.txt'),
    `AMBIENTE LOCAL FIXA\nWeb: http://localhost:5173\nAPI: http://localhost:8080\nE-mails locais: http://localhost:8025\nCNPJ: 12.345.678/0001-95\nE-mail: gestor@fixa.test\nSenha inicial: ${env.FIXA_LOCAL_PASSWORD}\n\nA senha não é redefinida ao reiniciar. Se alterada na web, use a senha atual.\n`,
  )
  if (!fs.existsSync(source)) {
    run('git', ['clone', '--depth', '1', apiRepo, source])
    const current = run('git', ['-C', source, 'rev-parse', 'HEAD'], {
      stdio: 'pipe',
      encoding: 'utf8',
    }).stdout.trim()
    if (current !== apiRef) {
      run('git', ['-C', source, 'fetch', '--depth', '1', 'origin', apiRef])
      run('git', ['-C', source, 'checkout', '--detach', apiRef])
    }
  }
  console.log('Configuração preparada em dev.local; credenciais em dev.local/acesso.txt.')
}
function dockerReady() {
  try {
    run(docker, ['info', '--format', '{{.ServerVersion}}'], { timeout: 15000, stdio: 'pipe' })
  } catch {
    throw new Error(
      'O motor do Docker não respondeu. Abra o Docker Desktop e confirme que aparece Engine running antes de executar npm run local:up.',
    )
  }
}
async function waitForApi() {
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://localhost:8080/actuator/health', {
        signal: AbortSignal.timeout(3000),
      })
      if (response.ok) return
    } catch {
      /* A API ainda está iniciando. */
    }
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  compose(['logs', '--tail', '65', 'api'])
  throw new Error('A API não ficou saudável a tempo. Consulte npm run local:logs.')
}
async function seed() {
  await waitForApi()
  const password = environment().FIXA_LOCAL_PASSWORD.replaceAll("'", "''")
  const sql = fs
    .readFileSync(path.join(root, 'dev', 'seed.sql'), 'utf8')
    .replaceAll('__FIXA_PASSWORD__', password)
  compose(['exec', '-T', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'fixa', '-d', 'fixa'], {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  console.log('Conta local, turno e local preparados. Credenciais: dev.local/acesso.txt.')
}
try {
  const command = process.argv[2] || 'up'
  if (!['up', 'prepare', 'down', 'status', 'logs', 'seed'].includes(command))
    throw new Error('Comando local desconhecido.')
  if (command === 'up' || command === 'prepare') prepare()
  if (command !== 'prepare') {
    if (!fs.existsSync(envFile)) throw new Error('Execute npm run local:prepare primeiro.')
    dockerReady()
    if (command === 'up') {
      compose(['up', '-d', '--build'])
      await seed()
      console.log('API: http://localhost:8080 | E-mails: http://localhost:8025 | Web: npm run dev')
    } else if (command === 'seed') await seed()
    else if (command === 'status') compose(['ps'])
    else if (command === 'logs') compose(['logs', '--tail', '100', 'api'])
    else compose(['down'])
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
