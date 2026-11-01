import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeDashboardAccess, createDashboardService } from '../src/services/dashboardService.ts'
import { createHttpClient } from '../src/services/httpClient.ts'
const access = {
  instanceUrl: 'https://qa.cloud.databricks.com/',
  workspaceId: '123',
  dashboardId: 'a'.repeat(32),
  token: 'scoped-test-only',
  expiresIn: 3600,
}
test('dashboard usa Bearer e rota sem unidade ou filtro fornecido pelo navegador', async () => {
  let call
  const client = createHttpClient('https://web.fixa.test', async (config) => {
    call = config
    return { data: access, status: 200, headers: {}, config, statusText: 'OK' }
  })
  client.setTokens({ token: 'web-test-only', refreshToken: 'refresh-test-only' })
  const data = await createDashboardService(client).access()
  assert.equal(data.instanceUrl, 'https://qa.cloud.databricks.com')
  assert.equal(call.url, '/api/v1/dashboard/embed')
  assert.equal(call.headers.get('Authorization'), 'Bearer web-test-only')
  assert.equal(call.params, undefined)
  assert.equal(call.data, undefined)
})
test('não envia o token a origens externas, HTTP, subcaminhos ou URLs com credenciais/parâmetros', () => {
  for (const instanceUrl of [
    'http://qa.cloud.databricks.com',
    'https://qa.cloud.databricks.com.evil.test',
    'https://evil.test',
    'https://user:password@qa.cloud.databricks.com',
    'https://qa.cloud.databricks.com/token',
    'https://qa.cloud.databricks.com/?token=x',
  ])
    assert.throws(() => decodeDashboardAccess({ ...access, instanceUrl }), /autorizar/)
})
test('rejeita payload de BI incompleto, expirado ou identificadores inválidos sem fallback ao geral', () => {
  for (const change of [
    { token: '' },
    { token: 'a b' },
    { expiresIn: 0 },
    { expiresIn: -1 },
    { workspaceId: 123 },
    { dashboardId: '../outro' },
  ])
    assert.throws(() => decodeDashboardAccess({ ...access, ...change }), /autorizar/)
  assert.throws(() => decodeDashboardAccess(null), /autorizar/)
})
