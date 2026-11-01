import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { managementFixture } from './management-fixture.mjs'

const modulePath = process.env.FIXA_PLAYWRIGHT_MODULE
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright')
const base = process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173'
let browser
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

async function run(options, action) {
  const fixture = await managementFixture(browser, {
    width: 1440,
    height: 960,
    mobile: false,
    ...options,
  })
  try {
    await action(fixture)
    assert.deepEqual(fixture.errors, [])
    assert.deepEqual(fixture.unexpected, [])
  } finally {
    await fixture.context.close()
  }
}

test('rota individual abre diretamente, restaura após reload e devolve foco à lista', async () => {
  await run({}, async ({ page }) => {
    await page.goto(base + '/equipe/201')
    await page.getByRole('heading', { name: /^Técnico 01/ }).waitFor()
    await page.reload()
    await page.getByRole('button', { name: 'Editar técnico', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Voltar para equipe', exact: true }).click()
    await page.waitForURL('**/equipe')
    await page.waitForFunction(() => document.activeElement?.id === 'tech-details-201')
  })
})

test('parâmetro ausente mostra lista; inválido ou fora da equipe mostra retorno seguro', async () => {
  await run({}, async ({ page }) => {
    await page.goto(base + '/equipe')
    await page.getByRole('heading', { name: 'Minha equipe', exact: true }).waitFor()
    for (const id of ['undefined', '-1', '0', '999999']) {
      await page.goto(base + '/equipe/' + id)
      await page.getByRole('heading', { name: 'Pessoa não encontrada', exact: true }).waitFor()
      assert.equal(
        await page.getByRole('link', { name: 'Voltar à equipe', exact: true }).count(),
        1,
      )
    }
  })
})

test('edição da rota individual conserva alterações ao cancelar saída e descarta só após confirmar', async () => {
  await run({}, async ({ page }) => {
    await page.goto(base + '/equipe/201')
    await page.getByRole('button', { name: 'Editar técnico', exact: true }).click()
    const name = page.getByLabel(/Nome completo/)
    await name.fill('Nome ainda não salvo')
    await page.getByRole('link', { name: 'Início', exact: true }).click()
    const modal = page.getByRole('dialog', { name: 'Descartar alterações?', exact: true })
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await modal.waitFor({ state: 'hidden' })
    assert.equal(await name.inputValue(), 'Nome ainda não salvo')
    assert.equal(new URL(page.url()).pathname, '/equipe/201')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await modal.getByRole('button', { name: 'Descartar', exact: true }).click()
    await page.getByRole('heading', { name: 'Minha equipe', exact: true }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/equipe')
  })
})

test('recuperação associa os erros aos campos e bloqueia envio até a validação', async () => {
  await run({ role: 'ANONYMOUS' }, async ({ context, page }) => {
    const requests = []
    await context.route('**/auth/recuperar-senha*', async (route) => {
      requests.push(route.request().postDataJSON())
      await route.fulfill({ status: 204 })
    })
    await page.goto(base + '/recuperar-senha')
    await page.getByRole('button', { name: 'Enviar e-mail', exact: true }).click()
    assert.equal(await page.locator('#recovery-email').getAttribute('aria-invalid'), 'true')
    assert.equal(requests.length, 0)
    await page.locator('#recovery-email').fill('teste@fixa.test')
    await page.getByRole('button', { name: 'Enviar e-mail', exact: true }).click()
    await page.locator('#recovery-code-1').waitFor()
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    await page.locator('#recovery-code-error').waitFor()
    await page.locator('#recovery-code-1').fill('123456')
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    await page.locator('#new-password').waitFor()
    await page.locator('#new-password').fill('curta')
    await page.locator('#confirm-password').fill('outra')
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    assert.equal(await page.locator('#new-password').getAttribute('aria-invalid'), 'true')
    assert.equal(await page.locator('#confirm-password').getAttribute('aria-invalid'), 'true')
    assert.equal(requests.length, 1)
  })
})

test('preferências antigas são regravadas com versão e armazenamento bloqueado não impede abrir a Web', async () => {
  await run({}, async ({ context, page }) => {
    await context.addInitScript(() =>
      localStorage.setItem(
        'fixa.preferences',
        JSON.stringify({ language: 'pt-BR', languageSource: 'manual', theme: 'dark' }),
      ),
    )
    await page.goto(base + '/configuracoes')
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem('fixa.preferences'))._versao === 1,
    )
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  })
  await run({}, async ({ context, page }) => {
    await context.addInitScript(() => {
      Object.defineProperty(Storage.prototype, 'getItem', {
        value: function (key) {
          if (key === 'fixa.preferences') throw new Error('blocked')
          return null
        },
      })
      Object.defineProperty(Storage.prototype, 'setItem', {
        value: function () {
          throw new Error('blocked')
        },
      })
    })
    await page.goto(base + '/login')
    await page.getByRole('heading', { name: 'Login', exact: true }).waitFor()
  })
})
