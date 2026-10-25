import test from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { createHttpClient } from '../src/services/httpClient.ts'
import { createManagementService, PartialSaveError } from '../src/services/apiManagement.ts'
import { validateEvent, validateTechnician, validatePassword } from '../src/utils/apiValidation.ts'

function setup(handler) {
  const calls = []
  const client = createHttpClient('https://api.fixa.test', async (config) => {
    const call = {
      url: config.url,
      method: config.method,
      data: config.data ? JSON.parse(config.data) : undefined,
      auth: config.headers.get('Authorization'),
      params: config.params,
    }
    calls.push(call)
    const { status = 200, data = null } = await handler(call)
    const response = { data, status, statusText: '', config, headers: {} }
    if (status >= 400)
      throw new AxiosError('HTTP error', 'ERR_BAD_RESPONSE', config, null, response)
    return response
  })
  client.setTokens({ token: 'old-token', refreshToken: 'old-refresh' })
  return { client, calls }
}
const user = {
  id: '10',
  name: 'Gestor',
  identifier: 'gestor@fixa.test',
  cnpj: '12345678000195',
  role: 'GESTOR',
}
const unit = {
  id: 5,
  nome: 'Unidade FIXA',
  cnpj: user.cnpj,
  estaAtivo: true,
  logradouro: 'Rua de teste',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '00000000',
}
const tech = {
  id: 22,
  unidadeId: 5,
  nomeCompleto: 'Técnico Teste',
  email: 'tecnico@fixa.test',
  tipoAcesso: { id: 3, nome: 'Técnico' },
  cargo: 'Manutenção',
  dataNascimento: '1990-01-01',
  estaAtivo: true,
}
const shift = { id: 4, unidadeId: 5, nome: 'Diurno', horaInicio: 8, horaFim: 16, estaAtivo: true }
const grade = {
  id: 70,
  usuarioId: 22,
  categoriaProblema: { id: 1, nome: 'Elétrica' },
  nota: 0,
  estaAtivo: true,
}
const input = {
  name: tech.nomeCompleto,
  email: tech.email,
  birthDate: tech.dataNascimento,
  jobTitle: tech.cargo,
  phone: '',
  specialty: '',
  shift: '',
  shiftId: '4',
  shiftIds: ['4'],
  password: 'segredo123',
  status: 'Ativo',
}

