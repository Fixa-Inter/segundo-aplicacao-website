import test from 'node:test'
import assert from 'node:assert/strict'
import { createManagementService } from '../src/services/apiManagement.ts'
import { shiftSeconds, validateInstitution } from '../src/utils/institution.ts'

const user = { id: '10', role: 'GESTOR', cnpj: '12345678000195' }
const units = [
  { id: 5, instituicaoId: 8, nome: 'Centro', cnpj: user.cnpj, estaAtivo: true },
  { id: 6, instituicaoId: 8, nome: 'Bela Vista', cnpj: '12345678000276', estaAtivo: true },
  { id: 7, instituicaoId: 9, nome: 'Outra instituição', cnpj: '99999999000199', estaAtivo: true },
]
const local = {
  id: 20,
  unidadeId: 5,
  nome: 'Laboratório',
  descricao: 'Sala de informática',
  tipoLocalEndereco: { id: 2, nome: 'Laboratório' },
  estaAtivo: true,
}
const shift = {
  id: 50,
  unidadeId: 5,
  nome: 'Noturno',
  horaInicio: 79200,
  horaFim: 21600,
  atravessaMeiaNoite: true,
  estaAtivo: true,
}
const input = {
  unitId: '5',
  name: ' Noturno ',
  startTime: '22:00',
  endTime: '06:00',
  description: ' Sala de teste ',
  locationType: 'SALA_AULA',
}
function setup(role = 'GESTOR') {
  const calls = []
  const client = {
    request: async (url, options = {}) => {
      calls.push({ url, ...options })
      if (url === '/api/v1/unidades') {
        assert.equal(role, 'ADMINISTRADOR')
        return units
      }
      if (url === '/api/v1/perfil') return { id: 10, unidadeId: 5 }
      if (url === '/api/v1/usuarios/10') return { id: 10, unidadeId: 5 }
      if (url === '/api/v1/locais/20') return local
      if (url === '/api/v1/locais/99') return { ...local, id: 99, unidadeId: 7 }
      if (options.method) return null
      if (url === '/api/v1/locais')
        return [local, { ...local, id: 30, unidadeId: 6 }, { ...local, id: 99, unidadeId: 7 }]
      if (url === '/api/v1/turnos')
        return [shift, { ...shift, id: 60, unidadeId: 6 }, { ...shift, id: 99, unidadeId: 7 }]
      throw Error('Chamada inesperada: ' + url)
    },
  }
  return { service: createManagementService(client, () => ({ ...user, role })), calls }
}
test('valida locais e horários inclusive meia-noite, segundos e 24:00 sem aceitar durações nulas', () => {
  assert.deepEqual(validateInstitution(input, 'locations'), {})
  assert.deepEqual(validateInstitution(input, 'shifts'), {})
  assert.equal(shiftSeconds('22:15:30'), 80130)
  assert.equal(shiftSeconds('24:00'), 86400)
  for (const time of ['25:00', '12:60', '-1:00', '10:00x', ''])
    assert.ok(Number.isNaN(shiftSeconds(time)))
  assert.ok(
    validateInstitution({ ...input, startTime: '08:00', endTime: '08:00' }, 'shifts').endTime,
  )
  assert.ok(validateInstitution({ ...input, locationType: 'BANHEIRO' }, 'locations').locationType)
  assert.ok(validateInstitution({ ...input, description: ' ' }, 'locations').description)
})
test('gestor carrega apenas sua unidade e RH apenas unidades da própria instituição', async () => {
  for (const role of ['GESTOR', 'ADMINISTRADOR']) {
    const { service, calls } = setup(role)
    const data = await service.loadInstitution()
    assert.deepEqual(
      data.units.map((unit) => unit.id),
      role === 'GESTOR' ? ['5'] : ['5', '6'],
    )
    assert.equal(
      data.locations.some((item) => item.unitId === '7'),
      false,
    )
    assert.equal(
      data.shifts.some((item) => item.unitId === '7'),
      false,
    )
    assert.equal(data.locations[0].locationType, 'LABORATORIO')
    assert.equal(data.shifts[0].startTime, '22:00')
    assert.equal(
      calls.some((call) => call.params?.unidadeId === 7),
      false,
    )
  }
})
test('cadastro e edição usam contratos reais e convertem horários em segundos', async () => {
  const { service, calls } = setup()
  await service.saveInstitutionEntry('shifts', input)
  assert.deepEqual(calls.at(-1), {
    url: '/api/v1/turnos',
    method: 'POST',
    data: {
      unidadeId: 5,
      nome: 'Noturno',
      horaInicio: 79200,
      horaFim: 21600,
      atravessaMeiaNoite: true,
    },
  })
  await service.saveInstitutionEntry('locations', input, '20')
  assert.deepEqual(calls.at(-1), {
    url: '/api/v1/locais/20',
    method: 'PATCH',
    data: {
      unidadeId: 5,
      nome: 'Noturno',
      tipoLocalEndereco: 'SALA_AULA',
      descricao: 'Sala de teste',
    },
  })
  await service.setInstitutionEntryActive('locations', '20', false)
  assert.equal(calls.at(-1).url, '/api/v1/locais/20/desativar')
  await service.setInstitutionEntryActive('locations', '20', true)
  assert.equal(calls.at(-1).url, '/api/v1/locais/20/ativar')
})
test('não grava em outra instituição/unidade e bloqueia perfis sem permissão', async () => {
  const { service, calls } = setup()
  await assert.rejects(
    service.saveInstitutionEntry('locations', { ...input, unitId: '6' }),
    /instituição/,
  )
  await assert.rejects(service.saveInstitutionEntry('locations', input, '99'), /instituição/)
  await assert.rejects(service.setInstitutionEntryActive('locations', '99', false), /instituição/)
  assert.equal(
    calls.some((call) => call.method),
    false,
  )
  const denied = setup('TÉCNICO')
  await assert.rejects(denied.service.loadInstitution(), /permissão/)
  assert.equal(denied.calls.length, 0)
})

test('gestor não usa rota exclusiva do RH e rejeita um perfil sem unidade válida', async () => {
  for (const profile of [{ id: 99, unidadeId: 5 }, { id: 10 }, { id: 10, unidadeId: 0 }]) {
    const calls = []
    const client = {
      request: async (url) => {
        calls.push(url)
        return profile
      },
    }
    const service = createManagementService(client, () => user)
    await assert.rejects(service.loadInstitution(), /identificar a unidade/)
    assert.deepEqual(calls, ['/api/v1/perfil'])
  }
})
