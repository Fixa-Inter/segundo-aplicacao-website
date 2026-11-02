import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { managementFixture } from './management-fixture.mjs'

const { chromium } = await import(
  process.env.FIXA_PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.FIXA_PLAYWRIGHT_MODULE).href
    : 'playwright'
)
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
async function photo(page, name) {
  if (!process.env.FIXA_QA_EVIDENCE_DIR) return
  await mkdir(process.env.FIXA_QA_EVIDENCE_DIR, { recursive: true })
  await page.screenshot({ path: join(process.env.FIXA_QA_EVIDENCE_DIR, name), fullPage: true })
}
for (const width of [1440, 390]) {
  test(`histórico recolhe sem perder rascunho ou conversa em ${width}px`, async () => {
    const f = await managementFixture(browser, { width, height: 960, mobile: width < 600 })
    try {
      const { page } = f
      await page.goto(base + '/manu')
      const input = page.locator('#manu-question')
      await input.fill('Rascunho preservado')
      const chat = page.getByRole('region', { name: 'Manu', exact: true })
      const before = await chat.boundingBox()
      const toggle = page.getByRole('button', { name: 'Recolher histórico', exact: true })
      await toggle.click()
      assert.equal(await input.inputValue(), 'Rascunho preservado')
      assert.equal(
        await page.getByRole('searchbox', { name: 'Pesquisar conversas', exact: true }).count(),
        0,
      )
      const expand = page.getByRole('button', { name: 'Expandir histórico', exact: true })
      assert.equal(await expand.getAttribute('aria-expanded'), 'false')
      const after = await chat.boundingBox()
      assert.ok(width > 900 ? after.width > before.width + 100 : after.height > before.height + 50)
      await photo(page, `historico-recolhido-${width}.png`)
      await expand.focus()
      await page.keyboard.press('Enter')
      await page.getByRole('searchbox', { name: 'Pesquisar conversas', exact: true }).waitFor()
      assert.equal(await input.inputValue(), 'Rascunho preservado')
      await page.getByRole('button', { name: 'Conversa de teste 2', exact: true }).click()
      await page.getByText('Podemos consultar os dados da solicitação.', { exact: true }).waitFor()
      const text = await page.getByRole('log').innerText()
      await toggle.click()
      assert.equal(await page.getByRole('log').innerText(), text)
      await page.getByRole('button', { name: 'Expandir histórico', exact: true }).click()
      assert.equal(await page.getByRole('log').innerText(), text)
      await photo(page, `historico-aberto-${width}.png`)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}
for (const width of [1440, 320]) {
  test(`detalhes do evento preservam informações, margens e foco em ${width}px`, async () => {
    const f = await managementFixture(browser, { width, height: 960, mobile: width < 600 })
    try {
      await f.context.addInitScript(() =>
        localStorage.setItem(
          'fixa.preferences',
          JSON.stringify({
            _versao: 1,
            language: 'pt-BR',
            languageSource: 'manual',
            theme: 'dark',
          }),
        ),
      )
      const { page } = f
      await page.goto(base + '/calendario')
      const open = page.getByRole('button', { name: /^Ver evento Revisão/ })
      await open.click()
      const dialog = page.getByRole('dialog')
      await dialog.getByText('Evento sintético de responsividade', { exact: true }).waitFor()
      assert.equal(
        await dialog
          .getByRole('heading', {
            name: 'Revisão do ar-condicionado da sala de informática',
            exact: true,
          })
          .count(),
        1,
      )
      assert.equal(await dialog.getByText('Sala de teste', { exact: true }).count(), 1)
      assert.equal(await dialog.getByText('Observação', { exact: true }).count(), 0)
      assert.ok(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
      await page.waitForTimeout(250)
      await photo(page, `evento-escuro-${width}.png`)
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden' })
      await page.waitForFunction(() =>
        document.activeElement?.getAttribute('aria-label')?.startsWith('Ver evento Revisão'),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}

test('espanhol mostra o rótulo completo e a marca escura nítida sem quebrar o menu compacto', async () => {
  const f = await managementFixture(browser, { width: 1024, height: 900, mobile: false })
  try {
    await f.context.addInitScript(() =>
      localStorage.setItem(
        'fixa.preferences',
        JSON.stringify({ _versao: 1, language: 'es', languageSource: 'manual', theme: 'dark' }),
      ),
    )
    const { page } = f
    await page.goto(base + '/configuracoes')
    const dashboard = page.getByRole('link', { name: 'Panel de indicadores', exact: true })
    await dashboard.waitFor()
    assert.ok(
      await dashboard.locator('span').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    )
    const logo = page.locator('aside img[alt="FIXA"]')
    await logo.waitFor()
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
    assert.ok(
      await logo.evaluate(
        (el) =>
          /\.svg(?:[?#]|$)/.test(el.currentSrc) || el.currentSrc.startsWith('data:image/svg+xml'),
      ),
    )
    await logo.evaluate((el) => el.decode())
    assert.ok(await logo.evaluate((el) => el.complete && el.naturalWidth > 0))
    await photo(page, 'menu-espanhol-escuro.png')
    await page.getByRole('button', { name: 'Contraer menú lateral', exact: true }).click()
    await page.waitForTimeout(250)
    assert.ok((await dashboard.boundingBox()).height < 100)
    await page.getByRole('button', { name: 'Expandir menú lateral', exact: true }).click()
    await page.waitForTimeout(250)
    assert.ok((await dashboard.boundingBox()).height < 100)
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight))
    await photo(page, 'menu-espanhol-aberto.png')
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
