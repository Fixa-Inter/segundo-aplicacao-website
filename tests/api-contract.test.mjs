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
      signal: config.signal,
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
const shift = {
  id: 4,
  unidadeId: 5,
  nome: 'Diurno',
  horaInicio: 28800,
  horaFim: 57600,
  estaAtivo: true,
}
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
  assert.equal(items[0].shift, 'Diurno · 08:00 – 16:00')
  assert.equal(items[0].phone, '')
  assert.deepEqual(calls.find((call) => call.url === '/api/v1/usuarios').params, {
    tipoAcesso: 'TECNICO',
  })
  const skills = await service.listTechnicianCompetencies('22')
  assert.equal(skills[0].rating, 0)
  assert.equal(skills[1].rating, null)
})
test('RH lista gestores e técnicos de todas as unidades da instituição vinculada à identidade real', async () => {
  const institutionUnits = [5, 6, 7].map((id) => ({
    ...unit,
    id,
    instituicaoId: 8,
    nome: `Unidade ${id}`,
    cnpj: id === 5 ? unit.cnpj : `${id}`.repeat(14),
    logradouro: `Rua da unidade ${id}`,
  }))
  const foreignUnit = { ...unit, id: 99, instituicaoId: 9, cnpj: '99999999000199' }
  const managers = institutionUnits.map((item) => ({
    ...tech,
    id: 100 + item.id,
    unidadeId: item.id,
    nomeCompleto: `Gestor ${item.id}`,
    tipoAcesso: item.id === 5 ? 'GESTOR' : { id: 2, nome: 'Gestor' },
    estaAtivo: item.id !== 6,
  }))
  const technicians = institutionUnits.flatMap((item) =>
    [0, 1].map((index) => ({
      ...tech,
      id: 200 + item.id * 10 + index,
      unidadeId: item.id,
      tipoAcesso: index ? 'TECNICO' : { id: 3, nome: 'Técnico' },
    })),
  )
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [...institutionUnits, foreignUnit, { ...foreignUnit, id: 98, instituicaoId: 10 }],
      }
    if (call.url === '/api/v1/usuarios/10')
      return { data: { ...tech, id: 10, unidadeId: 5, tipoAcesso: 'ADMINISTRADOR' } }
    if (call.url === '/api/v1/usuarios') {
      assert.deepEqual(Object.keys(call.params), ['unidadeId'])
      assert.ok(institutionUnits.some((item) => item.id === call.params.unidadeId))
      return {
        data: [
          ...managers.filter((item) => item.unidadeId === call.params.unidadeId),
          ...technicians.filter((item) => item.unidadeId === call.params.unidadeId),
          { ...tech, id: 990, unidadeId: call.params.unidadeId, tipoAcesso: 'ADMINISTRADOR' },
          {
            ...tech,
            id: 991,
            unidadeId: call.params.unidadeId,
            tipoAcesso: { id: 4, nome: 'Solicitante' },
          },
          { ...tech, id: 992, unidadeId: call.params.unidadeId, tipoAcesso: 'DESCONHECIDO' },
          { ...tech, id: 993, unidadeId: 99, tipoAcesso: 'GESTOR' },
        ],
      }
    }
    if (call.url === '/api/v1/turnos')
      return {
        data: [{ ...shift, id: call.params.unidadeId * 10, unidadeId: call.params.unidadeId }],
      }
    const linked = call.url.match(/^\/api\/v1\/usuarios\/(\d+)\/turnos$/)
    if (linked) {
      const technician = technicians.find((item) => item.id === Number(linked[1]))
      assert.ok(technician, 'somente técnicos consultam vínculos de turno')
      return { data: [{ id: technician.id, turnoId: technician.unidadeId * 10, estaAtivo: true }] }
    }
    if (call.url === '/api/v1/aptidoes') {
      const technician = technicians.find((item) => String(item.id) === call.params.usuarioId)
      assert.ok(technician, 'somente técnicos consultam aptidões')
      return { data: [{ ...grade, usuarioId: technician.id }] }
    }
    throw Error(`Endpoint inesperado: ${call.url}`)
  })
  const service = createManagementService(client, () => ({
    ...user,
    role: 'ADMINISTRADOR',
    cnpj: foreignUnit.cnpj,
  }))
  const members = await service.listTeamMembers()
  assert.equal(members.length, 9)
  assert.equal(members.filter((item) => item.accessType === 'GESTOR').length, 3)
  assert.equal(members.filter((item) => item.accessType === 'TÉCNICO').length, 6)
  for (const member of members) {
    const memberUnit = institutionUnits.find((item) => String(item.id) === member.unitId)
    assert.ok(memberUnit)
    assert.equal(member.unitName, memberUnit.nome)
    assert.equal(member.address, memberUnit.logradouro)
    if (member.accessType === 'GESTOR') {
      assert.equal(member.shift, '')
      assert.equal(member.assessedSpecialty, null)
    } else {
      assert.equal(member.shift, 'Diurno · 08:00 – 16:00')
      assert.equal(member.assessedSpecialty, 'Elétrica')
    }
  }
  assert.equal(members.find((item) => item.id === '106').status, 'Inativo')
  assert.deepEqual(
    calls
      .filter((call) => call.url === '/api/v1/usuarios')
      .map((call) => call.params.unidadeId)
      .sort(),
    [5, 6, 7],
  )
  assert.equal(calls.filter((call) => call.url === '/api/v1/aptidoes').length, 6)
})

