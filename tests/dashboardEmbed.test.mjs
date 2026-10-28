import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dashboardEmbedURL,
  dashboardViewURL,
  dashboardWidgetURL,
  dashboardFilteredWidgetURL,
  dashboardUnitSelectionURL,
} from '../src/utils/dashboardEmbed.ts'
test('URL de embed permanece no iframe e nova aba usa visualização publicada do Databricks', () => {
  const embed =
    'https://dbc-example.cloud.databricks.com/embed/dashboardsv3/0123456789abcdef?o=123&f_page~filter=teste#pagina'
  assert.equal(dashboardEmbedURL(embed), embed)
  assert.equal(
    dashboardViewURL(embed),
    'https://dbc-example.cloud.databricks.com/dashboardsv3/0123456789abcdef/published?o=123&f_page~filter=teste#pagina',
  )
  assert.equal(
    dashboardViewURL('https://adb-example.azuredatabricks.net/embed/dashboardsv3/abc/'),
    'https://adb-example.azuredatabricks.net/dashboardsv3/abc/published',
  )
})
test('visualização rejeita URLs inseguras e preserva outras páginas sem alterar domínio', () => {
  for (const url of [
    undefined,
    '',
    'javascript:alert(1)',
    'https://user:password@dbc-test.cloud.databricks.com/embed/dashboardsv3/abc',
    'https://dbc-test.cloud.databricks.com/embed/dashboardsv3/abc?token=secret',
  ])
    assert.equal(dashboardViewURL(url), null)
  const published = 'https://dbc-example.cloud.databricks.com/dashboardsv3/abc/published?o=123'
  assert.equal(dashboardViewURL(published), published)
  const another = 'https://example.com/embed/dashboardsv3/abc'
  assert.equal(dashboardViewURL(another), another)
})

test('Home incorpora somente o widget pedido e preserva workspace, filtros e visualização publicada', () => {
  const embed =
    'https://dbc-example.cloud.databricks.com/embed/dashboardsv3/abc?o=123&f_page~filter=unidade&fullscreenWidget=antigo~grafico#pagina'
  const widget = 'a5185eb0~solicitacoes-por-periodo'
  const result = dashboardWidgetURL(embed, widget)
  const url = new URL(result)
  assert.equal(url.hostname, 'dbc-example.cloud.databricks.com')
  assert.equal(url.pathname, '/embed/dashboardsv3/abc')
  assert.equal(url.searchParams.get('o'), '123')
  assert.equal(url.searchParams.get('f_page~filter'), 'unidade')
  assert.equal(url.searchParams.get('fullscreenWidget'), widget)
  assert.equal(url.searchParams.getAll('fullscreenWidget').length, 1)
  assert.equal(url.hash, '#pagina')
  const published = new URL(dashboardViewURL(result))
  assert.equal(published.pathname, '/dashboardsv3/abc/published')
  assert.equal(published.searchParams.get('fullscreenWidget'), widget)
  assert.equal(dashboardEmbedURL(embed), embed)
})

test('widget ausente, identificador inválido ou URL insegura não viram iframe da Home', () => {
  const embed = 'https://dbc-example.cloud.databricks.com/embed/dashboardsv3/abc?o=123'
  for (const widget of [
    undefined,
    '',
    'pagina',
    'pagina~grafico~outro',
    '../pagina~grafico',
    'pagina~grafico?token=segredo',
  ])
    assert.equal(dashboardWidgetURL(embed, widget), null)
  for (const url of [
    undefined,
    'http://dbc-example.cloud.databricks.com/embed/dashboardsv3/abc',
    'https://example.com/embed/dashboardsv3/abc',
    'https://dbc-example.cloud.databricks.com/dashboardsv3/abc/published',
    embed + '&token=segredo',
  ])
    assert.equal(dashboardWidgetURL(url, 'pagina~grafico'), null)
  assert.equal(
    new URL(
      dashboardWidgetURL(
        'https://adb-example.azuredatabricks.net/embed/dashboardsv3/abc',
        ' page_1~chart-2 ',
      ),
    ).searchParams.get('fullscreenWidget'),
    'page_1~chart-2',
  )
})

