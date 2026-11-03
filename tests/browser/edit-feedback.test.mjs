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
const scenarios = [
  {
    name: 'perfil',
    path: '/perfil',
    field: '#profile-name',
    heading: 'Perfil',
    open: (page) => page.getByRole('button', { name: 'Editar perfil', exact: true }).click(),
  },
  {
    name: 'gestor',
    path: '/equipe',
    field: '#technician-name',
    heading: 'Minha equipe',
    open: (page) => page.getByRole('button', { name: 'Editar Gestor Centro', exact: true }).click(),
  },
  {
    name: 'técnico',
    path: '/equipe',
    field: '#technician-name',
    heading: 'Minha equipe',
    open: async (page) => {
      await page.getByRole('tab', { name: 'Técnicos', exact: true }).click()
      await page
        .getByRole('button', { name: /^Editar Técnico 01/ })
        .first()
        .click()
      await page.getByText('Manhã · 08:00 – 12:00', { exact: true }).waitFor()
    },
  },
  {
    name: 'evento',
    path: '/calendario',
    field: '#event-title',
    heading: 'Calendário',
    open: async (page) => {
      await page.getByRole('button', { name: /^Editar evento Revisão/ }).click()
    },
  },
]
for (const width of [1440, 390]) {
  for (const scenario of scenarios) {
    test(`isDirty de ${scenario.name}: cancelar preserva, restaurar limpa e sair exige descarte em ${width}px`, async () => {
      const f = await managementFixture(browser, {
        role: 'ADMINISTRADOR',
        width,
        height: 900,
        mobile: width < 600,
      })
      const { page } = f
      try {
        await page.goto(base + scenario.path)
        await scenario.open(page)
        const field = page.locator(scenario.field)
        const original = await field.inputValue()
        await field.fill(original + ' editado')
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
        const discard = page.getByRole('dialog', { name: 'Descartar alterações?', exact: true })
        await discard.getByRole('button', { name: 'Cancelar', exact: true }).click()
        await discard.waitFor({ state: 'hidden' })
        assert.equal(await field.inputValue(), original + ' editado')
        await field.fill(original)
        if (scenario.name === 'técnico') {
          await page.locator('#technician-unit').selectOption('6')
          await page.locator('#technician-unit').selectOption('5')
          await page.getByText('Manhã · 08:00 – 12:00', { exact: true }).waitFor()
        }
        if (scenario.name === 'evento' && width < 600) {
          const titleBox = await field.boundingBox()
          const descriptionBox = await page.locator('#event-description').boundingBox()
          assert.ok(Math.abs(titleBox.width - descriptionBox.width) < 2)
        }
        await photo(page, `${scenario.name}-formulario-${width}.png`)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
        await page.getByRole('heading', { name: scenario.heading, exact: true }).waitFor()
        assert.equal(await discard.count(), 0)
        await scenario.open(page)
        await field.fill(original + ' pendente')
        const settings = page.getByRole('link', { name: 'Configurações', exact: true })
        await settings.click()
        await discard.getByRole('button', { name: 'Cancelar', exact: true }).click()
        await discard.waitFor({ state: 'hidden' })
        assert.equal(await field.inputValue(), original + ' pendente')
        assert.equal(new URL(page.url()).pathname, scenario.path)
        await settings.click()
        await discard.getByRole('button', { name: 'Descartar', exact: true }).click()
        await page.waitForURL('**/configuracoes')
        assert.deepEqual(f.writes, [])
        assert.deepEqual(f.errors, [])
        assert.deepEqual(f.unexpected, [])
      } finally {
        await f.context.close()
      }
    })
  }
}

test('salvar perfil usa os novos valores como referência e falhar mantém alterações protegidas', async () => {
  const f = await managementFixture(browser, { role: 'ADMINISTRADOR', width: 1440, mobile: false })
  const { page } = f
  let profile = {
    id: 10,
    unidadeId: 5,
    nomeCompleto: 'Conta de Teste Mobile',
    email: 'teste@fixa.test',
    dataNascimento: '1980-01-01',
  }
  let fail = true
  try {
    await f.context.route('**/api/v1/perfil', async (route) => {
      if (route.request().method() === 'PATCH') {
        if (fail)
          return route.fulfill({ status: 503, json: { mensagem: 'Falha de teste ao salvar' } })
        profile = { ...profile, ...route.request().postDataJSON() }
      }
      return route.fulfill({ json: profile })
    })
    await page.goto(base + '/perfil')
    await page.getByRole('button', { name: 'Editar perfil', exact: true }).click()
    const name = page.locator('#profile-name')
    await name.fill('Perfil atualizado no teste')
    async function save() {
      await page.locator('form').getByRole('button', { name: 'Salvar', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Salvar alterações?', exact: true })
      await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
      await dialog.waitFor({ state: 'hidden' })
    }
    await save()
    assert.equal(await name.inputValue(), 'Perfil atualizado no teste')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    const discard = page.getByRole('dialog', { name: 'Descartar alterações?', exact: true })
    await discard.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await discard.waitFor({ state: 'hidden' })
    fail = false
    await save()
    await page.getByText('Perfil atualizado com sucesso.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Editar perfil', exact: true }).click()
    assert.equal(await name.inputValue(), 'Perfil atualizado no teste')
    await name.fill('Conta de Teste Mobile')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await discard.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await discard.waitFor({ state: 'hidden' })
    await name.fill('Perfil atualizado no teste')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await page.getByRole('heading', { name: 'Perfil', exact: true }).waitFor()
    await page.getByRole('link', { name: 'Configurações', exact: true }).click()
    await page.waitForURL('**/configuracoes')
    assert.equal(await discard.count(), 0)
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
