import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const local = path.join(root, 'dev.local')
const source = path.join(local, 'ia')
const stack = path.join(local, 'stack.env')
const providers = path.join(local, 'ia.env')
const docker = process.env.FIXA_DOCKER_BINARY || 'docker'
const iaRef = '1ba4ccdbe7a3cc8280e7b48600c961c36394ceed'
const keyNames = ['OPENAI_API_KEY', 'TYPESAFE_API_KEY', 'GEMINI_API_KEY']

function run(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    ...options,
  })
  if (result.error || result.status !== 0)
    throw new Error(
      `${path.basename(program)}: ${result.error?.message || `código ${result.status}`}`,
    )
  return result
}
const compose = (args) =>
  run(docker, [
    'compose',
    '--project-name',
    'fixa-web-local',
    '--env-file',
    stack,
    '-f',
    path.join(root, 'dev/compose.yml'),
    '--profile',
    'ia',
    ...args,
  ])

function prepare() {
  run(process.execPath, [path.join(root, 'scripts/local-api.mjs'), 'prepare'])
  if (!fs.readFileSync(stack, 'utf8').includes('FIXA_QDRANT_TOKEN='))
    fs.appendFileSync(stack, `FIXA_QDRANT_TOKEN=${randomBytes(24).toString('base64url')}\n`)
  if (!fs.existsSync(providers))
    fs.writeFileSync(
      providers,
      '# Chaves de provedores somente neste arquivo local; nunca em VITE_* ou no Git.\n' +
        keyNames.map((name) => `${name}=`).join('\n') +
        '\n',
      { mode: 0o600 },
    )
  const frontend = path.join(root, '.env.local')
  if (!/^\s*VITE_AI_BASE_URL\s*=/m.test(fs.readFileSync(frontend, 'utf8')))
    fs.appendFileSync(frontend, '\nVITE_AI_BASE_URL=http://localhost:8000\n')
  if (!fs.existsSync(source)) {
    run('git', [
      'clone',
      'https://github.com/Fixa-Inter/segundo-inteligencia-artificial.git',
      source,
    ])
    run('git', ['-C', source, 'checkout', '--detach', iaRef])
  }
  const current = run('git', ['-C', source, 'rev-parse', 'HEAD'], {
    stdio: 'pipe',
    encoding: 'utf8',
  }).stdout.trim()
  if (current !== iaRef) {
    const changes = run('git', ['-C', source, 'status', '--porcelain'], {
      stdio: 'pipe',
      encoding: 'utf8',
    }).stdout.trim()
    if (changes)
      throw new Error(
        'O checkout da IA tem alterações locais e foi preservado. Revise-as antes de atualizar para o commit de compatibilidade indicado neste script.',
      )
    run('git', ['-C', source, 'fetch', 'origin', iaRef])
    run('git', ['-C', source, 'checkout', '--detach', iaRef])
  }
  console.log(
    'IA preparada em dev.local/ia. Chaves em dev.local/ia.env; configuração existente preservada.',
  )
}

function warnMissingKeys() {
  const values = Object.fromEntries(
    fs
      .readFileSync(providers, 'utf8')
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(/^\s*(?:export\s+)?([A-Z_0-9]+)\s*=\s*(.*)$/)
        if (!match) return []
        const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
        return [[match[1], value.startsWith('#') ? '' : value]]
      }),
  )
  const missing = keyNames.filter((name) => !values[name])
  if (missing.length)
    console.log(
      `Configure em dev.local/ia.env: ${missing.join(', ')}. Histórico e saúde podem funcionar; o chat retorna indisponível enquanto faltarem chaves.`,
    )
}

async function waitForIA() {
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/health', {
        signal: AbortSignal.timeout(3000),
      })
      if (response.ok) return
    } catch {
      /* O serviço e seus índices ainda podem estar iniciando. */
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  compose(['logs', '--tail', '60', 'ia'])
  throw new Error('A IA não iniciou a tempo. Consulte npm run ia:logs.')
}

try {
  const command = process.argv[2] || 'up'
  if (!['prepare', 'up', 'down', 'logs', 'status'].includes(command))
    throw new Error('Comando da IA desconhecido.')
  if (['prepare', 'up'].includes(command)) prepare()
  if (command === 'up') {
    run(process.execPath, [path.join(root, 'scripts/local-api.mjs'), 'up'])
    compose(['up', '-d', '--build', 'ia'])
    await waitForIA()
    console.log('Serviço da IA: http://localhost:8000 | Documentação: http://localhost:8000/docs')
    warnMissingKeys()
  } else if (command === 'down') compose(['stop', 'ia', 'mongo', 'qdrant'])
  else if (command === 'logs') compose(['logs', '--tail', '100', 'ia'])
  else if (command === 'status') compose(['ps'])
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
