import test from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { createHttpClient } from '../src/services/httpClient.ts'
import { createManuService, validateImageLinks } from '../src/services/manuService.ts'
import {
  manuEmotions,
  normalizeManuEmotion,
  resolveManuBaseURL,
  getSummaryTitle,
} from '../src/utils/manu.ts'
import { dashboardEmbedURL } from '../src/utils/dashboardEmbed.ts'

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
  return { client, calls, service: createManuService(client, 'https://web.fixa.test/api/ia') }
}
const reply = {
  thread_id: 'thread-1',
  resposta: 'Resposta do contrato controlada pelo teste.',
  emocao: 'NEUTRO',
  intencao: 'faq',
  confirmacao: 'nao',
}
test('Manu usa POST publicado via proxy, Bearer, thread e URLs sem identidade enviada pelo cliente', async () => {
  const { service, calls } = setup(() => ({ data: reply }))
  assert.deepEqual(await service.send(' Olá ', null), reply)
  assert.deepEqual(calls[0].data, { mensagem: 'Olá', thread_id: null, imagens: [] })
  assert.equal(calls[0].url, 'https://web.fixa.test/api/ia/api/v1/chat')
  assert.equal(calls[0].auth, 'Bearer token-1')
  assert.equal(calls[0].timeout, 120000)
  await service.send('Continuar', 'thread-1', [
    'https://res.cloudinary.com/fixa/image/upload/foto.png',
  ])
  assert.equal(calls[1].data.thread_id, 'thread-1')
  assert.equal(calls[1].data.imagens[0], 'https://res.cloudinary.com/fixa/image/upload/foto.png')
})
test('conversas da sessão preservam cópias, emoções e confirmação sem chamar GETs inexistentes', async () => {
  const { service, calls } = setup(() => ({
    data: { ...reply, emocao: 'CONFIRMACAO', confirmacao: 'sim' },
  }))
  assert.deepEqual(await service.list(), [])
  await service.send('Uma proposta', null)
  const history = await service.history('thread-1')
  assert.equal(history.messages.length, 2)
  assert.equal(history.messages[1].emotion, 'CONFIRMACAO')
  assert.equal(history.messages[1].confirmation, true)
  history.messages[0].text = 'mudança externa'
  assert.equal((await service.history('thread-1')).messages[0].text, 'Uma proposta')
  assert.equal((await service.list())[0].title, 'Uma proposta')
  await assert.rejects(service.history('outra-thread'), /não está disponível/)
  assert.deepEqual(
    calls.map((call) => call.method),
    ['post'],
  )
})
test('finalização usa DELETE publicado e preserva título explícito do resumo, sem apagar histórico da sessão', async () => {
  const { service, calls } = setup((call) => ({
    data:
      call.method === 'delete'
        ? {
            thread_id: 'thread-1',
            status: 'ENCERRADA',
            mensagem: 'Encerrada',
            resumo: '{"titulo":"Manutenção da sala","resumo":"Conversa finalizada."}',
          }
        : reply,
  }))
  await service.send('Olá', null)
  await service.close('thread-1')
  assert.equal(calls[1].url, 'https://web.fixa.test/api/ia/api/v1/chat/sessions/thread-1')
  const history = await service.history('thread-1')
  assert.equal(history.title, 'Manutenção da sala')
  assert.equal(history.closed, true)
  assert.equal(history.messages.length, 2)
  await assert.rejects(service.send('Continuar', 'thread-1'), /finalizada/)
  assert.equal(calls.length, 2)
})
test('401 renova na API Web e preserva conversas; 403 não renova', async () => {
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
  assert.equal((await service.list()).length, 1)
  const denied = setup(() => ({
    status: 403,
    data: { detail: 'Perfil sem permissão de acesso ao chat.' },
  }))
  await assert.rejects(denied.service.send('Olá', null), /Perfil sem permissão/)
  assert.equal(denied.calls.length, 1)
})
test('configuração ou mensagem/imagem inválida falha antes de enviar credenciais', async () => {
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
test('falhas de resposta não inventam mensagens nem repetem operações', async () => {
  const { service, calls } = setup(() => ({
    status: 503,
    data: { detail: 'Serviço não configurado.' },
  }))
  await assert.rejects(service.send('Uma proposta', null), /Serviço não configurado/)
  assert.equal(calls.length, 1)
  assert.deepEqual(await service.list(), [])
  const invalid = setup(() => ({ data: { ...reply, confirmacao: 'talvez' } }))
  await assert.rejects(invalid.service.send('Olá', null), /resposta inválida/)
})
test('logout limpa conversas e impede resposta pendente de contaminar outra sessão', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  let delay = false
  const { client, service } = setup(async () => {
    if (delay) await gate
    return { data: reply }
  })
  await service.send('Primeira', null)
  delay = true
  const pending = service.send('Segunda', 'thread-1')
  client.clear()
  client.setTokens({ token: 'outra-sessao', refreshToken: 'outro-refresh' })
  release()
  await assert.rejects(pending, /sessão foi encerrada/)
  assert.deepEqual(await service.list(), [])
})
test('12 emoções, resumo e proxy seguem dados do contrato sem inventar título ou aceitar redirecionamento de credenciais', () => {
  assert.equal(manuEmotions.length, 12)
  for (const value of manuEmotions) assert.equal(normalizeManuEmotion(value), value)
  assert.equal(normalizeManuEmotion('celebração'), 'CELEBRACAO')
  assert.equal(normalizeManuEmotion('inexistente'), 'NEUTRO')
  assert.equal(
    resolveManuBaseURL(undefined, 'https://web.fixa.test'),
    'https://web.fixa.test/api/ia',
  )
  assert.equal(resolveManuBaseURL('//evil.test', 'https://web.fixa.test'), undefined)
  assert.equal(getSummaryTitle('Um resumo sem título explícito.'), null)
  assert.equal(getSummaryTitle('# Título real\nTexto.'), 'Título real')
  assert.equal(dashboardEmbedURL('javascript:alert(1)'), null)
  assert.equal(dashboardEmbedURL('https://example.com/embed?access_token=secret'), null)
  assert.equal(
    dashboardEmbedURL('https://dbc-test.cloud.databricks.com/embed/dashboardsv3/123'),
    'https://dbc-test.cloud.databricks.com/embed/dashboardsv3/123',
  )
})