test('equipe contendo apenas gestores não consulta turnos nem aptidões', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades') return { data: [{ ...unit, instituicaoId: 8 }] }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/usuarios')
      return {
        data: [
          { ...tech, id: 11, tipoAcesso: 'GESTOR' },
          { ...tech, id: 12, tipoAcesso: { id: 2, nome: 'Gestor' } },
        ],
      }
    throw Error(`Gestores não devem consultar dados técnicos: ${call.url}`)
  })
  const members = await createManagementService(client, () => ({
    ...user,
    role: 'ADMINISTRADOR',
  })).listTeamMembers()
  assert.deepEqual(
    members.map((item) => item.accessType),
    ['GESTOR', 'GESTOR'],
  )
  assert.equal(calls.length, 3)
})

test('RH falha sem consultar equipe quando a instituição ou a identidade não pode ser confirmada', async () => {
  const cases = [
    ...[undefined, null, 0, -1, 1.5, '8'].map((instituicaoId) => ({
      units: [{ ...unit, instituicaoId }],
      identity: { ...tech, id: 10 },
    })),
    { units: [{ ...unit, instituicaoId: 8 }], identity: { ...tech, id: 10, unidadeId: 99 } },
    { units: [{ ...unit, instituicaoId: 8 }], identity: { ...tech, id: 11 } },
  ]
  for (const scenario of cases) {
    const { client, calls } = setup((call) => {
      if (call.url === '/api/v1/unidades') return { data: scenario.units }
      if (call.url === '/api/v1/usuarios/10') return { data: scenario.identity }
      throw Error('Uma instituição inválida não pode consultar a equipe')
    })
    const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
    await assert.rejects(service.listTeamMembers(), /identificar a instituição/)
    assert.equal(calls.length, 2)
    assert.equal(
      calls.some((call) => call.url === '/api/v1/usuarios'),
      false,
    )
  }
})

test('listagem de equipe preserva o fluxo de técnicos do gestor sem consultar unidades ou sua identidade', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/usuarios')
      return { data: [tech, { ...tech, id: 11, tipoAcesso: 'GESTOR' }] }
    if (call.url === '/api/v1/turnos') return { data: [shift] }
    if (call.url === '/api/v1/usuarios/22/turnos') return { data: [] }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error(`GESTOR não deve consultar ${call.url}`)
  })
  const service = createManagementService(client, () => user)
  const existing = await service.listTechnicians()
  calls.length = 0
  assert.deepEqual(await service.listTeamMembers(), existing)
  assert.deepEqual(calls.find((call) => call.url === '/api/v1/usuarios').params, {
    tipoAcesso: 'TECNICO',
  })
})

