import assert from 'node:assert/strict'
import test from 'node:test'
import { detectBrowserLanguage, parsePreferences } from '../src/utils/preferences.ts'
import { translate } from '../src/i18n/messages.ts'
import { formatDate, parseDateInput } from '../src/utils/calendar.ts'

test('preferências rejeitam valores corrompidos e não recuperam dados pessoais', () => {
  for (const saved of [null, '', '{', 'null', '[]', '42']) {
    assert.deepEqual(parsePreferences(saved), {
      language: 'pt-BR',
      languageSource: 'browser',
      theme: 'light',
    })
  }
  assert.deepEqual(parsePreferences('{"language":"fr","theme":"system"}'), {
    language: 'pt-BR',
    languageSource: 'browser',
    theme: 'light',
  })
  for (const language of ['pt-BR', 'en', 'es', 'zh-CN']) {
    assert.deepEqual(
      parsePreferences(
        JSON.stringify({ language, languageSource: 'manual', theme: 'dark', password: 'ignored' }),
      ),
      {
        language,
        languageSource: 'manual',
        theme: 'dark',
      },
    )
  }
})

test('idiomas traduzem navegação, validação e valores sem alterar nomes cadastrados', () => {
  const greetings = ['Bem-vinda Ana!', 'Welcome, Ana!', '¡Bienvenida, Ana!', '欢迎，Ana！']
  for (const [index, language] of ['pt-BR', 'en', 'es', 'zh-CN'].entries()) {
    assert.equal(translate(language, 'Bem-vinda {name}!', { name: 'Ana' }), greetings[index])
    assert.equal(translate(language, 'Nome cadastrado XYZ'), 'Nome cadastrado XYZ')
    if (language !== 'pt-BR') {
      assert.notEqual(translate(language, 'Configurações'), 'Configurações')
      assert.notEqual(translate(language, 'Informe um e-mail válido.'), 'Informe um e-mail válido.')
    }
  }
  assert.equal(translate('en', 'Editar {name}', { name: '<script>' }), 'Edit <script>')
  assert.equal(translate('en', 'Editar {name}', {}), 'Edit {name}')
})

test('datas de apresentação mudam de idioma sem mudar a data editável do perfil', () => {
  for (const language of ['pt-BR', 'en', 'es', 'zh-CN']) {
    const text = formatDate('2000-03-11', { dateStyle: 'long' }, language)
    assert.match(text, /2000/)
    assert.ok(text.includes('11'))
  }
  assert.equal(formatDate('2026-03-14', { weekday: 'long' }, 'en'), 'Saturday')
  assert.equal(formatDate('2026-03-14', { weekday: 'long' }, 'es'), 'sábado')
  assert.equal(formatDate('2026-03-14', { weekday: 'long' }, 'zh-CN'), '星期六')
  assert.equal(parseDateInput(formatDate('2000-03-11', { dateStyle: 'short' })), '2000-03-11')
})

test('idioma segue a prioridade real do navegador e reconhece variantes regionais suportadas', () => {
  const cases = [
    [['pt-BR', 'en-US', 'zh-CN'], 'pt-BR'],
    [['en-GB', 'pt-BR'], 'en'],
    [['es-AR', 'en'], 'es'],
    [['fr-FR', 'pt-PT'], 'pt-BR'],
    [['zh-Hans-SG', 'en'], 'zh-CN'],
    [['ZH-cn'], 'zh-CN'],
    [['fr-FR', 'de-DE'], 'pt-BR'],
    [[], 'pt-BR'],
  ]
  for (const [languages, expected] of cases)
    assert.equal(detectBrowserLanguage(languages), expected)
})

test('escolha antiga em chinês é preservada como manual; antigo padrão português segue o navegador', () => {
  assert.deepEqual(parsePreferences('{"language":"zh-CN","theme":"dark"}', ['pt-BR', 'en']), {
    language: 'zh-CN',
    languageSource: 'manual',
    theme: 'dark',
  })
  assert.equal(parsePreferences('{', ['es-MX']).language, 'es')
  assert.equal(parsePreferences('{"language":"pt-BR","theme":"light"}', ['en-US']).language, 'en')
})

test('idioma automático é recalculado quando o navegador muda, mesmo com cache anterior', () => {
  const automatic = JSON.stringify({ language: 'zh-CN', languageSource: 'browser', theme: 'light' })
  assert.equal(parsePreferences(automatic, ['en-US']).language, 'en')
  assert.equal(parsePreferences(automatic, ['pt-BR']).language, 'pt-BR')
})

test('escolha manual explícita nas configurações prevalece; valor manual inválido usa o navegador', () => {
  assert.deepEqual(
    parsePreferences('{"language":"es","languageSource":"manual","theme":"dark"}', ['pt-BR']),
    {
      language: 'es',
      languageSource: 'manual',
      theme: 'dark',
    },
  )
  assert.deepEqual(parsePreferences('{"language":"fr","languageSource":"manual"}', ['en-US']), {
    language: 'en',
    languageSource: 'browser',
    theme: 'light',
  })
})
