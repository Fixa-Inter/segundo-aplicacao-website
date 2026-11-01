export async function managementFixture(
  browser,
  { role = 'GESTOR', width = 390, height = 844, mobile = true, count = 6 } = {},
) {
  const context = await browser.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  })
  const errors = []
  const unexpected = []
  const writes = []
  const date = '2026-10-26'
  const units = [5, 6].map((id) => ({
    id,
    instituicaoId: 8,
    nome: id === 5 ? 'Unidade Centro' : 'Unidade Bela Vista',
    cnpj: id === 5 ? '12345678000195' : '12345678000276',
    logradouro: 'Rua de Teste',
    numero: '10',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001000',
    complemento: '',
    estaAtivo: true,
  }))
  const people = units.flatMap((unit) => [
    {
      id: unit.id === 5 ? 101 : 102,
      unidadeId: unit.id,
      nomeCompleto: unit.id === 5 ? 'Gestor Centro' : 'Gestor Bela Vista',
      email: 'gestor' + unit.id + '@fixa.test',
      tipoAcesso: 'GESTOR',
      cargo: 'Gestão',
      dataNascimento: '1980-01-01',
      estaAtivo: true,
    },
    ...Array.from({ length: count }, (_, i) => ({
      id: (unit.id === 5 ? 201 : 301) + i,
      unidadeId: unit.id,
      nomeCompleto:
        'Técnico ' +
        String(i + 1).padStart(2, '0') +
        (i === 0 ? ' com um nome bastante extenso para testar o cartão' : ''),
      email: 'tecnico' + unit.id + '-' + i + '@fixa.test',
      tipoAcesso: 'TECNICO',
      cargo: 'Manutenção',
      dataNascimento: '1980-01-01',
      estaAtivo: i !== count - 1,
    })),
  ])
  const shifts = units.map((unit) => ({
    id: unit.id * 10,
    unidadeId: unit.id,
    nome: unit.id === 5 ? 'Manhã' : 'Tarde',
    horaInicio: unit.id === 5 ? 28800 : 46800,
    horaFim: unit.id === 5 ? 43200 : 64800,
    estaAtivo: true,
  }))
  const events = [
    {
      id: 80,
      usuarioId: 101,
      localEnderecoId: 20,
      titulo: 'Revisão do ar-condicionado da sala de informática',
      descricao: 'Evento sintético de responsividade',
      descricaoLocal: 'Sala de teste',
      observacao: '',
      dataHoraInicio: date + 'T09:00:00',
      dataHoraFim: date + 'T10:00:00',
    },
  ]
  const conversations = new Map(
    [1, 2].map((id) => [
      'mobile-test-' + id,
      {
        session_id: 'mobile-test-' + id,
        iniciada_em: date + 'T09:00:00Z',
        atualizada_em: date + 'T10:00:00Z',
        titulo: 'Conversa de teste ' + id,
        resumo: 'Resumo sintético',
        mensagens: [
          { role: 'human', mensagem: 'Como conferir uma solicitação?' },
          {
            role: 'assistant',
            mensagem: 'Podemos consultar os dados da solicitação.',
            emocao: 'EMPATICO',
          },
        ],
      },
    ]),
  )
  await context.addInitScript(
    (role) =>
      role !== 'ANONYMOUS' &&
      sessionStorage.setItem(
        'fixa.session',
        JSON.stringify({
          user: {
            id: '10',
            name: 'Conta de Teste Mobile',
            identifier: 'teste@fixa.test',
            cnpj: '12345678000195',
            role,
          },
          token: 'mobile-test-only',
          refreshToken: 'mobile-test-refresh',
        }),
      ),
    role,
  )
  const origin = new URL(process.env.FIXA_TEST_BASE_URL || 'http://localhost:5173').origin
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname
    if (url.hostname.endsWith('.cloud.databricks.com'))
      return route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html lang="pt-BR"><title>Dashboard de teste</title><p>Dashboard de teste</p></html>',
      })
    if (path.startsWith('/api/ia/') || url.hostname === 'ia-api.fixa.solutions') {
      const apiPath = path.replace(/^\/api\/ia/, '')
      if (method !== 'GET') writes.push({ method, path: apiPath })
      if (apiPath === '/api/v1/sessoes')
        return route.fulfill({
          json: { status: 'SUCESSO', conversas: [...conversations.values()] },
        })
      if (method === 'POST' && apiPath === '/api/v1/chat') {
        const message = request.postDataJSON().mensagem
        conversations.set('mobile-active', {
          session_id: 'mobile-active',
          iniciada_em: date + 'T10:00:00Z',
          atualizada_em: date + 'T10:00:00Z',
          titulo: '',
          resumo: '',
          mensagens: [
            { role: 'human', mensagem: message },
            { role: 'assistant', mensagem: 'Posso ajudar com essa consulta.', emocao: 'EMPATICO' },
          ],
        })
        return route.fulfill({
          json: {
            thread_id: 'mobile-active',
            resposta: 'Posso ajudar com essa consulta.',
            emocao: 'EMPATICO',
            intencao: null,
            confirmacao: 'nao',
          },
        })
      }
      if (method === 'DELETE' && apiPath === '/api/v1/chat/sessions/mobile-active') {
        conversations.set('mobile-active', {
          ...conversations.get('mobile-active'),
          titulo: 'Atendimento de teste',
          resumo: 'Resumo da conversa',
        })
        return route.fulfill({
          json: {
            thread_id: 'mobile-active',
            status: 'ENCERRADA',
            mensagem: 'Sessão encerrada',
            resumo: 'Atendimento de teste\nResumo da conversa',
          },
        })
      }
      if (method === 'POST' && apiPath === '/api/v1/sessoes/conversa')
        return route.fulfill({ json: conversations.get(request.postDataJSON().session_id) })
      unexpected.push(method + ' ' + apiPath)
      return route.abort()
    }
    if (path.startsWith('/api/v1/')) {
      const unitId = url.searchParams.has('unidadeId')
        ? Number(url.searchParams.get('unidadeId'))
        : role === 'GESTOR'
          ? 5
          : null
      let data
      if (method === 'PATCH' && /\/usuarios\/\d+\/desativar$/.test(path)) {
        const user = people.find((person) => String(person.id) === path.split('/')[4])
        user.estaAtivo = false
        writes.push({ method, path })
        return route.fulfill({ json: user })
      }
      if (method !== 'GET') {
        unexpected.push(method + ' ' + path)
        return route.abort()
      }
      if (path === '/api/v1/dashboard/embed')
        return route.fulfill({ status: 502, json: { erro: 'BI de teste indisponível' } })
      if (path === '/api/v1/perfil')
        data = {
          id: 10,
          unidadeId: 5,
          nomeCompleto: 'Conta de Teste Mobile',
          email: 'teste@fixa.test',
          dataNascimento: '1980-01-01',
        }
      else if (path === '/api/v1/usuarios/10') data = { id: 10, unidadeId: 5 }
      else if (path === '/api/v1/unidades') data = units
      else if (path === '/api/v1/usuarios')
        data = people.filter(
          (user) =>
            (!unitId || user.unidadeId === unitId) &&
            (!url.searchParams.has('tipoAcesso') ||
              user.tipoAcesso === url.searchParams.get('tipoAcesso')),
        )
      else if (path === '/api/v1/turnos')
        data = shifts.filter((shift) => !unitId || shift.unidadeId === unitId)
      else if (/\/usuarios\/\d+\/turnos$/.test(path)) {
        const user = people.find((person) => String(person.id) === path.split('/')[4])
        data = [{ id: user.id, turnoId: user.unidadeId * 10, estaAtivo: true }]
      } else if (/\/usuarios\/\d+$/.test(path))
        data = people.find((person) => String(person.id) === path.split('/')[4])
      else if (path === '/api/v1/aptidoes')
        data = [
          {
            id: 70,
            usuarioId: Number(url.searchParams.get('usuarioId')),
            categoriaProblema: 'ELETRICA',
            nota: 7.6,
            estaAtivo: true,
          },
        ]
      else if (path === '/api/v1/eventos') data = events
      else if (path === '/api/v1/locais')
        data = [{ id: 20, unidadeId: 5, nome: 'Sala de teste', estaAtivo: true }]
      else {
        unexpected.push(method + ' ' + path)
        return route.abort()
      }
      return route.fulfill({ json: data })
    }
    if (url.origin === origin) return route.continue()
    unexpected.push(method + ' ' + url.origin + path)
    return route.abort()
  })
  const page = await context.newPage()
  await page.clock.setFixedTime(new Date('2026-10-26T12:00:00-03:00'))
  page.setDefaultTimeout(10000)
  page.on('pageerror', (error) => errors.push(error.message))
  return { context, page, errors, unexpected, writes }
}