test('ficha aplica o filtro string real sem duplicar filtros antigos, nem alterar outras telas', () => {
  const base =
    'https://dbc-example.cloud.databricks.com/embed/dashboardsv3/abc?o=123&f_page~technician=antigo&f_page~technician.i=17&f_page~technician.s=anterior&f_unit~unit.s=Unidade#pagina'
  const filter = 'f_page~technician.s'
  const name = 'Otávia & Silva + Santos'
  const url = new URL(dashboardFilteredWidgetURL(base, 'page~chart', { [filter]: name }))
  assert.equal(url.pathname, '/embed/dashboardsv3/abc/pages/page')
  assert.equal(url.searchParams.get(filter), encodeURIComponent(name))
  assert.equal(decodeURIComponent(url.searchParams.get(filter)), name)
  assert.equal(url.searchParams.has('f_page~technician'), false)
  assert.equal(url.searchParams.has('f_page~technician.i'), false)
  assert.equal(url.searchParams.getAll(filter).length, 1)
  assert.equal(url.searchParams.get('f_unit~unit.s'), 'Unidade')
  assert.equal(url.searchParams.get('fullscreenWidget'), 'page~chart')
  assert.equal(url.searchParams.get('o'), '123')
  assert.equal(url.hash, '#pagina')
  const next = new URL(
    dashboardFilteredWidgetURL(base, 'page~chart', { [filter]: 'Paulo Henriques' }),
  )
  assert.equal(decodeURIComponent(next.searchParams.get(filter)), 'Paulo Henriques')
  assert.equal(decodeURIComponent(url.searchParams.get(filter)), name)
  assert.equal(dashboardEmbedURL(base), base)
  assert.equal(
    new URL(dashboardViewURL(url.href)).pathname,
    '/dashboardsv3/abc/published/pages/page',
  )
  assert.equal(
    new URL(dashboardViewURL(url.href)).searchParams.get(filter),
    encodeURIComponent(name),
  )
})

test('filtro ausente ou inválido nunca produz iframe geral na ficha individual', () => {
  const base = 'https://dbc-example.cloud.databricks.com/embed/dashboardsv3/abc?o=123'
  for (const filters of [
    {},
    { '': 'Paulo' },
    { 'f_page~technician.s': '' },
    { 'f_page~technician.s': '   ' },
    { 'f_page~technician.s': 'x'.repeat(201) },
    { 'f_page~technician.s': 'Nome\ninválido' },
    { 'f_page~technician.s': '\ud800' },
    { 'f_page~technician.i': 'Paulo' },
    { 'f_page~technician': 'Paulo' },
    { 'f_page~technician.s&token': 'Paulo' },
  ])
    assert.equal(dashboardFilteredWidgetURL(base, 'page~chart', filters), null)
  for (const url of [
    undefined,
    '',
    'https://example.com/embed/dashboardsv3/abc',
    base + '&token=segredo',
  ])
    assert.equal(
      dashboardFilteredWidgetURL(url, 'page~chart', { 'f_page~technician.s': 'Paulo' }),
      null,
    )
  assert.equal(
    dashboardFilteredWidgetURL(base, undefined, { 'f_page~technician.s': 'Paulo' }),
    null,
  )
})

const unitFilters = ['f_4c5527fc~unidade1', 'f_38ad7c54~unidade', 'f_37645ca6~unidade.s']
test('filtros de unidade recebidos mantêm suas codificações e substituem somente a seleção anterior', () => {
  const base =
    'https://dbc-test.cloud.databricks.com/embed/dashboardsv3/abc?o=123&f_4c5527fc~unidade1=Unidade+11&f_37645ca6~unidade.i=99&f_37645ca6~unidade.s=Unidade%252011&f_page~tecnico.s=Ana'
  const url = new URL(dashboardUnitSelectionURL(base, 'Unidade 7', unitFilters))
  assert.equal(url.searchParams.get(unitFilters[0]), 'Unidade 7')
  assert.equal(url.searchParams.get(unitFilters[1]), 'Unidade 7')
  assert.equal(url.searchParams.get(unitFilters[2]), 'Unidade%207')
  assert.equal(decodeURIComponent(url.searchParams.get(unitFilters[2])), 'Unidade 7')
  assert.equal(url.searchParams.has('f_37645ca6~unidade.i'), false)
  assert.equal(url.searchParams.get('f_page~tecnico.s'), 'Ana')
  assert.equal(url.searchParams.get('o'), '123')
  assert.equal(new URL(base).searchParams.get(unitFilters[0]), 'Unidade 11')
  const widget = new URL(dashboardWidgetURL(url.href, 'page~chart'))
  assert.equal(widget.searchParams.get(unitFilters[0]), 'Unidade 7')
  const technician = new URL(
    dashboardFilteredWidgetURL(url.href, 'page~chart', { 'f_page~tecnico.s': 'Nome completo' }),
  )
  assert.equal(technician.searchParams.get(unitFilters[2]), 'Unidade%207')
})

test('seleção de unidade incompleta ou inválida não gera URL geral como fallback', () => {
  const base = 'https://dbc-test.cloud.databricks.com/embed/dashboardsv3/abc?o=123'
  for (const selection of ['', '   ', 'x'.repeat(201), 'a\nb', '\ud800'])
    assert.equal(dashboardUnitSelectionURL(base, selection, unitFilters), null)
  for (const filters of [
    [],
    [''],
    ['unitId'],
    ['f_page~unidade.s&token'],
    [unitFilters[0], unitFilters[0]],
    ['f_page~unidade', 'f_page~unidade.s'],
  ])
    assert.equal(dashboardUnitSelectionURL(base, 'Unidade 7', filters), null)
  for (const url of [
    undefined,
    base + '&token=secret',
    'https://example.com/embed/dashboardsv3/abc',
  ])
    assert.equal(dashboardUnitSelectionURL(url, 'Unidade 7', unitFilters), null)
})
