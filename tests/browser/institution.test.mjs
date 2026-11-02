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
async function fixture(role, width) {
  const f = await managementFixture(browser, { role, width, height: 900, mobile: width < 600 })
  const records = {
    locais: [
      {
        id: 20,
        unidadeId: 5,
        nome: 'Laboratório de informática',
        tipoLocalEndereco: { id: 2, nome: 'Laboratório' },
        descricao: 'Computadores e equipamentos da sala 101',
        estaAtivo: true,
      },
      {
        id: 21,
        unidadeId: 6,
        nome: 'Banheiro do térreo',
        tipoLocalEndereco: 'AREA_COMUM',
        descricao: 'Próximo à recepção',
        estaAtivo: true,
      },
    ],
    turnos: [
      { id: 50, unidadeId: 5, nome: 'Manhã', horaInicio: 28800, horaFim: 43200, estaAtivo: true },
      { id: 51, unidadeId: 5, nome: 'Tarde', horaInicio: 46800, horaFim: 64800, estaAtivo: true },
      { id: 60, unidadeId: 6, nome: 'Diurno', horaInicio: 28800, horaFim: 64800, estaAtivo: true },
    ],
  }
  const calls = []
  await f.context.route(
    /\/api\/v1\/(locais|turnos)(?:\/\d+(?:\/(?:ativar|desativar))?)?(?:\?|$)/,
    (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const [, kind, id, action] = url.pathname.match(
        /\/api\/v1\/(locais|turnos)(?:\/(\d+))?(?:\/(ativar|desativar))?$/,
      )
      const items = records[kind]
      const item = items.find((item) => String(item.id) === id)
      if (request.method() === 'GET') {
        const unitId = Number(url.searchParams.get('unidadeId'))
        return route.fulfill({
          json: id ? item : items.filter((item) => !unitId || item.unidadeId === unitId),
        })
      }
      const data = request.postData() ? request.postDataJSON() : null
      calls.push({ path: url.pathname, method: request.method(), data })
      if (action) item.estaAtivo = action === 'ativar'
      else if (id) Object.assign(item, data)
      else
        items.push({ ...data, id: Math.max(...items.map((item) => item.id)) + 1, estaAtivo: true })
      return route.fulfill({ json: item ?? items.at(-1) })
    },
  )
  return { ...f, records, calls }
}
async function save(page) {
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
}
for (const [role, width] of [
  ['GESTOR', 1440],
  ['ADMINISTRADOR', 390],
]) {
  test(`instituição: cadastro, edição, detalhes, ativação e turno noturno para ${role} em ${width}px`, async () => {
    const f = await fixture(role, width)
    const { page } = f
    try {
      await page.goto(base + '/instituicao')
      await page
        .getByRole('button', { name: 'Editar Laboratório de informática', exact: true })
        .waitFor()
      assert.equal(
        await page.getByText('Banheiro do térreo', { exact: true }).count(),
        role === 'GESTOR' ? 0 : 1,
      )
      await photo(page, `instituicao-locais-${width}.png`)
      await page.getByRole('button', { name: 'Adicionar local', exact: true }).click()
      await page.getByLabel('Nome *', { exact: true }).fill('Sala de manutenção')
      if (role === 'ADMINISTRADOR')
        await page.getByLabel('Unidade de trabalho *', { exact: true }).selectOption('5')
      await page.getByLabel('Tipo de local *', { exact: true }).selectOption('SALA_AULA')
      await page.getByLabel('Descrição *', { exact: true }).fill('Sala ao lado da coordenação')
      await photo(page, `instituicao-formulario-${width}.png`)
      await save(page)
      await page.getByText('Local salvo com sucesso.', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Editar Sala de manutenção', exact: true }).click()
      await page.getByLabel('Nome *', { exact: true }).fill('Sala de manutenção 2')
      await save(page)
      await page
        .getByRole('button', { name: 'Ver detalhes de Sala de manutenção 2', exact: true })
        .click()
      assert.equal(await page.getByLabel('Nome *', { exact: true }).getAttribute('readonly'), '')
      await page.getByRole('button', { name: 'Voltar', exact: true }).click()
      await page
        .getByRole('button', { name: 'Desativar Sala de manutenção 2', exact: true })
        .click()
      await page.getByRole('dialog').getByRole('button', { name: 'Desativar', exact: true }).click()
      await page.getByRole('button', { name: 'Ativar Sala de manutenção 2', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Ativar', exact: true }).click()
      await page
        .getByRole('button', { name: 'Desativar Sala de manutenção 2', exact: true })
        .waitFor()
      await page.getByRole('tab', { name: 'Locais', exact: true }).focus()
      await page.keyboard.press('End')
      assert.equal(
        await page.getByRole('tab', { name: 'Turnos', exact: true }).getAttribute('aria-selected'),
        'true',
      )
      await page.getByRole('button', { name: 'Adicionar turno', exact: true }).click()
      await page.getByLabel('Nome *', { exact: true }).fill('Noturno')
      if (role === 'ADMINISTRADOR')
        await page.getByLabel('Unidade de trabalho *', { exact: true }).selectOption('5')
      await page.getByLabel('Horário de início *', { exact: true }).fill('22:00')
      await page.getByLabel('Horário de término *', { exact: true }).fill('06:00')
      await page.getByText('Término no dia seguinte', { exact: true }).waitFor()
      await save(page)
      await page.getByText('Turno salvo com sucesso.', { exact: true }).waitFor()
      assert.equal(f.calls.at(-1).data.atravessaMeiaNoite, true)
      assert.equal(f.calls.at(-1).data.horaInicio, 79200)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await photo(page, `instituicao-turnos-${width}.png`)
      await page.reload()
      await page.getByRole('button', { name: 'Editar Sala de manutenção 2', exact: true }).waitFor()
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
    } finally {
      await f.context.close()
    }
  })
}
test('técnico seleciona vários turnos e salva sem perder os vínculos existentes', async () => {
  const f = await fixture('GESTOR', 390)
  const { page } = f
  const writes = []
  try {
    const links = [{ id: 90, turnoId: 50, estaAtivo: true }]
    await f.context.route('**/api/v1/usuarios/201/turnos', (route) =>
      route.fulfill({ json: links }),
    )
    await f.context.route('**/api/v1/turnos/51/usuarios/201', (route) => {
      links.push({ id: 91, turnoId: 51, estaAtivo: true })
      return route.fulfill({ json: links.at(-1) })
    })
    await f.context.route('**/api/v1/usuarios/201', (route) => {
      if (route.request().method() !== 'GET') writes.push(route.request().postDataJSON())
      return route.fulfill({
        json: {
          id: 201,
          unidadeId: 5,
          nomeCompleto: 'Técnico 01 com um nome bastante extenso para testar o cartão',
          email: 'tecnico5-0@fixa.test',
          tipoAcesso: 'TECNICO',
          cargo: 'Manutenção',
          dataNascimento: '1980-01-01',
          estaAtivo: true,
        },
      })
    })
    await f.context.route('**/api/v1/aptidoes', (route) =>
      route.request().method() === 'GET' ? route.fallback() : route.fulfill({ json: { id: 70 } }),
    )
    await page.goto(base + '/equipe')
    await page.getByRole('button', { name: /^Editar Técnico 01/ }).click()
    const shifts = page.getByLabel('Turnos *', { exact: true })
    await shifts.waitFor()
    await page.getByText('Manhã · 08:00 – 12:00', { exact: true }).waitFor()
    await shifts.click()
    await page.getByRole('option', { name: 'Tarde · 13:00 – 18:00', exact: true }).click()
    await page.getByText('Tarde · 13:00 – 18:00', { exact: true }).waitFor()
    await photo(page, 'tecnico-multiplos-turnos-390.png')
    await shifts.click()
    await page.keyboard.press('Escape')
    await page.getByLabel('Nome completo *', { exact: true }).fill('Técnico com dois turnos')
    await save(page)
    await page.getByText('Técnico atualizado com sucesso.', { exact: true }).waitFor()
    assert.equal(writes.length, 1)
    assert.deepEqual(
      links.map((link) => link.turnoId),
      [50, 51],
    )
    assert.deepEqual(f.unexpected, [])
    assert.deepEqual(f.errors, [])
  } finally {
    await f.context.close()
  }
})
test('formulário valida campos e protege alterações não salvas', async () => {
  const f = await fixture('GESTOR', 320)
  try {
    await f.page.goto(base + '/instituicao')
    await f.page.getByRole('button', { name: 'Adicionar local', exact: true }).click()
    await f.page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await f.page.getByText('Informe um nome com até 100 caracteres.', { exact: true }).waitFor()
    await f.page.getByLabel('Nome *', { exact: true }).fill('Rascunho')
    await f.page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    const dialog = f.page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    assert.equal(await f.page.getByLabel('Nome *', { exact: true }).inputValue(), 'Rascunho')
    assert.equal(f.calls.length, 0)
    assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})

test('falha ao carregar instituição permite tentar novamente sem substituir dados por opções falsas', async () => {
  const f = await fixture('GESTOR', 390)
  let fail = true
  try {
    await f.context.route(/\/api\/v1\/locais\?/, (route) =>
      fail
        ? route.fulfill({ status: 503, json: { mensagem: 'Indisponível no teste' } })
        : route.fallback(),
    )
    await f.page.goto(base + '/instituicao')
    await f.page.getByRole('button', { name: 'Tentar novamente', exact: true }).waitFor()
    assert.equal(
      await f.page.getByRole('button', { name: 'Adicionar local', exact: true }).isDisabled(),
      true,
    )
    fail = false
    await f.page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await f.page
      .getByRole('button', { name: 'Editar Laboratório de informática', exact: true })
      .waitFor()
    assert.equal(f.calls.length, 0)
    assert.deepEqual(f.unexpected, [])
    assert.deepEqual(f.errors, [])
  } finally {
    await f.context.close()
  }
})