test('RH não amplia o escopo após recusa da API e outros papéis não consultam a equipe', async () => {
  const restricted = setup((call) =>
    call.url === '/api/v1/unidades' ? { status: 403 } : { data: { ...tech, id: 10 } },
  )
  await assert.rejects(
    createManagementService(restricted.client, () => ({
      ...user,
      role: 'ADMINISTRADOR',
    })).listTeamMembers(),
    /permissão/,
  )
  assert.equal(
    restricted.calls.some((call) => call.url === '/api/v1/usuarios'),
    false,
  )
  for (const role of ['SOLICITANTE', 'TÉCNICO']) {
    const denied = setup(() => {
      throw Error('O papel não pode consultar a equipe')
    })
    await assert.rejects(
      createManagementService(denied.client, () => ({ ...user, role })).listTeamMembers(),
      /permissão/,
    )
    assert.equal(denied.calls.length, 0)
  }
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
    service.saveTechnician({ ...input, accessType: 'GESTOR' }),
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

test('administrador usa a unidade da identidade real; gestor nunca depende do endpoint exclusivo de administrador', async () => {
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [
          { ...unit, instituicaoId: 8 },
          { ...unit, id: 99, cnpj: '99999999000199', instituicaoId: 9 },
        ],
      }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
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

test('cadastro inicialmente inativo vincula turno enquanto ativo e termina no estado solicitado', async () => {
  let active = false
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/turnos') return { data: [shift] }
    if (call.url === '/api/v1/usuarios') return { data: { ...tech, estaAtivo: false } }
    if (call.url === '/api/v1/usuarios/22/ativar') {
      active = true
      return { data: { ...tech, estaAtivo: true } }
    }
    if (call.url === '/api/v1/usuarios/22/desativar') {
      active = false
      return { data: { ...tech, estaAtivo: false } }
    }
    if (call.url === '/api/v1/usuarios/22/turnos') return { data: [] }
    if (call.url === '/api/v1/turnos/4/usuarios/22') {
      assert.equal(active, true)
      return { data: {} }
    }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error('Endpoint inesperado: ' + call.url)
  })
  const result = await createManagementService(client, () => user).saveTechnician({
    ...input,
    status: 'Inativo',
  })
  assert.equal(result.status, 'Inativo')
  assert.equal(active, false)
  assert.ok(
    calls.findIndex((call) => call.url.endsWith('/ativar')) <
      calls.findIndex((call) => call.url === '/api/v1/turnos/4/usuarios/22'),
  )
})

test('responsáveis usam nomes reais sem duplicar gestor e respeitam o escopo do servidor', async () => {
  const manager = { ...tech, id: 10, nomeCompleto: 'Gestor', tipoAcesso: { id: 2, nome: 'Gestor' } }
  const { client, calls } = setup((call) => {
    assert.equal(call.url, '/api/v1/usuarios')
    return {
      data: [
        manager,
        tech,
        { ...tech, id: 23, tipoAcesso: 'SOLICITANTE' },
        { ...tech, id: 24, tipoAcesso: 'ADMINISTRADOR' },
        { ...tech, id: 22 },
      ],
    }
  })
  const options = await createManagementService(client, () => user).listEventResponsibles()
  assert.deepEqual(options.map((item) => item.id).sort(), ['10', '22'])
  assert.equal(options.find((item) => item.id === '10').name, 'Gestor')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].params, undefined)
  const administrator = setup((call) =>
    call.url === '/api/v1/unidades' ? { data: [unit] } : { data: [manager, tech] },
  )
  await createManagementService(administrator.client, () => ({
    ...user,
    role: 'ADMINISTRADOR',
  })).listEventResponsibles()
  assert.deepEqual(administrator.calls.at(-1).params, { unidadeId: 5 })
})
test('a API recebe nota decimal sem conversão para inteiro e a leitura preserva o valor', async () => {
  let current = { ...grade }
  const { client, calls } = setup((call) => {
    if (call.method === 'patch') current = { ...current, ...call.data }
    return { data: call.method === 'get' ? [current] : current }
  })
  const service = createManagementService(client, () => user)
  assert.equal(
    (await service.saveTechnicianCompetency('22', { competencyId: 1, rating: 8.7 })).rating,
    8.7,
  )
  assert.equal(calls.find((call) => call.method === 'patch').data.nota, 8.7)
})

