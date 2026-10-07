import test from 'node:test'
import assert from 'node:assert/strict'
import { chartScale } from '../src/utils/chartScale.ts'

test('a escala cobre todos os valores com intervalos uniformes e origem zero', () => {
  for (const maximum of [0, 0.013, 0.7, 1, 3, 40, 53, 200, 1500]) {
    const { max, ticks } = chartScale(maximum)
    assert.equal(ticks[0], 0)
    assert.ok(max > 0 && max >= maximum)
    assert.ok(ticks.length >= 2 && ticks.length <= 6)
    const step = ticks[1]
    ticks.forEach((tick, index) => assert.ok(Math.abs(tick - index * step) < 1e-9))
  }
})

test('contagens usam marcações inteiras e dados inválidos são rejeitados', () => {
  for (const maximum of [0, 1, 3, 7, 53]) {
    assert.ok(chartScale(maximum, true).ticks.every(Number.isInteger))
  }
  for (const maximum of [-1, NaN, Infinity]) assert.throws(() => chartScale(maximum))
})