test('HTTP envia Bearer somente nas chamadas autenticadas e normaliza os erros do servidor', async () => {
  const { client, calls } = setup((call) =>
    call.url === '/invalid'
      ? {
          status: 400,
          data: { erro: 'Dados inválidos', campos: { nomeCompleto: 'Nome obrigatório' } },
        }
      : { data: {} },
  )
  await client.request('/private')
  await client.request('/auth/login', { method: 'POST', anonymous: true, data: { senha: 'teste' } })
  assert.equal(calls[0].auth, 'Bearer old-token')
  assert.equal(calls[1].auth, undefined)
  await assert.rejects(client.request('/invalid'), /Nome obrigatório/)
  await assert.rejects(createHttpClient().request('/private'), /VITE_API_BASE_URL/)
})
test('401 simultâneos usam uma única renovação e repetem as chamadas com o token rotacionado', async () => {
  let refreshes = 0
  const { client, calls } = setup(async (call) => {
    if (call.url === '/auth/refresh') {
      refreshes++
      await new Promise((resolve) => setTimeout(resolve, 10))
      assert.deepEqual(call.data, { refreshToken: 'old-refresh' })
      return { data: { token: 'new-token', refreshToken: 'new-refresh' } }
    }
    return call.auth === 'Bearer new-token' ? { data: { ok: true } } : { status: 401 }
  })
  const responses = await Promise.all([client.request('/a'), client.request('/b')])
  assert.ok(responses.every((item) => item.ok))
  assert.equal(refreshes, 1)
  assert.equal(calls.filter((call) => call.auth === 'Bearer new-token').length, 2)
  assert.equal(client.getTokens().refreshToken, 'new-refresh')
})
test('403 não renova a sessão; refresh inválido encerra; logout invalida respostas pendentes', async () => {
  const denied = setup(() => ({ status: 403 }))
  await assert.rejects(denied.client.request('/private'), /permissão/)
  assert.equal(denied.calls.length, 1)
  assert.ok(denied.client.getTokens())
  const expired = setup(() => ({ status: 401 }))
  let notifications = 0
  expired.client.onExpired(() => notifications++)
  await assert.rejects(expired.client.request('/private'))
  assert.equal(expired.client.getTokens(), null)
  assert.equal(notifications, 1)
  let resolve
  const pending = setup(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const result = pending.client.request('/slow')
  await new Promise((done) => setImmediate(done))
  pending.client.clear()
  resolve({ data: { oldSession: true } })
  await assert.rejects(result, /sessão foi encerrada/)
})
test('técnicos usam filtros da unidade, enums objeto e notas zero, sem inventar especialidade', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades') throw Error('GESTOR não pode consultar unidades')
    if (call.url === '/api/v1/usuarios') return { data: [tech] }
    if (call.url === '/api/v1/turnos') return { data: [shift] }
    if (call.url.endsWith('/turnos')) return { data: [{ id: 8, turnoId: 4, estaAtivo: true }] }
    if (call.url === '/api/v1/aptidoes') return { data: [grade] }
    throw Error(`Endpoint inesperado: ${call.url}`)
  })
  const service = createManagementService(client, () => user)
  const items = await service.listTechnicians()
  assert.equal(items[0].assessedSpecialty, 'Elétrica')
  assert.equal(items[0].shift, '08:00 - 16:00')
  assert.equal(items[0].phone, '')
  assert.deepEqual(calls.find((call) => call.url === '/api/v1/usuarios').params, {
    tipoAcesso: 'TECNICO',
  })
  const skills = await service.listTechnicianCompetencies('22')
  assert.equal(skills[0].rating, 0)
  assert.equal(skills[1].rating, null)
})
test('remover e restaurar avaliação desativa/reativa o registro existente sem duplicar categoria', async () => {
  let current = { ...grade }
  const { client, calls } = setup((call) => {
    if (call.method === 'get') return { data: [current] }
    if (call.url.endsWith('/desativar')) {
      current = { ...current, estaAtivo: false }
      return { data: current }
    }
    current = { ...current, ...call.data }
    return { data: current }
  })
  const service = createManagementService(client, () => user)
  assert.equal(
    (await service.saveTechnicianCompetency('22', { competencyId: 1, rating: null })).rating,
    null,
  )
  assert.equal(
    (await service.saveTechnicianCompetency('22', { competencyId: 1, rating: 10 })).rating,
    10,
  )
  assert.equal(calls.filter((call) => call.method === 'post').length, 0)
  assert.ok(
    calls.some(
      (call) => call.url === '/api/v1/aptidoes/70' && call.data.nota === 10 && call.data.estaAtivo,
    ),
  )
  const before = calls.length
  await assert.rejects(service.saveTechnician(input, undefined, [{ competencyId: 1, rating: 11 }]))
  assert.equal(calls.length, before)
})
test('salvamento parcial revela o ID e permite concluir sem criar outro técnico', async () => {
  let fail = true
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades') throw Error('GESTOR não pode consultar unidades')
    if (call.url === '/api/v1/turnos') return { data: [shift] }
    if (call.url === '/api/v1/usuarios' || call.url === '/api/v1/usuarios/22') return { data: tech }
    if (call.url.endsWith('/turnos')) return { data: [] }
    if (call.url === '/api/v1/turnos/4/usuarios/22') {
      if (fail) {
        fail = false
        return { status: 500 }
      }
      return { data: {} }
    }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error(`Endpoint inesperado: ${call.url}`)
  })
  const service = createManagementService(client, () => user)
  await assert.rejects(
    service.saveTechnician(input),
    (error) => error instanceof PartialSaveError && error.resourceId === '22',
  )
  await service.saveTechnician({ ...input, password: undefined }, '22')
  const creates = calls.filter((call) => call.url === '/api/v1/usuarios' && call.method === 'post')
  assert.equal(creates.length, 1)
  assert.equal(creates[0].data.senha, input.password)
  assert.equal(creates[0].data.tipoAcesso, 'TECNICO')
  assert.equal(
    'senha' in
      calls.find((call) => call.url === '/api/v1/usuarios/22' && call.method === 'patch').data,
    false,
  )
})
test('eventos preservam data/hora locais, local real e responsável; desativar técnico não usa DELETE', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/eventos') return { data: { ...call.data, id: 80 } }
    return { data: {} }
  })
  const service = createManagementService(client, () => user)
  const event = await service.saveEvent({
    title: 'Entrega',
    date: '2026-10-25',
    time: '23:00',
    endDate: '2026-10-26',
    endTime: '01:00',
    description: 'Evento de teste',
    location: 'Auditório',
    locationId: '6',
    observation: '',
    technicianId: '',
  })
  assert.equal(event.date, '2026-10-25')
  assert.equal(event.endDate, '2026-10-26')
  assert.equal(calls[0].data.usuarioId, 10)
  assert.equal(calls[0].data.localEnderecoId, 6)
  assert.equal(calls[0].data.dataHoraInicio, '2026-10-25T23:00:00')
  await service.removeTechnician('22')
  assert.equal(calls.at(-1).url, '/api/v1/usuarios/22/desativar')
  assert.equal(calls.at(-1).method, 'patch')
})
test('perfil envia apenas campos que a API grava; validação exige cargo, turno e local', async () => {
  const { client, calls } = setup((call) =>
    call.url === '/api/v1/unidades'
      ? { data: [unit] }
      : {
          data: {
            nomeCompleto: 'Nome Real',
            email: 'nome@fixa.test',
            dataNascimento: '1990-01-01',
          },
        },
  )
  const service = createManagementService(client, () => user)
  const profile = await service.getProfile()
  await service.saveProfile({ ...profile, phone: '11999999999', company: 'Não gravar' })
  assert.deepEqual(calls.find((call) => call.method === 'patch').data, {
    nomeCompleto: 'Nome Real',
    email: 'nome@fixa.test',
    dataNascimento: '1990-01-01',
  })
  assert.deepEqual(validateTechnician(input), {})
  assert.ok(validateTechnician({ ...input, shiftId: '' }).shiftId)
  assert.ok(
    validateEvent({
      title: 'Teste',
      description: '',
      location: '',
      observation: '',
      date: '2026-10-25',
      time: '09:00',
      endTime: '10:00',
      technicianId: '',
    }).locationId,
  )
  assert.ok(validatePassword('1234567'))
  assert.equal(validatePassword('12345678'), undefined)
})