test('RH consulta turnos de outra unidade da mesma instituição e rejeita unidades externas', async () => {
  const sibling = { ...unit, id: 6, instituicaoId: 8 }
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [{ ...unit, instituicaoId: 8 }, sibling, { ...unit, id: 99, instituicaoId: 9 }],
      }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/turnos')
      return {
        data: [
          { ...shift, unidadeId: 6 },
          { ...shift, id: 9, unidadeId: 99 },
        ],
      }
    throw Error(`Endpoint inesperado: ${call.url}`)
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  assert.deepEqual(await service.listShifts('6'), [{ id: '4', name: 'Diurno · 08:00 – 16:00' }])
  assert.deepEqual(calls.at(-1).params, { unidadeId: 6 })
  const previous = calls.length
  await assert.rejects(service.listShifts('99'), /não pertence à instituição/)
  assert.equal(
    calls.slice(previous).some((call) => call.url === '/api/v1/turnos'),
    false,
  )
  const scoped = setup((call) => {
    assert.equal(call.url, '/api/v1/turnos')
    assert.equal(call.params, undefined)
    return { data: [shift] }
  })
  await createManagementService(scoped.client, () => user).listShifts('99')
  assert.equal(scoped.calls.length, 1)
})

test('RH edita técnico de outra unidade da instituição preservando vínculo e endereço reais', async () => {
  const sibling = { ...unit, id: 6, instituicaoId: 8, logradouro: 'Rua da outra unidade' }
  const existing = { ...tech, unidadeId: 6 }
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades') return { data: [{ ...unit, instituicaoId: 8 }, sibling] }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/usuarios/22') return { data: existing }
    if (call.url === '/api/v1/turnos') {
      assert.deepEqual(call.params, { unidadeId: 6 })
      return { data: [{ ...shift, unidadeId: 6 }] }
    }
    if (call.url === '/api/v1/usuarios/22/turnos')
      return { data: [{ id: 8, turnoId: 4, estaAtivo: true }] }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error(`Endpoint inesperado: ${call.url}`)
  })
  const saved = await createManagementService(client, () => ({
    ...user,
    role: 'ADMINISTRADOR',
  })).saveTechnician(input, '22')
  assert.equal(saved.unitId, '6')
  assert.equal(saved.address, sibling.logradouro)
  const updates = calls.filter((call) => call.method === 'patch')
  assert.equal(updates.length, 1)
  assert.equal('unidadeId' in updates[0].data, false)
  const outside = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [
          { ...unit, instituicaoId: 8 },
          { ...unit, id: 99, instituicaoId: 9 },
        ],
      }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/usuarios/22') return { data: { ...existing, unidadeId: 99 } }
    throw Error('Não pode gravar técnico de outra instituição')
  })
  await assert.rejects(
    createManagementService(outside.client, () => ({
      ...user,
      role: 'ADMINISTRADOR',
    })).saveTechnician(input, '22'),
    /não pertence à instituição/,
  )
  assert.equal(
    outside.calls.some((call) => call.method !== 'get'),
    false,
  )
})

