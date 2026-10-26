import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardEmbedURL, dashboardViewURL } from '../src/utils/dashboardEmbed.ts'
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
