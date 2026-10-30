import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import {
  clearDemoManagement,
  listTechnicianCompetencies,
  saveTechnicianCompetency,
  saveTechnician,
  removeTechnician,
  listTechnicians,
} from '../src/mocks/services/managementService.ts'
import {
  competencyCategories,
  parseCompetencyRating,
  getCompetencyPresentation,
} from '../src/utils/competencies.ts'

beforeEach(() => clearDemoManagement())

test('resumo destaca somente avaliadas; expansão completa o catálogo sem repetir e desempata por ID', () => {
  const items = competencyCategories.map((item) => ({ ...item, rating: null }))
  assert.equal(getCompetencyPresentation(items).highlights.length, 0)
  assert.equal(getCompetencyPresentation(items).remaining.length, 10)
  const snapshot = structuredClone(items)
  items[0].rating = 0
  let result = getCompetencyPresentation(items)
  assert.deepEqual(
    result.highlights.map((item) => item.id),
    [1],
  )
  assert.equal(result.remaining.length, 9)
  assert.equal(result.assessed, 1)
  items[1].rating = 10
  items[2].rating = 10
  items[3].rating = 9
  result = getCompetencyPresentation(items)
  assert.deepEqual(
    result.highlights.map((item) => item.id),
    [2, 3, 4],
  )
  assert.equal(result.remaining.length, 7)
  assert.equal(result.assessed, 4)
  const ids = [...result.highlights, ...result.remaining].map((item) => item.id)
  assert.equal(new Set(ids).size, 10)
  assert.deepEqual(
    items.map((item) => item.id),
    snapshot.map((item) => item.id),
  )
  assert.ok(result.remaining.some((item) => item.id === 1 && item.rating === 0))
})

test('especialidade exibida depende da maior nota, aceita zero e volta a vazia após remover todas', async () => {
  let technician = (await listTechnicians())[0]
  assert.equal(technician.assessedSpecialty, null)
  technician = await saveTechnician(technician, technician.id, [{ competencyId: 2, rating: 0 }])
  assert.equal(technician.assessedSpecialty, 'Hidráulica')
  assert.equal((await listTechnicians())[0].assessedSpecialty, 'Hidráulica')
  await saveTechnicianCompetency(technician.id, { competencyId: 3, rating: 10 })
  assert.equal((await listTechnicians())[0].assessedSpecialty, 'Mecânica')
  technician = await saveTechnician(technician, technician.id, [
    { competencyId: 2, rating: null },
    { competencyId: 3, rating: null },
  ])
  assert.equal(technician.assessedSpecialty, null)
  assert.equal((await listTechnicians())[0].assessedSpecialty, null)
  assert.equal((await listTechnicians())[1].assessedSpecialty, null)
})

test('cadastro e dez notas são salvos juntos, incluindo zero e remoção de avaliação', async () => {
  const original = (await listTechnicians())[0]
  const ratings = competencyCategories.map((item) => ({
    competencyId: item.id,
    rating: item.id - 1,
  }))
  await saveTechnician({ ...original, name: 'Ana com competências' }, original.id, ratings)
  assert.equal((await listTechnicians())[0].name, 'Ana com competências')
  assert.deepEqual(
    (await listTechnicianCompetencies(original.id)).map((item) => item.rating),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  )
  await saveTechnician(original, original.id, [
    { competencyId: 10, rating: null },
    { competencyId: 2, rating: 10 },
  ])
  const saved = await listTechnicianCompetencies(original.id)
  assert.equal(saved[0].rating, 0)
  assert.equal(saved[1].rating, 10)
  assert.equal(saved[9].rating, null)
  assert.ok((await listTechnicianCompetencies('t-2')).every((item) => item.rating === null))
})

test('lote inválido e falha no cadastro não deixam alterações parciais em cadastro ou notas', async () => {
  const original = (await listTechnicians())[0]
  await saveTechnicianCompetency(original.id, { competencyId: 1, rating: 7 })
  const withRating = (await listTechnicians())[0]
  for (const invalid of [
    { competencyId: 2, rating: 1.555 },
    { competencyId: 99, rating: 8 },
  ]) {
    await assert.rejects(
      saveTechnician({ ...original, name: 'Não deve salvar' }, original.id, [
        { competencyId: 1, rating: 0 },
        invalid,
      ]),
    )
    assert.deepEqual((await listTechnicians())[0], withRating)
    assert.equal((await listTechnicianCompetencies(original.id))[0].rating, 7)
  }
  await assert.rejects(
    saveTechnician({ ...original, email: 'inválido' }, original.id, [
      { competencyId: 1, rating: 10 },
    ]),
  )
  assert.equal((await listTechnicianCompetencies(original.id))[0].rating, 7)
  const pending = saveTechnician({ ...original, name: 'Sessão antiga' }, original.id, [
    { competencyId: 1, rating: 10 },
  ])
  clearDemoManagement()
  await assert.rejects(pending, /encerrada/)
  assert.deepEqual((await listTechnicians())[0], original)
  assert.ok((await listTechnicianCompetencies(original.id)).every((item) => item.rating === null))
})

