import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getProfile,
  listTechnicians,
  removeTechnician,
  saveProfile,
  saveTechnician,
} from '../src/services/managementService.ts'

const technician = {
  name: 'Técnico de teste',
  birthDate: '1995-04-18',
  email: 'teste@fixa.test',
  phone: '(11) 99999-1234',
  specialty: 'Elétrica',
  shift: '08:00 - 16:00',
  status: 'Ativo',
}

test('cadastro impõe tipo técnico, herda endereço e descarta campos indevidos', async () => {
  const manager = await getProfile()
  await saveProfile({ ...manager, address: 'Rua do gestor de teste', number: '42' })
  const saved = await saveTechnician({
    ...technician,
    accessType: 'ADMINISTRADOR',
    address: 'Endereço indevido',
    password: 'Exemplo!',
  })
  assert.equal(saved.accessType, 'TÉCNICO')
  assert.equal(saved.address, 'Rua do gestor de teste')
  assert.equal(saved.number, '42')
  assert.equal(saved.city, manager.city)
  assert.equal('password' in saved, false)

  saved.address = 'Alteração na cópia retornada'
  const stored = (await listTechnicians()).find((item) => item.id === saved.id)
  assert.equal(stored.address, 'Rua do gestor de teste')
  assert.equal('password' in stored, false)
  await removeTechnician(saved.id)
})

test('service rejeita cadastro inválido, e-mail duplicado e exclusão com evento vinculado', async () => {
  await assert.rejects(saveTechnician({ ...technician, phone: '----------' }), /telefone com DDD/)
  await assert.rejects(saveTechnician({ ...technician, email: 'ana@fixa.test' }), /Já existe/)
  await assert.rejects(saveTechnician({ ...technician, email: ' ANA@fixa.test ' }), /Já existe/)
  await assert.rejects(removeTechnician('t-1'), /eventos vinculados/)
})
