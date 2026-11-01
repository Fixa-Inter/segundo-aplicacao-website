import test, { before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const modulePath = process.env.FIXA_PLAYWRIGHT_MODULE
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright')
let browser, context, page
const browserErrors = []
before(async () => {
  browser = await chromium.launch({
    channel:
      process.env.FIXA_TEST_BROWSER_CHANNEL ||
      (process.platform === 'win32' ? 'msedge' : undefined),
    headless: true,
  })
})
after(async () => {
  await browser?.close()
})
beforeEach(async () => {
  context = await browser.newContext()
  page = await context.newPage()
  const origin = new URL(process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173').origin
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  )
  browserErrors.length = 0
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto(
    (process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173') +
      '/tests/browser/resource-options.html',
  )
  await page.waitForFunction(() => Boolean(window.__resourceOptionsHarness))
})
afterEach(async () => {
  await context?.close()
})
const read = () => page.evaluate(() => window.__resourceOptionsHarness.read())
const render = (enabled = true, key = 'first', fallback = 'Erro alternativo', strict = false) =>
  page.evaluate(
    (args) => window.__resourceOptionsHarness.render(...args),
    [enabled, key, fallback, strict],
  )
const resolve = (id, items) =>
  page.evaluate((args) => window.__resourceOptionsHarness.resolve(...args), [id, items])
const loaded = (items) =>
  page.waitForFunction(
    (items) =>
      JSON.stringify(window.__resourceOptionsHarness.read().state?.items) ===
        JSON.stringify(items) && !window.__resourceOptionsHarness.read().state?.loading,
    items,
  )

test('desativar e reativar a mesma fonte limpa dados antigos até a nova resposta', async () => {
  await render(false)
  assert.equal((await read()).requests.length, 0)
  await render()
  let value = await read()
  await resolve(value.requests.at(-1).id, ['antigo'])
  await loaded(['antigo'])
  await render(false)
  value = await read()
  assert.deepEqual(value.state, { items: [], loading: false, error: '' })
  assert.equal(value.requests.at(-1).aborted, true)
  await render()
  value = await read()
  assert.deepEqual(value.state, { items: [], loading: true, error: '' })
  await resolve(value.requests.at(-1).id, ['novo'])
  await loaded(['novo'])
  assert.deepEqual(browserErrors, [])
})

test('trocar fonte cancela a anterior e ignora sua resposta atrasada', async () => {
  await render()
  const old = (await read()).requests.at(-1).id
  await render(true, 'second')
  let value = await read()
  assert.equal(value.requests.find((request) => request.id === old).aborted, true)
  await resolve(old, ['obsoleto'])
  assert.deepEqual((await read()).state, { items: [], loading: true, error: '' })
  await resolve(value.requests.at(-1).id, ['atual'])
  await loaded(['atual'])
})

test('falha e nova tentativa exibem erro, carregamento e sucesso sem reaproveitar erro antigo', async () => {
  await render()
  let value = await read()
  await page.evaluate(
    (id) => window.__resourceOptionsHarness.reject(id, null),
    value.requests.at(-1).id,
  )
  await page.waitForFunction(
    () => window.__resourceOptionsHarness.read().state?.error === 'Erro alternativo',
  )
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  value = await read()
  assert.deepEqual(value.state, { items: [], loading: true, error: '' })
  await resolve(value.requests.at(-1).id, ['recuperado'])
  await loaded(['recuperado'])
})

test('desmontagem aborta e uma resposta posterior não gera nova atualização', async () => {
  await render()
  const previous = await read()
  await page.evaluate(() => window.__resourceOptionsHarness.unmount())
  const unmounted = await read()
  assert.equal(unmounted.requests.at(-1).aborted, true)
  await resolve(previous.requests.at(-1).id, ['tarde'])
  const value = await read()
  assert.equal(value.commits, unmounted.commits)
  assert.deepEqual(value.errors, [])
  assert.deepEqual(browserErrors, [])
})

test('exceção síncrona do carregador vira estado de erro sem desmontar a interface', async () => {
  await render(true, 'throws')
  await page.waitForFunction(
    () => window.__resourceOptionsHarness.read().state?.error === 'Falha síncrona do carregador',
    null,
    { timeout: 2000 },
  )
  const value = await read()
  assert.equal(value.state.loading, false)
  assert.deepEqual(value.errors, [])
  assert.deepEqual(browserErrors, [])
})

test('StrictMode aborta a primeira leitura e aceita somente a leitura ativa', async () => {
  await render(true, 'first', 'Erro alternativo', true)
  const value = await read()
  assert.equal(value.requests.length, 2)
  assert.equal(value.requests[0].aborted, true)
  await resolve(value.requests[0].id, ['obsoleto'])
  assert.deepEqual((await read()).state, { items: [], loading: true, error: '' })
  await resolve(value.requests[1].id, ['atual'])
  await loaded(['atual'])
})

test('trocar técnico limpa suas notas enquanto as competências do próximo carregam', async () => {
  let release
  let requested
  const ready = new Promise((resolve) => {
    requested = resolve
  })
  await context.route('**/api/v1/aptidoes*', async (route) => {
    const url = new URL(route.request().url())
    assert.equal(url.pathname, '/api/v1/aptidoes')
    if (url.searchParams.get('usuarioId') === '201')
      return route.fulfill({
        json: [{ id: 70, usuarioId: 201, categoriaProblema: 'ELETRICA', nota: 8, estaAtivo: true }],
      })
    return new Promise((resolve) => {
      release = async () => {
        await route.fulfill({
          json: [
            { id: 71, usuarioId: 202, categoriaProblema: 'ELETRICA', nota: 3, estaAtivo: true },
          ],
        })
        resolve()
      }
      requested()
    })
  })
  await page.evaluate(() => window.__resourceOptionsHarness.renderCompetencies('201'))
  await page.waitForFunction(
    () => window.__resourceOptionsHarness.read().state?.items[0]?.rating === 8,
  )
  await page.evaluate(() => window.__resourceOptionsHarness.renderCompetencies('202'))
  await ready
  assert.deepEqual((await read()).state, { items: [], loading: true, error: '' })
  await release()
  await page.waitForFunction(
    () => window.__resourceOptionsHarness.read().state?.items[0]?.rating === 3,
  )
})

test('trocar técnico existente por cadastro novo devolve dez competências sem notas', async () => {
  await context.route('**/api/v1/aptidoes*', async (route) => {
    const url = new URL(route.request().url())
    assert.equal(url.pathname, '/api/v1/aptidoes')
    return route.fulfill({
      json: [{ id: 70, usuarioId: 201, categoriaProblema: 'ELETRICA', nota: 8, estaAtivo: true }],
    })
  })
  await page.evaluate(() => window.__resourceOptionsHarness.renderCompetencies('201'))
  await page.waitForFunction(
    () => window.__resourceOptionsHarness.read().state?.items[0]?.rating === 8,
  )
  await page.evaluate(() => window.__resourceOptionsHarness.renderCompetencies())
  const value = await read()
  assert.equal(value.state.loading, false)
  assert.equal(value.state.error, '')
  assert.equal(value.state.items.length, 10)
  assert.equal(
    value.state.items.every((item) => item.rating === null),
    true,
  )
})
