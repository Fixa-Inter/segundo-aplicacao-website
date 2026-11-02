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
async function photo(page, name) {
  if (!process.env.FIXA_QA_EVIDENCE_DIR) return
  await mkdir(process.env.FIXA_QA_EVIDENCE_DIR, { recursive: true })
  await page.screenshot({ path: join(process.env.FIXA_QA_EVIDENCE_DIR, name), fullPage: true })
}
async function save(page) {
  await page.locator('form').getByRole('button', { name: 'Salvar', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
}

for (const width of [1440, 390]) {
  test(`RH edita dados e situação de gestores sem lixeira em ${width}px`, async () => {
    const f = await managementFixture(browser, {
      role: 'ADMINISTRADOR',
      width,
      height: 900,
      mobile: width < 600,
    })
    const { page } = f
    try {
      await page.goto(base + '/equipe')
      await page.getByRole('button', { name: 'Editar Gestor Centro', exact: true }).waitFor()
      assert.equal(await page.getByRole('combobox', { name: /^Situação de / }).count(), 0)
      await page.getByRole('button', { name: 'Editar Gestor Centro', exact: true }).click()
      await page.getByLabel('Nome completo *', { exact: true }).fill('Gestor Centro Atualizado')
      await page.getByLabel('Função *', { exact: true }).fill('Coordenação de manutenção')
      assert.equal(await page.getByLabel('Cargo', { exact: true }).inputValue(), 'Gestor')
      assert.equal(await page.getByLabel('Turnos *', { exact: true }).count(), 0)
      assert.equal(await page.getByRole('group', { name: 'Competências', exact: true }).count(), 0)
      await photo(page, `gestor-edicao-${width}.png`)
      await page.getByLabel('Situação', { exact: true }).selectOption('Inativo')
      await save(page)
      await page.getByText('Gestor atualizado com sucesso.', { exact: true }).waitFor()
      let row = page.locator('tr').filter({
        has: page.getByRole('button', { name: 'Editar Gestor Centro Atualizado', exact: true }),
      })
      assert.ok((await row.innerText()).includes('Inativo'))
      assert.equal(await row.getByRole('combobox').count(), 0)
      await page
        .getByRole('button', { name: 'Editar Gestor Centro Atualizado', exact: true })
        .click()
      await page.getByLabel('Situação', { exact: true }).selectOption('Ativo')
      await save(page)
      await page.getByText('Gestor atualizado com sucesso.', { exact: true }).waitFor()
      row = page.locator('tr').filter({
        has: page.getByRole('button', { name: 'Editar Gestor Centro Atualizado', exact: true }),
      })
      assert.ok((await row.innerText()).includes('Ativo'))
      assert.ok(
        f.writes.some(
          (call) =>
            call.path === '/api/v1/usuarios/101' && call.data.cargo === 'Coordenação de manutenção',
        ),
      )
      assert.equal(
        f.writes.some((call) => call.method === 'DELETE'),
        false,
      )
      assert.equal(
        await page.getByRole('button', { name: /^(Desativar|Ativar) Gestor/ }).count(),
        0,
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await photo(page, `gestor-tabela-${width}.png`)
      await page.reload()
      await page
        .getByRole('button', { name: 'Editar Gestor Centro Atualizado', exact: true })
        .waitFor()
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}
test('falha ao salvar situação mantém formulário e permite concluir sem excluir o cadastro', async () => {
  const f = await managementFixture(browser, { role: 'GESTOR', width: 390 })
  const { page } = f
  try {
    let fail = true
    await f.context.route('**/api/v1/usuarios/201/desativar', (route) =>
      fail
        ? route.fulfill({ status: 503, json: { mensagem: 'Falha de teste' } })
        : route.fallback(),
    )
    await page.goto(base + '/equipe')
    await page.getByRole('button', { name: /^Editar Técnico 01/ }).click()
    await page.getByLabel('Situação', { exact: true }).selectOption('Inativo')
    await save(page)
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByLabel('Situação', { exact: true }).inputValue(), 'Inativo')
    fail = false
    await save(page)
    await page.getByText('Técnico atualizado com sucesso.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('combobox', { name: /^Situação de/ }).count(), 0)
    assert.equal(
      f.writes.some((call) => call.method === 'DELETE'),
      false,
    )
    assert.ok(f.writes.some((call) => call.path === '/api/v1/usuarios/201/desativar'))
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
