import assert from 'node:assert/strict'
import test from 'node:test'
import { readRecoveryChallenge, maskRecoveryEmail } from '../src/utils/recovery.ts'

test('atalho da recuperação aceita somente desafios mock válidos e remove campos extras', () => {
  for (const state of [
    null,
    {},
    { challenge: null },
    { challenge: { id: 'demo-recovery', email: '123456789' } },
    { challenge: { id: 'outro', email: 'demo@fixa.test' } },
  ]) {
    assert.equal(readRecoveryChallenge(state), null)
  }
  assert.deepEqual(
    readRecoveryChallenge({
      challenge: { id: 'demo-recovery', email: ' demo@fixa.test ', ignored: true },
    }),
    { id: 'demo-recovery', email: 'demo@fixa.test' },
  )
})
test('e-mail mostrado na validação preserva domínio e oculta parte do nome', () => {
  assert.equal(maskRecoveryEmail('rapha@fixa.test'), 'rap***@fixa.test')
  assert.equal(maskRecoveryEmail('a@fixa.test'), 'a***@fixa.test')
  assert.equal(maskRecoveryEmail('não-email'), '')
})
