import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePreferences } from '../src/utils/preferences.ts'
import { translate } from '../src/i18n/messages.ts'
import { formatDate, parseDateInput } from '../src/utils/calendar.ts'

test('preferências rejeitam valores corrompidos e não recuperam dados pessoais', () => {
  for (const saved of [null, '', '{', 'null', '[]', '42']) {
    assert.deepEqual(parsePreferences(saved), { language: 'pt-BR', theme: 'light' })
  }
  assert.deepEqual(parsePreferences('{"language":"fr","theme":"system"}'), {
    language: 'pt-BR',
    theme: 'light',
  })
  for (const language of ['pt-BR', 'en', 'es', 'zh-CN']) {
    assert.deepEqual(
      parsePreferences(JSON.stringify({ language, theme: 'dark', password: 'ignored' })),
      {
        language,
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
