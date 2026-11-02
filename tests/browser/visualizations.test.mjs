import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { managementFixture } from './management-fixture.mjs'
import { visualization } from '../fixtures/visualizations.mjs'

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
for (const [kind, width] of [
  ['categorias', 1440],
  ['serie_temporal', 320],
  ['histograma', 390],
  ['boxplot', 1440],
]) {
  test(`Manu: ${kind} em ${width}px, tabela e restauração após reload`, async () => {
    const f = await managementFixture(browser, { width, height: 960, mobile: width < 600 })
    try {
      const v = visualization(kind)
      const history = {
        session_id: 'chart-browser',
        iniciada_em: '2026-10-31T12:00:00Z',
        atualizada_em: '2026-10-31T12:05:00Z',
        titulo: 'Análise visual',
        resumo: 'Conversa salva',
        mensagens: [
          { role: 'human', mensagem: 'Mostre o gráfico.' },
          { role: 'assistant', mensagem: 'Dados da sua unidade.', visualizacao: v },
        ],
      }
      await f.context.route('**/api/ia/**', (route) =>
        route.fulfill({ json: { status: 'SUCESSO', conversas: [history], conversa: history } }),
      )
      await f.page.goto(base + '/manu')
      await f.page.getByRole('button', { name: 'Análise visual', exact: true }).click()
      await f.page.locator(`[data-chart-kind="${kind}"] .recharts-surface`).waitFor()
      await f.page.getByText('Ver dados do gráfico', { exact: true }).click()
      await f.page.getByRole('table').waitFor()
      assert.ok(
        (await f.page.getByRole('table').innerText()).includes(
          kind === 'boxplot' ? 'Resumo' : kind === 'histograma' ? 'Frequência' : 'Registros',
        ),
      )
      assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await photo(f.page, `manu-${kind}-${width}.png`)
      await f.page.reload()
      await f.page.getByRole('button', { name: 'Análise visual', exact: true }).click()
      await f.page.locator(`[data-chart-kind="${kind}"] .recharts-surface`).waitFor()
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}
test('Manu mantém o texto e oculta gráfico de outra unidade ou com contrato inválido', async () => {
  const f = await managementFixture(browser, { width: 390 })
  try {
    const v = visualization()
    v.metadados.unidade_id = 999
    const history = {
      session_id: 'chart-denied',
      iniciada_em: '2026-10-31T12:00:00Z',
      atualizada_em: '2026-10-31T12:05:00Z',
      titulo: 'Análise inválida',
      resumo: 'Salva',
      mensagens: [{ role: 'assistant', mensagem: 'Texto continua disponível.', visualizacao: v }],
    }
    await f.context.route('**/api/ia/**', (route) =>
      route.fulfill({ json: { status: 'SUCESSO', conversas: [history] } }),
    )
    await f.page.goto(base + '/manu')
    await f.page.getByRole('button', { name: 'Análise inválida', exact: true }).click()
    await f.page
      .getByText('Não foi possível exibir o gráfico desta mensagem.', { exact: true })
      .waitFor()
    assert.equal(await f.page.getByText('Texto continua disponível.', { exact: true }).count(), 1)
    assert.equal(await f.page.locator('[data-chart-kind]').count(), 0)
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
test('dashboard falha fechado em 502, sem carregar iframe geral, e oferece retry', async () => {
  const f = await managementFixture(browser, { width: 390, role: 'ADMINISTRADOR' })
  try {
    await f.page.goto(base + '/dashboard')
    await f.page
      .getByText('Não foi possível carregar o dashboard da sua unidade.', { exact: true })
      .waitFor()
    assert.equal(await f.page.locator('iframe').count(), 0)
    await f.page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await f.page
      .getByText('Não foi possível carregar o dashboard da sua unidade.', { exact: true })
      .waitFor()
    await photo(f.page, 'dashboard-erro-seguro-390.png')
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
test('SDK recebe acesso escopado, oculta filtros e renova token sem expor credenciais Web', async () => {
  const f = await managementFixture(browser, { width: 1440, mobile: false })
  try {
    await f.page.clock.setFixedTime(new Date())
    let reads = 0
    const jwt = (seconds) =>
      [
        Buffer.from('{}').toString('base64'),
        Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString(
          'base64',
        ),
        'test-only',
      ].join('.')
    await f.context.route('**/api/v1/dashboard/embed', async (route) => {
      assert.match(route.request().headers().authorization, /^Bearer /)
      assert.equal(new URL(route.request().url()).search, '')
      reads++
      return route.fulfill({
        json: {
          instanceUrl: 'https://qa.cloud.databricks.com',
          workspaceId: '123',
          dashboardId: 'a'.repeat(32),
          token: jwt(310),
          expiresIn: 310,
        },
      })
    })
    await f.context.route('https://qa.cloud.databricks.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html><body><p>BI autorizado</p><script>window.addEventListener('message',e=>{if(e.source!==parent)return;if(e.data.type==='DATABRICKS_SET_CONFIG')document.body.dataset.filters=e.data.config.globalFilterVisibility;if(e.data.type==='DATABRICKS_SET_TOKEN')document.body.dataset.refreshed='true'});setTimeout(()=>parent.postMessage({type:'DATABRICKS_EMBED_READY'},'*'),50)</script></body></html>`,
      }),
    )
    await f.page.goto(base + '/dashboard')
    await f.page.locator('[data-dashboard-state="ready"]').waitFor()
    const frame = f.page.frameLocator('iframe')
    await frame.locator('body[data-filters="disabled"]').waitFor()
    for (const [width, height] of [
      [1918, 869],
      [2560, 1080],
      [1366, 768],
      [1024, 768],
      [390, 844],
      [320, 667],
      [844, 390],
      [1440, 900],
    ]) {
      await f.page.setViewportSize({ width, height })
      const layout = await f.page.evaluate(() => {
        const main = document.querySelector('main')
        const dashboard = document.querySelector('[data-dashboard-state="ready"]')
        const panel = dashboard.parentElement
        const iframe = dashboard.querySelector('iframe').getBoundingClientRect()
        const mainStyle = getComputedStyle(main)
        return {
          scrolls:
            main.scrollHeight > main.clientHeight + 1 || main.scrollWidth > main.clientWidth + 1,
          fullWidth: Math.abs(main.clientWidth - main.parentElement.clientWidth) < 1,
          fitsPanel:
            Math.abs(iframe.height - panel.clientHeight) < 1 &&
            Math.abs(iframe.width - panel.clientWidth) < 1,
          bottom: iframe.bottom,
          expectedBottom: main.getBoundingClientRect().bottom - parseFloat(mainStyle.paddingBottom),
        }
      })
      assert.equal(layout.scrolls, false, `rolagem extra em ${width}x${height}`)
      assert.equal(layout.fullWidth, true, `largura limitada em ${width}x${height}`)
      assert.equal(layout.fitsPanel, true, `iframe cortado em ${width}x${height}`)
      assert.ok(Math.abs(layout.bottom - layout.expectedBottom) <= 2)
    }
    const expandedWidth = (await f.page.locator('iframe').boundingBox()).width
    await f.page.getByRole('button', { name: 'Recolher menu lateral', exact: true }).click()
    await f.page.waitForFunction(
      (width) => document.querySelector('iframe').getBoundingClientRect().width > width + 100,
      expandedWidth,
    )
    await f.page.getByRole('button', { name: 'Expandir menu lateral', exact: true }).click()
    await frame.locator('body[data-refreshed="true"]').waitFor({ timeout: 18000 })
    assert.ok(reads >= 2)
    const src = await f.page.locator('iframe').getAttribute('src')
    assert.equal(new URL(src).hostname, 'qa.cloud.databricks.com')
    assert.equal(new URL(src).searchParams.has('token'), false)
    const storage = await f.page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    )
    const scopedToken = [...new URLSearchParams(new URL(src).hash.slice(1)).values()][0]
    assert.ok(scopedToken)
    assert.equal(storage.includes(scopedToken), false)
    assert.equal(src.includes('mobile-test-only'), false)
    await photo(f.page, 'dashboard-sdk-1440.png')
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
