import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCnpj, validateLoginFields } from '../src/utils/validation.ts'
import { loginMock } from '../src/mocks/services/authService.ts'

const credentials = { cnpj: '12.345.678/0001-95', email: 'demo@fixa.test', password: 'demo1234' }

test('login exige os três campos e devolve erros específicos por campo', async () => {
  assert.deepEqual(Object.keys(validateLoginFields({ cnpj: '', email: '', password: '' })), [
    'cnpj',
    'email',
    'password',
  ])
  assert.deepEqual(validateLoginFields(credentials), {})
  assert.ok(validateLoginFields({ ...credentials, email: 'invalido' }).email)
  assert.ok(validateLoginFields({ ...credentials, cnpj: '123' }).cnpj)
  assert.ok(validateLoginFields({ ...credentials, password: 'a'.repeat(129) }).password)
  await assert.rejects(loginMock({ ...credentials, cnpj: '' }), /CNPJ/)
})

test('CNPJ aceita formato numérico ou alfanumérico com e sem máscara; senha não retorna na sessão', async () => {
  for (const cnpj of ['12345678000195', credentials.cnpj, '12.ABC.345/01DE-35', '12abc34501de35'])
    assert.equal(validateCnpj(cnpj), null)
  for (const cnpj of ['123456789012AB', '12.345..678/0001-95', '1234567890123', '<12345678000195>'])
    assert.ok(validateCnpj(cnpj))
  const user = await loginMock({
    ...credentials,
    cnpj: '12.abc.345/01de-35',
    email: ' demo@fixa.test ',
  })
  assert.equal(user.cnpj, '12ABC34501DE35')
  assert.equal(user.identifier, 'demo@fixa.test')
  assert.equal('password' in user, false)
})
