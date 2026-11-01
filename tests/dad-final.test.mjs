import test from 'node:test'
import assert from 'node:assert/strict'
import { authReducer, initialAuthState } from '../src/utils/authReducer.ts'
import { parsePreferences, serializePreferences } from '../src/utils/preferences.ts'
import { validateRecoveryForm } from '../src/utils/recoveryValidation.ts'
import {
  buildTimeSeries,
  visualizationGroupKey,
  visualizationPointKey,
} from '../src/utils/chartData.ts'
import { decodeVisualization } from '../src/utils/visualization.ts'
import { visualization } from './fixtures/visualizations.mjs'

const user = Object.freeze({
  id: '10',
  name: 'Ana',
  identifier: 'ana@fixa.test',
  cnpj: '12345678000195',
  role: 'GESTOR',
})
const form = {
  email: 'ana@fixa.test',
  code: '123456',
  current: '1234',
  password: 'Nova1234',
  confirmation: 'Nova1234',
}

test('autenticação distingue restauração, entrada, sucesso, falha e saída sem modificar o usuário original', () => {
  assert.equal(initialAuthState.status, 'checking')
  const signingIn = authReducer(initialAuthState, { type: 'LOGIN_START' })
  assert.deepEqual(signingIn, { status: 'signing-in', user: null, error: null })
  const signedIn = authReducer(signingIn, { type: 'LOGIN_SUCCESS', user })
  const renamed = authReducer(signedIn, { type: 'UPDATE_NAME', name: 'Maria' })
  assert.equal(renamed.status, 'authenticated')
  assert.equal(renamed.user.name, 'Maria')
  assert.equal(user.name, 'Ana')
  const failed = authReducer(signedIn, { type: 'LOGIN_ERROR', error: 'Sessão expirada.' })
  assert.deepEqual(failed, { status: 'error', user: null, error: 'Sessão expirada.' })
  const signedOut = authReducer(failed, { type: 'LOGOUT' })
  assert.deepEqual(signedOut, { status: 'anonymous', user: null, error: null })
  assert.equal(authReducer(signedOut, { type: 'UPDATE_NAME', name: 'Ignorado' }), signedOut)
})

test('preferências antigas migram sem perder idioma/tema e são salvas com schema e somente campos permitidos', () => {
  const migrated = parsePreferences('{"language":"es","languageSource":"manual","theme":"dark"}', [
    'pt-BR',
  ])
  const saved = JSON.parse(serializePreferences({ ...migrated, token: 'never-store' }))
  assert.deepEqual(saved, { _versao: 1, language: 'es', languageSource: 'manual', theme: 'dark' })
  assert.deepEqual(parsePreferences(JSON.stringify(saved), ['en']), migrated)
})

test('versão incompatível é descartada e volta ao navegador, sem reaproveitar campos do schema desconhecido', () => {
  for (const version of [0, 2, '1', null]) {
    const stored = JSON.stringify({
      _versao: version,
      language: 'zh-CN',
      languageSource: 'manual',
      theme: 'dark',
    })
    assert.deepEqual(parsePreferences(stored, ['en-US']), {
      language: 'en',
      languageSource: 'browser',
      theme: 'light',
    })
  }
})

test('recuperação valida cada etapa e identifica o campo incorreto antes do serviço', () => {
  assert.equal(
    validateRecoveryForm({ ...form, email: 'errado' }, 'email').email,
    'Digite um e-mail válido.',
  )
  for (const code of ['', '12345', '1234567', '12345a', '012345'])
    assert.ok(validateRecoveryForm({ ...form, code }, 'code').code)
  const invalidChange = validateRecoveryForm({ ...form, current: '', password: 'curta' }, 'change')
  assert.ok(invalidChange.current)
  assert.ok(invalidChange.password)
  assert.ok(validateRecoveryForm({ ...form, confirmation: 'outra' }, 'password').confirmation)
  for (const step of ['email', 'code', 'password', 'change'])
    assert.equal(Object.values(validateRecoveryForm(form, step)).some(Boolean), false)
  assert.ok(validateRecoveryForm({ ...form, current: 'x'.repeat(101) }, 'change').current)
})

test('identidades dos gráficos não dependem da posição nem da ordem das propriedades do grupo', () => {
  const first = { grupo: { usuario: 10, categoria: 'Elétrica' }, valor: 2, qtd_registros: 2 }
  const second = { ...first, grupo: { categoria: 'Elétrica', usuario: 10 }, valor: 8 }
  assert.equal(visualizationPointKey(first), visualizationPointKey(second))
  assert.notEqual(
    visualizationPointKey({ ...first, data_referencia: '2026-10-01' }),
    visualizationPointKey({ ...first, data_referencia: '2026-10-02' }),
  )
  assert.notEqual(visualizationGroupKey({ id: 1 }), visualizationGroupKey({ id: '1' }))
})

test('série temporal agrupa em uma passagem, ordena datas, preserva zeros e deixa lacunas como null', () => {
  const points = Object.freeze([
    { grupo: { tecnico: 'A' }, data_referencia: '2026-10-02', valor: 0, qtd_registros: 0 },
    { grupo: { tecnico: 'B' }, data_referencia: '2026-10-01', valor: 3, qtd_registros: 3 },
    { grupo: { tecnico: 'A' }, data_referencia: '2026-10-01', valor: null, qtd_registros: 0 },
  ])
  const result = buildTimeSeries(points, (group) => group.tecnico)
  assert.deepEqual(
    result.rows.map((row) => row.date),
    ['2026-10-01', '2026-10-02'],
  )
  const a = result.series.find((line) => line.label === 'A')
  const b = result.series.find((line) => line.label === 'B')
  assert.equal(result.rows[0][a.key], null)
  assert.equal(result.rows[0][b.key], 3)
  assert.equal(result.rows[1][a.key], 0)
  assert.equal(result.rows[1][b.key], null)
  const reordered = buildTimeSeries([...points].reverse(), (group) => group.tecnico)
  assert.deepEqual(
    result.series.map((line) => line.id).sort(),
    reordered.series.map((line) => line.id).sort(),
  )
  assert.deepEqual(
    buildTimeSeries([], () => 'Total'),
    { rows: [], series: [] },
  )
})

test('gráfico não aceita grupos repetidos nem intervalos idênticos que tornariam a identidade ambígua', () => {
  const box = visualization('boxplot')
  box.dados.grupos.push(structuredClone(box.dados.grupos[0]))
  assert.equal(decodeVisualization(box, 5), null)
  const histogram = visualization('histograma')
  histogram.dados.intervalos = [
    { inferior: 0, superior: 0, frequencia: 1, inclui_superior: true },
    { inferior: 0, superior: 0, frequencia: 1, inclui_superior: true },
  ]
  histogram.dados.qtd_registros = 2
  assert.equal(decodeVisualization(histogram, 5), null)
})
