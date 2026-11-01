import test, { before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { managementFixture } from './management-fixture.mjs'

const modulePath = process.env.FIXA_PLAYWRIGHT_MODULE
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright')
const baseURL = process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173'
let browser
const fixtures = []
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
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await fixture.context.close()
    assert.deepEqual(fixture.errors, [])
    assert.deepEqual(fixture.unexpected, [])
  }
})
async function setup(options) {
  const fixture = await managementFixture(browser, options)
  fixtures.push(fixture)
  return fixture
}
const goto = (page, path) => page.goto(new URL(path, baseURL).href)
async function ready(page) {
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll('[role="status"]')].some((node) =>
        node.textContent?.trim().startsWith('Carregando'),
      ),
  )
}
async function noOverflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  )
}
async function target(locator, minimum = 44) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  assert.ok(box && box.width >= minimum - 0.5 && box.height >= minimum - 0.5, JSON.stringify(box))
}

for (const width of [320, 390])
  test('equipe: ações por toque e botão compacto em ' + width + 'px', async () => {
    const { page } = await setup({ width, height: width === 320 ? 667 : 844 })
    await goto(page, '/equipe')
    await ready(page)
    const add = page.getByRole('button', { name: 'Adicionar técnico', exact: true })
    await target(add, 48)
    assert.equal((await add.innerText()).trim(), '')
    const title = await page
      .getByRole('heading', { name: 'Minha equipe', exact: true })
      .boundingBox()
    const box = await add.boundingBox()
    assert.ok(Math.abs(title.y + title.height / 2 - (box.y + box.height / 2)) < 8)
    await add.tap()
    await page.locator('#technician-name').waitFor()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).tap()
    await page.getByRole('button', { name: 'Filtrar', exact: true }).tap()
    await page.getByRole('dialog').waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Página 2', exact: true }).tap()
    assert.equal(
      await page
        .getByRole('button', { name: 'Página 2', exact: true })
        .getAttribute('aria-current'),
      'page',
    )
    await page.getByRole('button', { name: 'Anterior', exact: true }).tap()
    await page.getByRole('button', { name: /^Ver detalhes de Técnico 01/ }).tap()
    await page.getByRole('button', { name: 'Ver todas', exact: true }).tap()
    assert.equal(
      await page
        .getByRole('button', { name: 'Ver resumo', exact: true })
        .getAttribute('aria-expanded'),
      'true',
    )
    await page.getByRole('button', { name: 'Editar técnico', exact: true }).tap()
    await page.locator('#technician-name').fill('Nome temporário')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).tap()
    await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).tap()
    await page.getByRole('button', { name: /^Desativar Técnico 01/ }).tap()
    await page.getByRole('dialog').getByRole('button', { name: 'Desativar', exact: true }).tap()
    await page.getByText('Técnico desativado com sucesso.', { exact: true }).waitFor()
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Adicionar técnico',
    )
    await noOverflow(page)
  })

for (const width of [320, 390])
  test('calendário: dias sem sobreposição e ações por toque em ' + width + 'px', async () => {
    const { page } = await setup({ width, height: 844 })
    await goto(page, '/calendario')
    await ready(page)
    const overlaps = await page.locator('button[data-date]').evaluateAll((nodes) => {
      const boxes = nodes.map((node) => node.getBoundingClientRect())
      return boxes.some((a, i) =>
        boxes
          .slice(i + 1)
          .some(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
          ),
      )
    })
    assert.equal(overlaps, false)
    const next = page.getByRole('button', { name: 'Próximo mês', exact: true })
    await target(next)
    await next.tap()
    await page.getByRole('button', { name: 'Mês anterior', exact: true }).tap()
    await page.locator('[data-date="2026-10-26"]').tap()
    await page.getByRole('button', { name: /^Ver evento Revisão/ }).tap()
    await page.getByRole('button', { name: 'Fechar informações do evento', exact: true }).tap()
    const add = page.getByRole('button', { name: 'Adicionar evento', exact: true })
    await target(add, 48)
    assert.equal((await add.innerText()).trim(), '')
    await add.tap()
    await page.locator('#event-title').waitFor()
    await page.locator('#event-title').fill('Rascunho do evento')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).tap()
    await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).tap()
    await noOverflow(page)
  })

for (const [width, height] of [
  [320, 667],
  [390, 500],
  [844, 390],
])
  test(
    'Manu: compositor visível, histórico e envio por toque em ' + width + 'x' + height,
    async () => {
      const { page, writes } = await setup({ width, height })
      await goto(page, '/manu')
      await ready(page)
      const compose = page.locator('#manu-question')
      const composer = await compose.locator('..').boundingBox()
      assert.ok(
        composer.y >= 0 && composer.y + composer.height <= height + 1,
        JSON.stringify(composer),
      )
      await target(page.getByRole('button', { name: 'Novo chat', exact: true }), 48)
      await page.getByRole('button', { name: 'Conversa de teste 2', exact: true }).tap()
      await page.getByRole('button', { name: 'Novo chat', exact: true }).tap()
      await compose.tap()
      await compose.fill('Preciso de uma orientação')
      await target(page.getByRole('button', { name: 'Enviar mensagem', exact: true }))
      await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).tap()
      await page.getByText('Posso ajudar com essa consulta.', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Novo chat', exact: true }).tap()
      await page.getByRole('heading', { name: /^Olá Conta/ }).waitFor()
      assert.ok(
        writes.some(
          (write) =>
            write.method === 'DELETE' && write.path === '/api/v1/chat/sessions/mobile-active',
        ),
      )
      await page
        .getByRole('button', { name: 'Excluir conversa: Conversa de teste 2', exact: true })
        .tap()
      await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).tap()
      await noOverflow(page)
    },
  )