test('seleção única de turno rejeita múltiplos vínculos no envio antes de qualquer chamada à API', async () => {
  const { client, calls } = setup(() => {
    throw Error('Nenhuma chamada deve ser enviada')
  })
  const service = createManagementService(client, () => user)
  for (const values of [
    { shiftId: '4', shiftIds: ['4', '5'] },
    { shiftId: '4', shiftIds: [] },
    { shiftId: '4', shiftIds: ['5'] },
    { shiftId: '', shiftIds: ['4'] },
  ])
    await assert.rejects(service.saveTechnician({ ...input, ...values }, '22'), /turno/)
  assert.equal(calls.length, 0)
  assert.deepEqual(validateTechnician({ ...input, shiftIds: undefined }), {})
  assert.deepEqual(validateTechnician({ ...input, shiftId: '5', shiftIds: ['5'] }), {})
})

test('troca para um turno vincula o escolhido antes de remover antigos e preserva vínculos se falhar', async () => {
  for (const fail of [false, true]) {
    let links = [
      { id: 80, turnoId: 4, estaAtivo: true },
      { id: 81, turnoId: 6, estaAtivo: true },
    ]
    const { client, calls } = setup((call) => {
      if (call.url === '/api/v1/usuarios/22') return { data: { ...tech, ...call.data } }
      if (call.url === '/api/v1/turnos')
        return { data: [shift, { ...shift, id: 5 }, { ...shift, id: 6 }] }
      if (call.url === '/api/v1/usuarios/22/turnos')
        return { data: links.map((item) => ({ ...item })) }
      if (call.url === '/api/v1/aptidoes') return { data: [] }
      if (call.url === '/api/v1/turnos/5/usuarios/22') {
        if (fail) return { status: 503 }
        const created = { id: 82, turnoId: 5, estaAtivo: true }
        links.push(created)
        return { data: created }
      }
      const match = call.url.match(/^\/api\/v1\/turnos-usuarios\/(\d+)\/desativar$/)
      if (match) {
        links = links.map((item) =>
          item.id === Number(match[1]) ? { ...item, estaAtivo: false } : item,
        )
        return { data: links.find((item) => item.id === Number(match[1])) }
      }
      throw Error('Endpoint inesperado: ' + call.url)
    })
    const service = createManagementService(client, () => user)
    const save = service.saveTechnician({ ...input, shiftId: '5', shiftIds: ['5'] }, '22')
    if (fail) {
      await assert.rejects(save, PartialSaveError)
      assert.deepEqual(
        links.filter((item) => item.estaAtivo).map((item) => item.turnoId),
        [4, 6],
      )
      assert.equal(calls.filter((call) => call.url.includes('/turnos-usuarios/')).length, 0)
    } else {
      const saved = await save
      assert.deepEqual(saved.shiftIds, ['5'])
      assert.deepEqual(
        links.filter((item) => item.estaAtivo).map((item) => item.turnoId),
        [5],
      )
      const added = calls.findIndex((call) => call.url === '/api/v1/turnos/5/usuarios/22')
      const removed = calls.findIndex((call) => call.url.includes('/turnos-usuarios/'))
      assert(added >= 0 && removed > added)
    }
  }
})

test('unidades de trabalho do RH ficam na instituição; gestor não consulta endpoint exclusivo', async () => {
  const { client } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [
          { ...unit, instituicaoId: 8 },
          { ...unit, id: 6, instituicaoId: 8 },
          { ...unit, id: 99, instituicaoId: 9 },
        ],
      }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    throw Error('Rota inesperada')
  })
  const units = await createManagementService(client, () => ({
    ...user,
    role: 'ADMINISTRADOR',
  })).listWorkUnits()
  assert.deepEqual(
    units.map((item) => item.id),
    ['5', '6'],
  )
  assert.equal(units[0].address, unit.logradouro)
  const denied = setup(() => {
    throw Error('Gestor não consulta unidades')
  })
  assert.deepEqual(await createManagementService(denied.client, () => user).listWorkUnits(), [])
  assert.equal(denied.calls.length, 0)
})

