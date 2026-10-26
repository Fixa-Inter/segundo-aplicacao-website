import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dashboardEmbedURL,
  dashboardViewURL,
  dashboardWidgetURL,
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
