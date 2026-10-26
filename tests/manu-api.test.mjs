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

function setup(handler, remoteHistory = false) {
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
    const { status = 200, data = null } =
      !remoteHistory && call.url.endsWith('/api/v1/sessoes')
        ? { data: { status: 'SEM_DADOS', conversas: [] } }
        : await handler(call)
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
test('histórico remoto e conversas da sessão preservam cópias, emoções e confirmação', async () => {
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
  await assert.rejects(service.history('outra-thread'), /histórico inválido/)
  assert.deepEqual(
    calls.map((call) => call.method),
    ['get', 'post', 'get', 'post'],
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
  assert.deepEqual(service.cachedList(), [])
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

test('recusa persistente da IA preserva sessão Web renovada e o histórico já recebido', async () => {
  let denied = false
  const { service, client, calls } = setup((call) => {
    if (call.url === '/auth/refresh')
      return { data: { token: 'web-valid', refreshToken: 'web-refresh' } }
    return denied
      ? { status: 401, data: { detail: 'Token incompatível com a IA.' } }
      : { data: reply }
  })
  await service.send('Primeira mensagem', null)
  denied = true
  let expirations = 0
  client.onExpired(() => expirations++)
  await assert.rejects(service.send('Segunda mensagem', 'thread-1'), /Token incompatível/)
  assert.equal(expirations, 0)
  assert.equal(client.getTokens()?.token, 'web-valid')
  assert.equal((await service.history('thread-1')).messages.length, 2)
  assert.equal(calls.filter((call) => call.url === '/auth/refresh').length, 1)
  await assert.rejects(service.close('thread-1'), /Token incompatível/)
  assert.ok(client.getTokens())
})

test('recusa de renovação pela API Web ainda encerra sessão e histórico da Manu', async () => {
  let denied = false
  const { service, client } = setup(() => (denied ? { status: 401 } : { data: reply }))
  await service.send('Primeira mensagem', null)
  denied = true
  let expirations = 0
  client.onExpired(() => expirations++)
  await assert.rejects(service.send('Segunda mensagem', 'thread-1'))
  assert.equal(expirations, 1)
  assert.equal(client.getTokens(), null)
  client.setTokens({ token: 'nova-sessao', refreshToken: 'novo-refresh' })
  assert.deepEqual(await service.list(), [])
})

test('resposta de renovação sem tokens válidos invalida a sessão uma única vez', async () => {
  for (const invalid of [
    null,
    {},
    { token: 1, refreshToken: 'refresh' },
    { token: ' ', refreshToken: 'refresh' },
    { token: 'token', refreshToken: '' },
  ]) {
    const { service, client } = setup((call) =>
      call.url === '/auth/refresh' ? { data: invalid } : { status: 401 },
    )
    let expirations = 0
    client.onExpired(() => expirations++)
    await assert.rejects(service.send('Olá', null), /Resposta de autenticação inválida/)
    assert.equal(client.getTokens(), null)
    assert.equal(expirations, 1)
  }
})

const remoteConversation = {
  session_id: 'persisted-1',
  iniciada_em: '2026-10-20T10:00:00Z',
  atualizada_em: '2026-10-20T10:10:00Z',
  titulo: 'Manutenção elétrica',
  resumo: 'Resumo real retornado pela IA.',
  mensagens: [
    { role: 'human', mensagem: 'Verificar a iluminação' },
    { role: 'assistant', mensagem: 'Conversa finalizada.', emocao: 'SUCESSO' },
  ],
}
test('histórico AWS restaura título, resumo e emoções ao criar uma nova instância da web', async () => {
  const { service, calls } = setup(
    () => ({ data: { status: 'SUCESSO', conversas: [remoteConversation] } }),
    true,
  )
  const list = await service.list()
  assert.equal(list[0].title, 'Manutenção elétrica')
  assert.equal(list[0].closed, true)
  assert.equal(calls[0].url, 'https://web.fixa.test/api/ia/api/v1/sessoes')
  assert.equal(calls[0].auth, 'Bearer token-1')
  const history = await service.history('persisted-1')
  assert.equal(history.summary, remoteConversation.resumo)
  assert.equal(history.messages[1].emotion, 'SUCESSO')
  assert.equal(history.messages[1].confirmation, undefined)
  assert.deepEqual(history.messages[0].images, [])
  await assert.rejects(service.send('continuar', 'persisted-1'), /finalizada/)
})
test('conversa fora do cache usa POST por session_id e rejeita resposta com outra identidade', async () => {
  const { service, calls } = setup(
    () => ({
      data: { status: 'SUCESSO', conversa: { ...remoteConversation, titulo: '', resumo: '' } },
    }),
    true,
  )
  const history = await service.history('persisted-1')
  assert.equal(history.closed, false)
  assert.equal(calls[0].method, 'post')
  assert.deepEqual(calls[0].data, { session_id: 'persisted-1' })
  assert.equal(calls[0].url, 'https://web.fixa.test/api/ia/api/v1/sessoes/conversa')
  const invalid = setup(() => ({ data: { status: 'SUCESSO', conversa: remoteConversation } }), true)
  await assert.rejects(invalid.service.history('outra'), /histórico inválido/)
  assert.deepEqual(invalid.service.cachedList(), [])
})
test('falha de leitura do histórico não apaga resposta já enviada nem expira sessão Web válida', async () => {
  const { service, client } = setup(
    (call) => (call.method === 'get' ? { status: 503 } : { data: reply }),
    true,
  )
  await service.send('Mensagem enviada', null)
  await assert.rejects(service.list())
  assert.equal(service.cachedList().length, 1)
  assert.equal((await service.history('thread-1')).messages[0].text, 'Mensagem enviada')
  assert.equal(client.getTokens().token, 'token-1')
})
test('resposta pendente de histórico não contamina outra conta após logout', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const { service, client } = setup(async () => {
    await gate
    return { data: { status: 'SUCESSO', conversas: [remoteConversation] } }
  }, true)
  const pending = service.list()
  client.clear()
  client.setTokens({ token: 'outra', refreshToken: 'outro' })
  release()
  await assert.rejects(pending, /sessão foi encerrada/)
  assert.deepEqual(service.cachedList(), [])
})

test('listagem deixa de exibir conversa encerrada removida no servidor', async () => {
  let items = [remoteConversation]
  const { service } = setup(
    () => ({ data: { status: items.length ? 'SUCESSO' : 'SEM_DADOS', conversas: items } }),
    true,
  )
  assert.equal((await service.list()).length, 1)
  items = []
  assert.deepEqual(await service.list(), [])
  assert.deepEqual(service.cachedList(), [])
})

test('erro 500 no encerramento preserva conversa, mensagens e autenticação, sem repetir DELETE', async () => {
  const { service, client, calls } = setup((call) =>
    call.method === 'delete' ? { status: 500, data: 'Internal Server Error' } : { data: reply },
  )
  await service.send('Olá', null)
  const before = await service.history('thread-1')
  await assert.rejects(service.close('thread-1'), (error) => error.status === 500)
  assert.deepEqual(await service.history('thread-1'), before)
  assert.equal(service.cachedList()[0].closed, false)
  assert.equal(client.getTokens().token, 'token-1')
  assert.equal(calls.filter((call) => call.method === 'delete').length, 1)
  assert.equal(calls.length, 2)
})

test('resumo de uma linha vira título no histórico AWS e continua encerrado após recarregar', async () => {
  const titled = { ...remoteConversation, titulo: 'Saudação inicial', resumo: '' }
  const listing = setup(() => ({ data: { status: 'SUCESSO', conversas: [titled] } }), true)
  assert.equal((await listing.service.list())[0].closed, true)
  const history = await listing.service.history('persisted-1')
  assert.equal(history.title, 'Saudação inicial')
  assert.equal(history.summary, null)
  assert.equal(history.messages.length, 2)
  await assert.rejects(listing.service.send('Continuar', 'persisted-1'), /finalizada/)
  assert.equal(listing.calls.length, 1)
  const specific = setup(() => ({ data: { status: 'SUCESSO', conversa: titled } }), true)
  assert.equal((await specific.service.history('persisted-1')).closed, true)
  const open = setup(
    () => ({ data: { status: 'SUCESSO', conversa: { ...titled, titulo: ' ' } } }),
    true,
  )
  assert.equal((await open.service.history('persisted-1')).closed, false)
})

test('remover conversa usa DELETE do histórico, Bearer e nenhum corpo, preservando as demais', async () => {
  const other = { ...remoteConversation, session_id: 'outra-conversa' }
  const { service, calls } = setup(
    (call) => ({
      data:
        call.method === 'delete'
          ? { session_id: 'persisted-1', status: 'EXCLUIDA', mensagem: 'Removida' }
          : { status: 'SUCESSO', conversas: [remoteConversation, other] },
    }),
    true,
  )
  await service.list()
  await service.remove('persisted-1')
  assert.equal(calls[1].url, 'https://web.fixa.test/api/ia/api/v1/sessoes/conversa/persisted-1')
  assert.equal(calls[1].auth, 'Bearer token-1')
  assert.equal(calls[1].data, undefined)
  assert.deepEqual(
    service.cachedList().map((item) => item.thread_id),
    ['outra-conversa'],
  )
  await assert.rejects(service.history('persisted-1'), /removida do histórico/)
  await assert.rejects(service.send('Continuar', 'persisted-1'), /removida do histórico/)
  assert.equal((await service.list()).length, 1)
  assert.equal(calls.filter((call) => call.method === 'delete').length, 1)
})

test('falhas de exclusão não apagam mensagens ou autenticação e não repetem DELETE', async () => {
  for (const status of [403, 500]) {
    const { service, client, calls } = setup((call) =>
      call.method === 'delete'
        ? { status, data: { detail: 'Falha de exclusão' } }
        : { data: reply },
    )
    await service.send('Olá', null)
    const before = await service.history('thread-1')
    await assert.rejects(service.remove('thread-1'), (error) => error.status === status)
    assert.deepEqual(await service.history('thread-1'), before)
    assert.equal(client.getTokens().token, 'token-1')
    assert.equal(calls.length, 2)
  }
})

test('remoção e encerramento rejeitam confirmação de outra conversa antes de alterar estado', async () => {
  for (const action of ['remove', 'close']) {
    const { service } = setup((call) => ({
      data:
        call.method === 'delete'
          ? {
              session_id: 'outra',
              thread_id: 'outra',
              status: action === 'remove' ? 'EXCLUIDA' : 'ENCERRADA',
            }
          : reply,
    }))
    await service.send('Olá', null)
    const before = await service.history('thread-1')
    await assert.rejects(service[action]('thread-1'), /Não foi possível confirmar/)
    assert.deepEqual(await service.history('thread-1'), before)
  }
})

test('leitura iniciada antes da exclusão não restaura a conversa removida', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const { service } = setup(async (call) => {
    if (call.method === 'delete') return { data: { session_id: 'persisted-1', status: 'EXCLUIDA' } }
    await gate
    return { data: { status: 'SUCESSO', conversas: [remoteConversation] } }
  }, true)
  const pending = service.list()
  await service.remove('persisted-1')
  release()
  assert.deepEqual(await pending, [])
  assert.deepEqual(service.cachedList(), [])
})

test('resposta de exclusão após logout não altera a sessão seguinte', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const { service, client } = setup(async () => {
    await gate
    return { data: { session_id: 'persisted-1', status: 'EXCLUIDA' } }
  })
  const pending = service.remove('persisted-1')
  client.clear()
  client.setTokens({ token: 'outra-conta', refreshToken: 'outra-renovacao' })
  release()
  await assert.rejects(pending, /sessão foi encerrada/)
  assert.equal(client.getTokens().token, 'outra-conta')
})

test('título descritivo antigo não vira cabeçalho; título real curto ou estruturado é preservado', async () => {
  const paragraph =
    'O usuário apenas cumprimentou a Manu e recebeu uma orientação geral sobre como consultar seus registros antes de repetir o envio.'
  const { service } = setup(
    () => ({
      data: {
        status: 'SUCESSO',
        conversas: [{ ...remoteConversation, titulo: paragraph, resumo: '' }],
      },
    }),
    true,
  )
  const list = await service.list()
  assert.equal(list[0].title, 'Verificar a iluminação')
  assert.equal(list[0].closed, true)
  const compact = setup(
    () => ({
      data: {
        status: 'SUCESSO',
        conversas: [{ ...remoteConversation, titulo: 'Manutenção do ar-condicionado' }],
      },
    }),
    true,
  )
  assert.equal((await compact.service.list())[0].title, 'Manutenção do ar-condicionado')
  const structured = setup(
    () => ({
      data: {
        status: 'SUCESSO',
        conversas: [
          {
            ...remoteConversation,
            titulo: '',
            resumo: JSON.stringify({ titulo: 'Ar-condicionado', resumo: paragraph }),
          },
        ],
      },
    }),
    true,
  )
  assert.equal((await structured.service.list())[0].title, 'Ar-condicionado')
})
