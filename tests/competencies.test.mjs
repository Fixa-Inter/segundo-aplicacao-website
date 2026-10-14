import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import {
  clearDemoManagement,
  listTechnicianCompetencies,
  saveTechnicianCompetency,
  saveTechnician,
  removeTechnician,
} from '../src/services/managementService.ts'
import { competencyCategories, parseCompetencyRating } from '../src/utils/competencies.ts'

beforeEach(() => clearDemoManagement())

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

test('notas fora de 0 a 10, fracionárias e categorias inválidas não são gravadas', async () => {
  for (const rating of [-1, 11, 3.5, NaN, Infinity, '9'])
    await assert.rejects(saveTechnicianCompetency('t-1', { competencyId: 1, rating }), /inteira/)
  await assert.rejects(saveTechnicianCompetency('t-1', { competencyId: 99, rating: 9 }), /inválida/)
  await assert.rejects(listTechnicianCompetencies('inexistente'), /não encontrado/)
  assert.equal((await listTechnicianCompetencies('t-1'))[0].rating, null)
  assert.equal(parseCompetencyRating(''), null)
  assert.equal(parseCompetencyRating('0'), 0)
  assert.equal(parseCompetencyRating('10'), 10)
  for (const value of ['1.5', '11', '-1', 'texto'])
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
    specialty: 'Elétrica',
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
