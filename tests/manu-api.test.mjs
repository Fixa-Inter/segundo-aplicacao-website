import test from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { createHttpClient } from '../src/services/httpClient.ts'
import { createManuService, validateImageLinks } from '../src/services/manuService.ts'

function setup(handler) {
  const calls = []
  const client = createHttpClient('https://api.fixa.test', async (config) => {
    const call = {
      url: config.url,
      baseURL: config.baseURL,
      method: config.method,
      data: config.data ? JSON.parse(config.data) : undefined,
      auth: config.headers.get('Authorization'),
      timeout: config.timeout,
    }
    calls.push(call)
    const { status = 200, data = null } = await handler(call)
    const response = { data, status, statusText: '', config, headers: {} }
    if (status >= 400)
      throw new AxiosError('HTTP error', 'ERR_BAD_RESPONSE', config, null, response)
    return response
  })
  client.setTokens({ token: 'token-1', refreshToken: 'refresh-1' })
  return { client, calls, service: createManuService(client, 'https://ia.fixa.test') }
}
const reply = {
  thread_id: 'thread-1',
  resposta: 'Resposta real do contrato.',
  emocao: 'NEUTRO',
  intencao: 'faq',
  confirmacao: 'nao',
}

test('Manu envia Bearer ao serviço configurado, mensagem, thread e imagens sem identidade fornecida pelo cliente', async () => {
  const { service, calls } = setup(() => ({ data: reply }))
  assert.deepEqual(await service.send(' Olá ', null), reply)
  assert.deepEqual(calls[0].data, { mensagem: 'Olá', thread_id: null, imagens: [] })
  assert.equal(calls[0].url, 'https://ia.fixa.test/api/v1/chat')
  assert.equal(calls[0].auth, 'Bearer token-1')
  assert.equal(calls[0].timeout, 120000)
  await service.send('Continuar', 'thread-1', ['https://example.com/foto.png'])
  assert.deepEqual(calls[1].data, {
    mensagem: 'Continuar',
    thread_id: 'thread-1',
    imagens: ['https://example.com/foto.png'],
  })
})

test('histórico e encerramento usam os endpoints autenticados e codificam o ID', async () => {
  const { service, calls } = setup((call) => ({
    data: call.method === 'delete' ? { status: 'ENCERRADA' } : [],
  }))
  await service.list()
  await service.history('thread/1')
  await service.close('thread/1')
  assert.deepEqual(
    calls.map((call) => [call.method, call.url]),
    [
      ['get', 'https://ia.fixa.test/api/v1/chat/sessions'],
      ['get', 'https://ia.fixa.test/api/v1/chat/sessions/thread%2F1'],
      ['delete', 'https://ia.fixa.test/api/v1/chat/sessions/thread%2F1'],
    ],
  )
  assert.ok(calls.every((call) => call.auth === 'Bearer token-1'))
})

test('401 da IA renova na API de gestão e repete com token novo; 403 não renova', async () => {
  let first = true
  const { service, calls } = setup((call) => {
    if (call.url === '/auth/refresh')
      return { data: { token: 'token-2', refreshToken: 'refresh-2' } }
    if (first) {
      first = false
      return { status: 401 }
    }
    return { data: reply }
  })
  await service.send('Olá', null)
  assert.equal(calls[1].url, '/auth/refresh')
  assert.equal(calls[1].baseURL, 'https://api.fixa.test')
  assert.equal(calls[2].auth, 'Bearer token-2')
  const denied = setup(() => ({
    status: 403,
    data: { detail: 'Perfil sem permissão de acesso ao chat.' },
  }))
  await assert.rejects(denied.service.send('Olá', null), /Perfil sem permissão/)
  assert.equal(denied.calls.length, 1)
})

test('configuração inválida ou mensagem/imagem inválida falha antes de enviar credenciais', async () => {
  const { client, service, calls } = setup(() => ({ data: reply }))
  for (const base of [
    undefined,
    'javascript:alert(1)',
    'https://user:password@example.com',
    'https://example.com?token=secret',
  ]) {
    const invalid = createManuService(client, base)
    assert.equal(invalid.configured, false)
    await assert.rejects(invalid.send('Olá', null), /Configure VITE_AI_BASE_URL/)
  }
  for (const text of ['', ' ', 'a'.repeat(4001)])
    await assert.rejects(service.send(text, null), /1 a 4000/)
  for (const images of [
    ['data:image/png;base64,abc'],
    ['javascript:alert(1)'],
    ['https://user:pw@example.com/foto'],
    Array(4).fill('https://example.com/foto'),
  ])
    await assert.rejects(service.send('Olá', null, images))
  assert.deepEqual(calls, [])
  assert.deepEqual(validateImageLinks([' https://example.com/foto ']), ['https://example.com/foto'])
})

test('falha 503 do serviço não cria resposta guiada nem repete mensagem com possível efeito', async () => {
  const { service, calls } = setup(() => ({
    status: 503,
    data: { detail: 'Serviço não configurado.' },
  }))
  await assert.rejects(service.send('Cadastrar solicitação', null), /Serviço não configurado/)
  assert.equal(calls.length, 1)
  const invalid = setup(() => ({ data: { ...reply, confirmacao: 'talvez' } }))
  await assert.rejects(invalid.service.send('Olá', null), /resposta inválida/)
})

test('logout impede uma resposta pendente da IA de ser aceita na sessão seguinte', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const { client, service } = setup(async () => {
    await gate
    return { data: reply }
  })
  const pending = service.send('Olá', null)
  client.clear()
  client.setTokens({ token: 'outra-sessao', refreshToken: 'outro-refresh' })
  release()
  await assert.rejects(pending, /sessão foi encerrada/)
})
