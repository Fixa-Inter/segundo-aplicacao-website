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

const recommendation = `## Opções para sua manutenção

Compare as especificações antes de escolher.

1. **Furadeira de impacto 650 W**
   - Mandril de 13 mm e alimentação 127 V.
   - **Preço informado:** R$ 289,90.
   - [Ver oferta na Loja Exemplo](https://loja.example/furadeira?origem=manu&modelo=650w)

2. **Kit de brocas para concreto**
   - Jogo com 5 peças.
   - [Consultar o kit](https://ferramentas.example/kit-brocas)

Os preços e a disponibilidade podem mudar.`

async function openReply(f, reply) {
  const history = {
    session_id: 'shopping-format',
    iniciada_em: '2026-11-01T12:00:00Z',
    atualizada_em: '2026-11-01T12:05:00Z',
    titulo: 'Ferramentas para manutenção',
    resumo: 'Salva',
    mensagens: [
      { role: 'human', mensagem: '**Minha mensagem**\nQuero comparar ferramentas.' },
      { role: 'assistant', mensagem: reply, emocao: 'NEUTRO' },
    ],
  }
  await f.context.route('**/api/ia/**', (route) =>
    route.fulfill({
      json: { status: 'SUCESSO', conversas: [history], conversa: history },
    }),
  )
  await f.page.goto(base + '/manu')
  await f.page.getByRole('button', { name: 'Ferramentas para manutenção', exact: true }).click()
  await f.page.getByRole('log').waitFor()
}

for (const width of [1440, 390, 320]) {
  test(`Manu: recomendações legíveis e links acessíveis em ${width}px, inclusive após reload`, async () => {
    const f = await managementFixture(browser, { width, height: 960, mobile: width < 600 })
    try {
      await openReply(f, recommendation)
      const log = f.page.getByRole('log')
      await log.getByRole('heading', { name: 'Opções para sua manutenção' }).waitFor()
      assert.equal(
        await log.locator('strong').filter({ hasText: 'Furadeira de impacto 650 W' }).count(),
        1,
      )
      assert.ok((await log.innerText()).includes('R$ 289,90'))
      assert.ok(!(await log.innerText()).includes('##'))
      assert.ok((await log.innerText()).includes('**Minha mensagem**'))
      const link = log.getByRole('link', { name: /Ver oferta na Loja Exemplo/ })
      assert.equal(
        await link.getAttribute('href'),
        'https://loja.example/furadeira?origem=manu&modelo=650w',
      )
      assert.equal(await link.getAttribute('target'), '_blank')
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer')
      assert.ok((await link.innerText()).includes('loja.example'))
      await link.scrollIntoViewIfNeeded()
      await link.focus()
      assert.equal(await link.evaluate((el) => el === document.activeElement), true)
      assert.ok((await link.boundingBox()).height >= 44)
      assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      assert.ok(await log.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
      if (process.env.FIXA_QA_EVIDENCE_DIR) {
        await mkdir(process.env.FIXA_QA_EVIDENCE_DIR, { recursive: true })
        await log.evaluate((el) => {
          el.scrollTop = 0
        })
        await f.page.screenshot({
          path: join(process.env.FIXA_QA_EVIDENCE_DIR, `manu-compras-${width}.png`),
          fullPage: true,
        })
      }
      await f.page.reload()
      await f.page.getByRole('button', { name: 'Ferramentas para manutenção', exact: true }).click()
      await log.getByRole('heading', { name: 'Opções para sua manutenção' }).waitFor()
      assert.equal(await log.getByRole('link', { name: /Ver oferta na Loja Exemplo/ }).count(), 1)
      assert.deepEqual(f.errors, [])
      assert.deepEqual(f.unexpected, [])
      assert.deepEqual(f.writes, [])
    } finally {
      await f.context.close()
    }
  })
}

test('Manu: links brutos, tabelas e conteúdo não confiável não executam HTML nem carregam imagens remotas', async () => {
  const f = await managementFixture(browser, { width: 320 })
  try {
    await openReply(
      f,
      `## Comparação

| Produto | Valor |
| --- | --- |
| Furadeira | R$ 289,90 |

https://loja.example/caminho-muito-longo?origem=manu&produto=furadeira

[Link inválido](javascript:alert%281%29)

[Outra origem inválida](//loja.example/oferta)

[URL com credenciais](https://usuario:senha@loja.example/oferta)

![Foto da ferramenta](https://imagens.example/furadeira.jpg)

<img src="https://imagens.example/track" onerror="window.executed=true">

<script>window.executed=true</script>

**Fim da resposta**`,
    )
    const log = f.page.getByRole('log')
    await log.getByText('Fim da resposta', { exact: true }).waitFor()
    assert.equal(await log.getByRole('table').count(), 1)
    assert.equal(
      await log
        .locator(
          'a[href^="javascript:"], a[href^="//"], a[href*="usuario:senha"], script, img[onerror]',
        )
        .count(),
      0,
    )
    assert.equal(await log.locator('img[src*="imagens.example"]').count(), 0)
    assert.equal(await log.getByRole('link', { name: /loja.example/ }).count(), 1)
    assert.ok(
      (await log.getByRole('link', { name: /loja.example/ }).innerText())
        .trim()
        .startsWith('loja.example'),
    )
    assert.equal(
      await log.getByRole('link', { name: /Foto da ferramenta/ }).getAttribute('href'),
      'https://imagens.example/furadeira.jpg',
    )
    assert.equal(await f.page.evaluate(() => Boolean(window.executed)), false)
    assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(f.errors, [])
    assert.deepEqual(f.unexpected, [])
  } finally {
    await f.context.close()
  }
})