test('RH transfere unidade e vincula turno novo antes de remover antigo, herdando localização', async () => {
  const sibling = { ...unit, id: 6, instituicaoId: 8, nome: 'Unidade Sul', logradouro: 'Rua Sul' }
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades') return { data: [{ ...unit, instituicaoId: 8 }, sibling] }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/usuarios/22')
      return { data: call.method === 'patch' ? { ...tech, ...call.data } : tech }
    if (call.url === '/api/v1/turnos') {
      assert.deepEqual(call.params, { unidadeId: 6 })
      return { data: [{ ...shift, id: 9, unidadeId: 6 }] }
    }
    if (call.url === '/api/v1/usuarios/22/turnos')
      return { data: [{ id: 8, turnoId: 4, estaAtivo: true }] }
    if (
      call.url === '/api/v1/turnos/9/usuarios/22' ||
      call.url === '/api/v1/turnos-usuarios/8/desativar'
    )
      return { data: {} }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error('Rota inesperada: ' + call.url)
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  const saved = await service.saveTechnician(
    { ...input, unitId: '6', shiftId: '9', shiftIds: ['9'] },
    '22',
  )
  assert.equal(saved.unitId, '6')
  assert.equal(saved.unitName, 'Unidade Sul')
  assert.equal(saved.address, 'Rua Sul')
  assert.equal(
    calls.find((call) => call.url === '/api/v1/usuarios/22' && call.method === 'patch').data
      .unidadeId,
    6,
  )
  assert(
    calls.findIndex((call) => call.url === '/api/v1/turnos/9/usuarios/22') <
      calls.findIndex((call) => call.url === '/api/v1/turnos-usuarios/8/desativar'),
  )
})

test('troca de unidade fora da instituição ou pelo gestor é rejeitada antes de gravar', async () => {
  for (const role of ['ADMINISTRADOR', 'GESTOR']) {
    const { client, calls } = setup((call) => {
      if (call.url === '/api/v1/unidades')
        return {
          data: [
            { ...unit, instituicaoId: 8 },
            { ...unit, id: 99, instituicaoId: 9 },
          ],
        }
      if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
      if (call.url === '/api/v1/usuarios/22') return { data: tech }
      if (call.url === '/api/v1/turnos') return { data: [shift] }
      throw Error('Não pode gravar')
    })
    await assert.rejects(
      createManagementService(client, () => ({ ...user, role })).saveTechnician(
        { ...input, unitId: '99' },
        '22',
      ),
      /instituição|não pode alterar/,
    )
    assert.equal(
      calls.some((call) => call.method !== 'get'),
      false,
    )
  }
})

