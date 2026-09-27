import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginDemoMessage,
  clearDemoConversations,
  completeDemoMessage,
  getDemoReply,
  listDemoConversations,
} from '../src/services/manuService.ts'

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
