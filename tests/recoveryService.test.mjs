import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEMO_RECOVERY_CODE,
  requestRecovery,
  resetPassword,
  verifyRecoveryCode,
} from '../src/services/recoveryService.ts'

test('recuperação demonstrativa valida e-mail, código e política provisória da senha', async () => {
  await assert.rejects(requestRecovery('inválido'), /e-mail válido/)
  const challenge = await requestRecovery(' demo@fixa.test ')
  assert.equal(challenge.email, 'demo@fixa.test')
  await assert.rejects(verifyRecoveryCode(challenge, '000000'), /Código inválido/)
  await verifyRecoveryCode(challenge, DEMO_RECOVERY_CODE)
  await assert.rejects(resetPassword(challenge, 'exemplo!'), /maiúscula/)
  await resetPassword(challenge, 'Exemplo!')
  assert.equal('password' in challenge, false)
})
