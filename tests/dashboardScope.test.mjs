import test from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { createHttpClient } from '../src/services/httpClient.ts'
import { createDashboardScopeService } from '../src/services/dashboardScopeService.ts'

function setup(role, handler) {
  const calls = []
  const user = {
    id: '10',
    role,
    name: 'Conta de QA',
    cnpj: '12345678000195',
    identifier: 'qa@fixa.test',
  }
  const client = createHttpClient('https://api.fixa.test', async (config) => {
    calls.push({
      url: config.url,
      params: config.params,
      auth: config.headers.get('Authorization'),
    })
    const { status = 200, data } = await handler(config)
    const response = { status, data, config, headers: {}, statusText: '' }
    if (status >= 400)
      throw new AxiosError('HTTP error', 'ERR_BAD_RESPONSE', config, null, response)
    return response
  })
  client.setTokens({ token: 'token-qa', refreshToken: 'refresh-qa' })
  return { calls, user, client, service: createDashboardScopeService(client, () => user) }
}

test('BI do RH resolve somente a unidade do próprio perfil, sem usar instituição ou a primeira unidade da lista', async () => {
  const { calls, service } = setup('ADMINISTRADOR', (config) => ({
    data: config.url === '/api/v1/perfil' ? { id: 10 } : { id: 10, unidadeId: 7 },
  }))
  assert.equal(await service.getUnitId(), 7)
  assert.deepEqual(
    calls.map((c) => c.url),
    ['/api/v1/perfil', '/api/v1/usuarios/10'],
  )
  assert.ok(calls.every((c) => c.auth === 'Bearer token-qa'))
  assert.ok(calls.every((c) => c.params === undefined))
})

test('BI do gestor usa a listagem autenticada de turnos da própria unidade, sem pedir unidade ao cliente', async () => {
  const { calls, service } = setup('GESTOR', (config) => ({
    data: config.url === '/api/v1/perfil' ? { id: 10 } : [{ unidadeId: 7 }, { unidadeId: 7 }],
  }))
  assert.equal(await service.getUnitId(), 7)
  assert.deepEqual(
    calls.map((c) => c.url),
    ['/api/v1/perfil', '/api/v1/turnos'],
  )
  assert.ok(calls.every((c) => c.params === undefined))
})

test('identidade divergente é recusada antes de consultar outro usuário ou turnos', async () => {
  for (const role of ['GESTOR', 'ADMINISTRADOR']) {
    const { calls, service } = setup(role, () => ({ data: { id: 99 } }))
    await assert.rejects(service.getUnitId(), /identificar a unidade/)
    assert.equal(calls.length, 1)
  }
})

test('turnos vazios, mistos ou com unidade inválida não produzem escopo geral', async () => {
  for (const shifts of [
    [],
    null,
    [{ unidadeId: 7 }, { unidadeId: 8 }],
    [{ unidadeId: 0 }],
    [{ unidadeId: '7' }],
    [null],
  ]) {
    const { service } = setup('GESTOR', (config) => ({
      data: config.url === '/api/v1/perfil' ? { id: 10 } : shifts,
    }))
    await assert.rejects(service.getUnitId(), /identificar a unidade/)
  }
})

test('unidade inválida ou identidade divergente do usuário RH nunca vira seleção do dashboard', async () => {
  for (const identity of [
    null,
    { id: 11, unidadeId: 7 },
    { id: 10, unidadeId: 0 },
    { id: 10, unidadeId: '7' },
  ]) {
    const { service } = setup('ADMINISTRADOR', (config) => ({
      data: config.url === '/api/v1/perfil' ? { id: 10 } : identity,
    }))
    await assert.rejects(service.getUnitId(), /identificar a unidade/)
  }
})

test('erro de permissão ou rede permanece erro, sem trocar a fonte nem inventar uma unidade', async () => {
  for (const status of [403, 503]) {
    const { calls, service } = setup('GESTOR', (config) =>
      config.url === '/api/v1/perfil' ? { data: { id: 10 } } : { status },
    )
    await assert.rejects(service.getUnitId(), (error) => error.status === status)
    assert.equal(calls.length, 2)
  }
})

test('cancelamento e troca de sessão impedem aplicar a unidade de outra conta', async () => {
  const canceled = setup('GESTOR', () => ({ data: { id: 10 } }))
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(canceled.service.getUnitId(controller.signal), { name: 'AbortError' })
  assert.equal(canceled.calls.length, 0)
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const active = setup('GESTOR', async () => {
    await gate
    return { data: { id: 10 } }
  })
  const pending = active.service.getUnitId()
  active.client.clear()
  active.user.id = '20'
  active.client.setTokens({ token: 'new-account', refreshToken: 'new-refresh' })
  release()
  await assert.rejects(pending, /sessão foi encerrada/)
  assert.equal(active.calls.length, 1)
})
