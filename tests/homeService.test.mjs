import assert from 'node:assert/strict'
import test from 'node:test'
import { getHomeData } from '../src/services/homeService.ts'
import { saveEvent, removeEvent } from '../src/services/managementService.ts'

test('Home usa os eventos atuais do calendário e devolve indicadores independentes', async () => {
  const event = await saveEvent({
    title: 'Evento compartilhado',
    date: '2026-03-14',
    time: '11:00',
    endTime: '12:00',
    location: 'Sala demonstrativa',
    description: '',
    observation: '',
    technicianId: '',
  })
  try {
    const data = await getHomeData()
    assert.equal(data.events.find((item) => item.id === event.id).time, '11:00–12:00h')
    assert.equal(data.events.find((item) => item.id === event.id).date, '2026-03-14')
    data.taskSummary[0].value = 999
    assert.notEqual((await getHomeData()).taskSummary[0].value, 999)
  } finally {
    await removeEvent(event.id)
  }
  assert.equal(
    (await getHomeData()).events.some((item) => item.id === event.id),
    false,
  )
})