test('refresh pendente não restaura tokens após logout; indisponibilidade temporária preserva a sessão', async () => {
  let finishRefresh
  const pending = setup((call) =>
    call.url === '/auth/refresh'
      ? new Promise((resolve) => {
          finishRefresh = resolve
        })
      : { status: 401 },
  )
  const response = pending.client.request('/protected')
  await new Promise((resolve) => setImmediate(resolve))
  pending.client.clear()
  pending.client.setTokens({ token: 'outra-sessao', refreshToken: 'outro-refresh' })
  finishRefresh({ data: { token: 'antigo', refreshToken: 'antigo-refresh' } })
  await assert.rejects(response)
  assert.equal(pending.client.getTokens().token, 'outra-sessao')
  const temporary = setup((call) => {
    if (call.url === '/auth/refresh') throw new AxiosError('offline', 'ERR_NETWORK')
    return { status: 401 }
  })
  await assert.rejects(temporary.client.request('/protected'), /conectar/)
  assert.equal(temporary.client.getTokens().token, 'old-token')
})

test('administrador usa a unidade do CNPJ; gestor nunca depende do endpoint exclusivo de administrador', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return { data: [unit, { ...unit, id: 99, cnpj: '99999999000199' }] }
    if (call.url === '/api/v1/turnos') return { data: [shift] }
    throw Error('Endpoint inesperado')
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  assert.equal((await service.listShifts())[0].id, '4')
  assert.deepEqual(calls.at(-1).params, { unidadeId: 5 })
  const restricted = setup(() => ({ status: 403 }))
  await assert.rejects(createManagementService(restricted.client, () => user).listShifts())
  assert.equal(restricted.calls[0].url, '/api/v1/turnos')
})
