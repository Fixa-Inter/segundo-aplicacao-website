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
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
  })
})
after(async () => {
  await browser?.close()
})
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [390, 844],
  [320, 667],
]) {
  test(`paginação usa três registros por padrão e permite escolher quantidade em ${width}x${height}`, async () => {
    const f = await managementFixture(browser, { width, height, mobile: width < 600, count: 40 })
    const { page } = f
    try {
      await f.context.route('**/api/v1/locais?*', (route) =>
        route.fulfill({
          json: Array.from({ length: 40 }, (_, i) => ({
            id: 100 + i,
            unidadeId: 5,
            nome: 'Laboratório de Ciências e Tecnologia ' + (i + 1),
            descricao: 'Descrição disponível nos detalhes',
            tipoLocalEndereco: 'LABORATORIO',
            estaAtivo: true,
          })),
        }),
      )
      for (const route of ['/equipe', '/instituicao']) {
        await page.goto(base + route)
        const sizes = page.getByRole('combobox', { name: 'Registros por página', exact: true })
        await sizes.waitFor()
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(300)
        const metrics = await page.evaluate(() => {
          const m = document.querySelector('main')
          return {
            extra: m.scrollHeight - m.clientHeight,
            rows: document.querySelectorAll('tbody tr').length,
            width: document.documentElement.scrollWidth,
            viewport: innerWidth,
          }
        })
        assert.equal(metrics.rows, 3)
        assert.equal(await sizes.inputValue(), '3')
        if (width >= 1000)
          assert.ok(metrics.extra <= 2, JSON.stringify({ width, height, route, ...metrics }))
        assert.ok(metrics.width <= metrics.viewport)
        if (process.env.FIXA_QA_EVIDENCE_DIR) {
          await mkdir(process.env.FIXA_QA_EVIDENCE_DIR, { recursive: true })
          await page.screenshot({
            path: join(process.env.FIXA_QA_EVIDENCE_DIR, `${route.slice(1)}-${width}.png`),
          })
        }
        await sizes.selectOption('10')
        await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 10)
        await page.getByRole('button', { name: 'Próxima', exact: true }).click()
        await page.waitForFunction(() =>
          document.querySelector('tbody tr')?.textContent.includes('11'),
        )
        await sizes.selectOption('5')
        await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 5)
        const last =
          width < 600 ? page.getByRole('combobox', { name: 'Página', exact: true }) : null
        if (last) await last.selectOption('8')
        else await page.getByRole('button', { name: 'Página 8', exact: true }).click()
        await page.waitForFunction(() =>
          document.querySelector('tbody tr')?.textContent.includes('36'),
        )
        assert.equal(
          await page.getByRole('button', { name: 'Próxima', exact: true }).isDisabled(),
          true,
        )
        await page.getByRole('searchbox').fill('não existe')
        await page.getByText(/Nenhum .* encontrado para os filtros escolhidos/).waitFor()
        await page.getByRole('searchbox').fill('')
        await sizes.waitFor()
        await sizes.selectOption('3')
        await page.waitForTimeout(300)
        assert.equal(await page.locator('tbody tr').count(), 3)
        assert.equal(await page.getByText(/Automático|Exibindo/).count(), 0)
      }
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}