test('as dez categorias preservam IDs do enum; avaliações opcionais não são zero', async () => {
  assert.deepEqual(
    competencyCategories.map((item) => item.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  )
  assert.equal(competencyCategories[6].code, 'REDE_CONECTIVIDADE')
  const items = await listTechnicianCompetencies('t-1')
  assert.equal(items.length, 10)
  assert.ok(items.every((item) => item.rating === null))
  items[0].rating = 9
  items[0].name = 'Nome alterado na cópia'
  assert.deepEqual((await listTechnicianCompetencies('t-1'))[0], {
    ...competencyCategories[0],
    rating: null,
  })
})

test('salvar, editar e remover notas preserva outros técnicos e categorias; editar cadastro mantém avaliações', async () => {
  await saveTechnicianCompetency('t-1', { competencyId: 1, rating: 0 })
  await saveTechnicianCompetency('t-1', { competencyId: 2, rating: 10 })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, 0)
  assert.equal((await listTechnicianCompetencies('t-1'))[1].rating, 10)
  assert.equal((await listTechnicianCompetencies('t-2'))[0].rating, null)
  const updated = await saveTechnicianCompetency('t-1', { competencyId: 1, rating: 8 })
  updated.rating = 999
  await saveTechnician(
    {
      name: 'Ana atualizada',
      birthDate: '1995-04-18',
      email: 'ana@fixa.test',
      phone: '(11) 99999-0001',
      specialty: 'Elétrica',
      shift: '08:00 - 16:00',
      status: 'Ativo',
    },
    't-1',
  )
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, 8)
  await saveTechnicianCompetency('t-1', { competencyId: 1, rating: null })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
  assert.equal((await listTechnicianCompetencies('t-1'))[1].rating, 10)
})

test('notas inválidas e categorias inexistentes não são gravadas', async () => {
  for (const rating of [-1, 11, 3.555, NaN, Infinity, '9'])
    await assert.rejects(
      saveTechnicianCompetency('t-1', { competencyId: 1, rating }),
      /casas decimais/,
    )
  await assert.rejects(saveTechnicianCompetency('t-1', { competencyId: 99, rating: 9 }), /inválida/)
  await assert.rejects(listTechnicianCompetencies('inexistente'), /não encontrado/)
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
  assert.equal(parseCompetencyRating(''), null)
  assert.equal(parseCompetencyRating('0'), 0)
  assert.equal(parseCompetencyRating('10'), 10)
  for (const value of ['1.555', '10.01', '11', '-1', 'texto', '1e1', '1.', '+1'])
    assert.equal(parseCompetencyRating(value), undefined)
})

test('cancelamento e fim de sessão impedem gravação pendente; cadastro novo começa sem notas', async () => {
  const controller = new AbortController()
  const pending = saveTechnicianCompetency('t-1', { competencyId: 1, rating: 8 }, controller.signal)
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
  const sessionSave = saveTechnicianCompetency('t-1', { competencyId: 1, rating: 9 })
  clearDemoManagement()
  await assert.rejects(sessionSave, /encerrada/)
  const created = await saveTechnician({
    name: 'Técnico novo',
    birthDate: '1995-04-18',
    email: 'novo@fixa.test',
    phone: '(11) 99999-1234',
    specialty: '',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  })
  assert.ok((await listTechnicianCompetencies(created.id)).every((item) => item.rating === null))
  await saveTechnicianCompetency(created.id, { competencyId: 1, rating: 7 })
  await removeTechnician(created.id)
  await assert.rejects(listTechnicianCompetencies(created.id), /não encontrado/)
  clearDemoManagement()
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
})

test('notas opcionais aceitam decimais com ponto ou vírgula sem arredondar', async () => {
  assert.equal(parseCompetencyRating('7.6'), 7.6)
  assert.equal(parseCompetencyRating('8,7'), 8.7)
  assert.equal(parseCompetencyRating('9,25'), 9.25)
  assert.equal(parseCompetencyRating('10.00'), 10)
  assert.equal(parseCompetencyRating('   '), null)
  await saveTechnicianCompetency('t-1', { competencyId: 1, rating: 7.6 })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, 7.6)
  await saveTechnicianCompetency('t-1', { competencyId: 1, rating: 0 })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, 0)
  await saveTechnicianCompetency('t-1', { competencyId: 1, rating: null })
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
})
