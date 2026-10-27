import test, { before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { managementFixture } from './management-fixture.mjs'

const modulePath = process.env.FIXA_PLAYWRIGHT_MODULE
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright')
const baseURL = process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=',
  'base64',
)
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
async function screenshot(page, name) {
  const dir = process.env.FIXA_QA_EVIDENCE_DIR
  if (!dir) return
  await mkdir(dir, { recursive: true })
  await page.screenshot({ path: join(dir, name), fullPage: true })
}
async function setup(options = {}) {
  const fixture = await managementFixture(browser, {
    width: options.width || 1440,
    height: 960,
    mobile: false,
  })
  fixtures.push(fixture)
  const state = {
    reply: 'Resposta preservada.',
    historyFails: false,
    exists: false,
    posts: 0,
    ...options,
  }
  await fixture.context.route('**/api/ia/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/ia', '')
    if (req.method() === 'GET' && path === '/api/v1/sessoes') {
      if (state.historyFails)
        return route.fulfill({ status: 503, json: { detail: 'Indisponível.' } })
      return route.fulfill({
        json: {
          status: state.exists ? 'SUCESSO' : 'SEM_DADOS',
          conversas: state.exists
            ? [
                {
                  session_id: 'qa-active',
                  iniciada_em: '2026-10-27T10:00:00Z',
                  atualizada_em: '2026-10-27T10:01:00Z',
                  titulo: '',
                  resumo: '',
                  mensagens: [
                    { role: 'human', mensagem: state.question },
                    { role: 'assistant', mensagem: state.reply, emocao: 'NEUTRO' },
                  ],
                },
              ]
            : [],
        },
      })
    }
    if (req.method() === 'POST' && path === '/api/v1/chat') {
      state.posts++
      state.exists = true
      state.question = req.postDataJSON().mensagem
      return route.fulfill({
        json: {
          thread_id: 'qa-active',
          resposta: state.reply,
          emocao: 'NEUTRO',
          intencao: 'faq',
          confirmacao: state.confirmation || 'nao',
        },
      })
    }
    throw new Error('Rota inesperada da Manu: ' + req.method() + ' ' + path)
  })
  await fixture.page.goto(new URL('/manu', baseURL).href)
  await fixture.page.getByRole('heading', { name: /^Olá / }).waitFor()
  await fixture.page.getByText('Nenhuma conversa encontrada.', { exact: true }).waitFor()
  return { ...fixture, state }
}

test('resposta vazia exibe erro, preserva rascunho e não deixa balão vazio ou retry automático', async () => {
  const { page, state } = await setup({ reply: '   ' })
  await page.locator('#manu-question').fill('Mensagem a preservar')
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'resposta inválida' }).waitFor()
  assert.equal(await page.locator('#manu-question').inputValue(), 'Mensagem a preservar')
  assert.equal(await page.locator('[role="log"] article').count(), 0)
  assert.equal(state.posts, 1)
  await screenshot(page, 'manu-resposta-invalida.png')
})

test('histórico em memória continua acessível ao voltar à Manu com 503 e recupera no retry', async () => {
  const { page, state } = await setup()
  await page.locator('#manu-question').fill('Consulta preservada QA')
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click()
  await page.getByText('Resposta preservada.', { exact: true }).waitFor()
  const conversation = () =>
    page.locator('nav[aria-label="Conversas recentes"] button[title="Consulta preservada QA"]')
  await conversation().waitFor()
  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).waitFor()
  state.historyFails = true
  await page.getByRole('link', { name: 'Manu', exact: true }).click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'Não foi possível carregar as conversas.' })
    .waitFor()
  await conversation().click()
  await page.getByText('Resposta preservada.', { exact: true }).waitFor()
  assert.equal(state.posts, 1)
  await screenshot(page, 'manu-cache-503.png')
  state.historyFails = false
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await page.getByRole('alert').waitFor({ state: 'detached' })
  assert.equal(await conversation().count(), 1)
})

test('upload malformado mostra mensagem amigável e permite repetir e remover no mobile', async () => {
  const fixture = await setup({ width: 390 })
  const { page, context } = fixture
  // Apenas configuração de teste; a implementação real do uploader continua em uso.
  await context.route('**/src/services/cloudinaryApi.ts*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `import { createCloudinaryUploader } from '/src/services/cloudinaryService.ts';
export const cloudinaryUploader = createCloudinaryUploader('fixa-qa', 'qa');`,
    }),
  )
  let uploads = 0
  await context.route('https://api.cloudinary.com/**', (route) => {
    uploads++
    return route.fulfill(
      uploads === 1
        ? {
            status: 200,
            contentType: 'text/html',
            body: '<html>erro do provedor</html>',
          }
        : { json: { secure_url: 'https://res.cloudinary.com/fixa-qa/image/upload/qa.png' } },
    )
  })
  await context.route('https://res.cloudinary.com/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: png }),
  )
  // Recarrega para aplicar a configuração pública controlada e limpar módulos em memória.
  await page.reload()
  await page.getByRole('heading', { name: /^Olá / }).waitFor()
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: png })
  const alert = page.getByRole('alert')
  await alert.filter({ hasText: 'Não foi possível enviar a imagem. Tente novamente.' }).waitFor()
  assert.doesNotMatch(await alert.innerText(), /Unexpected token|JSON|Invalid URL|SyntaxError/)
  assert.equal(uploads, 1)
  await screenshot(page, 'manu-upload-amigavel-390.png')
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await page.getByText('Imagem pronta', { exact: true }).waitFor()
  assert.equal(uploads, 2)
  await page.getByRole('button', { name: 'Remover imagem 1', exact: true }).click()
  assert.equal(await page.getByText('Imagem pronta', { exact: true }).count(), 0)
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  )
})

test('saudação, erro e confirmação seguem o idioma escolhido sem misturar português e inglês', async () => {
  const { page, context, state } = await setup({ reply: '' })
  await context.addInitScript(() =>
    localStorage.setItem(
      'fixa.preferences',
      JSON.stringify({
        language: 'en',
        languageSource: 'manual',
        theme: 'light',
      }),
    ),
  )
  await page.reload()
  await page.getByRole('heading', { name: /^Hello / }).waitFor()
  await page.locator('#manu-question').fill('Preserve this draft')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  const alert = page.getByRole('alert')
  await alert.waitFor()
  assert.equal(
    await alert.innerText(),
    'Manu returned an invalid response. We do not resend automatically: the server may have received the message.',
  )
  assert.equal(await page.locator('#manu-question').inputValue(), 'Preserve this draft')
  assert.equal(state.posts, 1)
  await screenshot(page, 'manu-erro-idioma-en.png')
  state.reply = 'Please review this test proposal.'
  state.confirmation = 'sim'
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await page.getByRole('button', { name: 'Yes', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'No', exact: true }).count(), 1)
  assert.equal(await page.getByRole('button', { name: 'Sim', exact: true }).count(), 0)
  assert.equal(state.posts, 2)
})