test('RH: abas, menu móvel, perfil e preferências permanecem acessíveis', async () => {
  const { page } = await setup({ role: 'ADMINISTRADOR', width: 390 })
  await goto(page, '/equipe')
  await ready(page)
  assert.equal(
    await page.getByRole('tab', { name: 'Gestores', exact: true }).getAttribute('aria-selected'),
    'true',
  )
  await page.getByRole('tab', { name: 'Técnicos', exact: true }).tap()
  await page.getByRole('button', { name: 'Filtrar', exact: true }).tap()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).tap()
  await page.getByRole('dialog').getByRole('link', { name: 'Perfil', exact: true }).tap()
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).tap()
  await page.locator('#profile-name').fill('Nome temporário')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).tap()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).tap()
  await page.getByRole('link', { name: 'Configurações', exact: true }).tap()
  await page.getByLabel('Escuro', { exact: true }).check()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  await noOverflow(page)
})

test('desktop preserva rótulos completos dos botões de adicionar', async () => {
  const { page } = await setup({ width: 1440, height: 960, mobile: false })
  for (const [route, label] of [
    ['/equipe', 'Adicionar técnico'],
    ['/calendario', 'Adicionar evento'],
  ]) {
    await goto(page, route)
    await ready(page)
    const button = page.getByRole('button', { name: label, exact: true })
    assert.equal((await button.innerText()).trim(), label)
    await button.click()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await noOverflow(page)
  }
})

test('páginas em 360 e 430px, tema escuro e rótulos em inglês não transbordam', async () => {
  const { page } = await setup({ width: 360 })
  for (const width of [360, 430]) {
    await page.setViewportSize({ width, height: 844 })
    for (const path of [
      '/',
      '/equipe',
      '/calendario',
      '/perfil',
      '/configuracoes',
      '/manu',
      '/dashboard',
    ]) {
      await goto(page, path)
      await ready(page)
      await noOverflow(page)
    }
  }
  await page.evaluate(() =>
    localStorage.setItem(
      'fixa.preferences',
      JSON.stringify({ language: 'en', languageSource: 'manual', theme: 'dark' }),
    ),
  )
  for (const route of ['/equipe', '/calendario', '/configuracoes']) {
    await goto(page, route)
    await ready(page)
    await noOverflow(page)
  }
})

test('paginação longa permite chegar à última página por toque', async () => {
  const { page } = await setup({ width: 320, count: 40 })
  await goto(page, '/equipe')
  await ready(page)
  await page.getByRole('button', { name: 'Página 10', exact: true }).tap()
  assert.equal(
    await page.getByRole('button', { name: 'Página 10', exact: true }).getAttribute('aria-current'),
    'page',
  )
  assert.equal(await page.getByRole('button', { name: 'Próxima', exact: true }).isDisabled(), true)
  await noOverflow(page)
})

test('Home: meses, faixa de dias e evento podem ser acionados por toque', async () => {
  const { page } = await setup({ width: 320 })
  await goto(page, '/')
  await ready(page)
  const next = page.getByRole('button', { name: 'Próximo mês', exact: true })
  await target(next)
  await next.tap()
  await page.getByRole('button', { name: 'Mês anterior', exact: true }).tap()
  await page.locator('[data-date="2026-10-26"]').tap()
  assert.equal(await page.locator('[data-date="2026-10-26"]').getAttribute('aria-pressed'), 'true')
  const event = page.getByRole('link', { name: /^Ver evento Revisão/ })
  await target(event)
  await event.tap()
  await page.getByRole('heading', { name: 'Calendário', exact: true }).waitFor()
  assert.equal(await page.locator('[data-date="2026-10-26"]').getAttribute('aria-pressed'), 'true')
  await noOverflow(page)
})

test('login em 320px permite preencher os campos e alternar a senha por toque', async () => {
  const { page } = await setup({ role: 'ANONYMOUS', width: 320, height: 667 })
  await goto(page, '/login')
  await page.locator('#login-password').fill('Senha de teste')
  const reveal = page.getByRole('button', { name: 'Mostrar senha', exact: true })
  await target(reveal)
  await reveal.tap()
  assert.equal(await page.locator('#login-password').getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).tap()
  assert.equal(await page.locator('#login-password').getAttribute('type'), 'password')
  await page.getByRole('link', { name: 'Esqueci minha senha', exact: true }).tap()
  assert.equal(new URL(page.url()).pathname, '/recuperar-senha')
  await noOverflow(page)
})
