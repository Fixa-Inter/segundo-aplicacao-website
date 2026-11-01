import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginDemoMessage,
  clearDemoConversations,
  completeDemoMessage,
  getDemoReply,
  listDemoConversations,
  subscribeDemoConversations,
} from '../src/mocks/services/manuService.ts'

test('respostas guiadas reconhecem perguntas sugeridas nos quatro idiomas', async () => {
  for (const question of [
    'Como cadastrar um técnico?',
    'How do I register a technician?',
    '¿Cómo registro un técnico?',
    '如何注册技术人员？',
  ]) {
    assert.match(await getDemoReply(question), /Na página Equipe/)
  }
  assert.match(await getDemoReply('如何安排事件？'), /No Calendário/)
  assert.match(await getDemoReply('How do I view indicators?'), /O Dashboard/)
})

test('histórico em memória preserva cópias e somente metadados de anexos', async () => {
  clearDemoConversations()
  const snapshot = beginDemoMessage('teste', 'Como agendar um evento?', [
    { id: 'anexo', name: 'demo.txt', size: 10, content: 'não armazenar' },
  ])
  snapshot[0].messages[0].text = 'Cópia alterada'
  assert.equal(listDemoConversations()[0].messages[0].text, 'Como agendar um evento?')
  assert.equal('content' in listDemoConversations()[0].messages[0].attachments[0], false)
  const history = await completeDemoMessage('teste', 'Como agendar um evento?', true)
  assert.equal(history[0].messages.length, 2)
  assert.match(history[0].messages[1].text, /não são enviados nem analisados/)
  assert.throws(() => beginDemoMessage('teste', '', []), /1 a 500/)
  assert.throws(
    () => beginDemoMessage('teste', 'Oi', [{ id: 'a', name: 'grande.txt', size: 6 * 1024 * 1024 }]),
    /5 MB/,
  )
  await assert.rejects(getDemoReply('x'.repeat(501)), /1 a 500/)
  clearDemoConversations()
})

test('limpar sessão impede resposta pendente de recriar conversa', async () => {
  beginDemoMessage('antiga', 'Olá', [])
  const pending = completeDemoMessage('antiga', 'Olá', false)
  clearDemoConversations()
  await pending
  assert.deepEqual(listDemoConversations(), [])
})

test('novo observador recebe resposta pendente e pode encerrar a assinatura', async () => {
  clearDemoConversations()
  let previousUpdates = 0
  const unsubscribe = subscribeDemoConversations(() => previousUpdates++)
  beginDemoMessage('navegacao', 'Como agendar um evento?', [])
  const pending = completeDemoMessage('navegacao', 'Como agendar um evento?', false)
  unsubscribe()
  let latestHistory = listDemoConversations()
  const stop = subscribeDemoConversations(() => {
    latestHistory = listDemoConversations()
  })
  await pending
  assert.equal(previousUpdates, 1)
  assert.equal(latestHistory[0].messages.length, 2)
  clearDemoConversations()
  assert.deepEqual(latestHistory, [])
  stop()
  beginDemoMessage('outra', 'Olá', [])
  assert.deepEqual(latestHistory, [])
  clearDemoConversations()
})