test('troca parcial de unidade pode ser concluída sem duplicar técnico ou perder turno antigo antes do novo', async () => {
  let current = { ...tech }
  let fail = true
  const { client, calls } = setup((call) => {
    if (call.url === '/api/v1/unidades')
      return {
        data: [
          { ...unit, instituicaoId: 8 },
          { ...unit, id: 6, instituicaoId: 8 },
        ],
      }
    if (call.url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10 } }
    if (call.url === '/api/v1/usuarios/22') {
      if (call.method === 'patch') current = { ...current, ...call.data }
      return { data: current }
    }
    if (call.url === '/api/v1/turnos') return { data: [{ ...shift, id: 9, unidadeId: 6 }] }
    if (call.url === '/api/v1/usuarios/22/turnos')
      return { data: [{ id: 8, turnoId: 4, estaAtivo: true }] }
    if (call.url === '/api/v1/turnos/9/usuarios/22') {
      if (fail) {
        fail = false
        return { status: 500 }
      }
      return { data: {} }
    }
    if (call.url === '/api/v1/turnos-usuarios/8/desativar') return { data: {} }
    if (call.url === '/api/v1/aptidoes') return { data: [] }
    throw Error('Rota inesperada: ' + call.url)
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  const changed = { ...input, unitId: '6', shiftId: '9', shiftIds: ['9'] }
  await assert.rejects(
    service.saveTechnician(changed, '22'),
    (error) => error instanceof PartialSaveError && error.resourceId === '22',
  )
  assert.equal(
    calls.some((call) => call.url === '/api/v1/turnos-usuarios/8/desativar'),
    false,
  )
  assert.equal((await service.saveTechnician(changed, '22')).unitId, '6')
  assert.equal(
    calls.some((call) => call.url === '/api/v1/usuarios' && call.method === 'post'),
    false,
  )
  assert.equal(calls.filter((call) => call.url === '/api/v1/turnos-usuarios/8/desativar').length, 1)
})

test('opções de unidades e turnos propagam o mesmo AbortSignal ao escopo institucional', async () => {
  const controller = new AbortController()
  const { client, calls } = setup(async ({ url, params, signal }) => {
    assert.equal(signal, controller.signal)
    if (url === '/api/v1/unidades')
      return {
        data: [
          { ...unit, instituicaoId: 8 },
          { ...unit, id: 6, instituicaoId: 8 },
        ],
      }
    if (url === '/api/v1/usuarios/10') return { data: { ...tech, id: 10, unidadeId: 5 } }
    if (url === '/api/v1/turnos') {
      assert.equal(params.unidadeId, 6)
      return { data: [{ ...shift, unidadeId: 6 }] }
    }
    throw Error('Rota inesperada: ' + url)
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  const workUnits = await service.listWorkUnits(controller.signal)
  assert.equal(workUnits.length, 2)
  const shifts = await service.listShifts('6', controller.signal)
  assert.equal(shifts[0].id, String(shift.id))
  assert.equal(
    calls.every((call) => call.signal === controller.signal),
    true,
  )
})
test('cancelar locais durante a resposta rejeita a leitura sem expirar a sessão', async () => {
  const controller = new AbortController()
  let release
  let started
  const ready = new Promise((resolve) => {
    started = resolve
  })
  const { client, calls } = setup(async ({ url, signal }) => {
    assert.equal(url, '/api/v1/locais')
    assert.equal(signal, controller.signal)
    started()
    return new Promise((resolve) => {
      release = () => resolve({ data: [{ id: 9, nome: 'Sala', estaAtivo: true }] })
    })
  })
  const service = createManagementService(client, () => user)
  const pending = service.listLocations(controller.signal)
  await ready
  controller.abort()
  release()
  await assert.rejects(pending, (error) => error.name === 'CanceledError')
  assert.equal(calls.length, 1)
  assert.equal(client.getTokens().token, 'old-token')
})
test('cancelamento do escopo do RH interrompe a busca antes de consultar turnos', async () => {
  const controller = new AbortController()
  const releases = []
  let started
  const ready = new Promise((resolve) => {
    started = resolve
  })
  const { client, calls } = setup(async ({ url, signal }) => {
    assert.equal(signal, controller.signal)
    assert.ok(['/api/v1/unidades', '/api/v1/usuarios/10'].includes(url))
    return new Promise((resolve) => {
      releases.push(() =>
        resolve({
          data:
            url === '/api/v1/unidades'
              ? [{ ...unit, instituicaoId: 8 }]
              : { ...tech, id: 10, unidadeId: 5 },
        }),
      )
      if (releases.length === 2) started()
    })
  })
  const service = createManagementService(client, () => ({ ...user, role: 'ADMINISTRADOR' }))
  const pending = service.listShifts('5', controller.signal)
  await ready
  controller.abort()
  releases.forEach((release) => release())
  await assert.rejects(pending, (error) => error.name === 'CanceledError')
  assert.equal(calls.length, 2)
})
