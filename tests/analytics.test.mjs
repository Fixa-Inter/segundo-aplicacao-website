import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeHours, buildHistogram } from '../src/utils/analytics.ts'

test('quartis interpolados, média e extremos preservam a amostra original', () => {
  const values = [10, 2, 4, 6]
  assert.deepEqual(summarizeHours(values), {
    min: 2,
    q1: 3.5,
    median: 5,
    q3: 7,
    max: 10,
    mean: 5.5,
  })
  assert.deepEqual(values, [10, 2, 4, 6])
  assert.equal(summarizeHours([]), null)
  assert.deepEqual(summarizeHours([3]), { min: 3, q1: 3, median: 3, q3: 3, max: 3, mean: 3 })
  assert.throws(() => summarizeHours([NaN]), /finito/)
  assert.throws(() => summarizeHours([-1]), /não negativo/)
})

test('histograma conta valores fracionários e extremos em intervalos sem sobreposição', () => {
  const values = [0, 1.9, 2, 4, 6, 8, 10]
  const bins = buildHistogram(values)
  assert.deepEqual(
    bins.map((bin) => bin.count),
    [2, 1, 1, 1, 2],
  )
  assert.equal(
    bins.reduce((sum, bin) => sum + bin.count, 0),
    values.length,
  )
  assert.equal(buildHistogram([12.5]).at(-1).to, 15)
  assert.deepEqual(buildHistogram([]), [])
})
