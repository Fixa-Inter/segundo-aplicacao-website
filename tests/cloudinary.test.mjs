import test from 'node:test'
import assert from 'node:assert/strict'
import { createCloudinaryUploader, maxImageSize } from '../src/services/cloudinaryService.ts'
const image = () => new File(['image-fixture'], 'foto.png', { type: 'image/png' })
test('upload envia multipart ao Cloudinary sem Bearer da API e devolve somente secure_url', async () => {
  let calls = 0
  const service = createCloudinaryUploader('fixa-test', 'preset-test', async (url, options) => {
    calls++
    assert.equal(url, 'https://api.cloudinary.com/v1_1/fixa-test/image/upload')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.headers, undefined)
    assert.equal(options.body.get('upload_preset'), 'preset-test')
    assert.equal(options.body.get('file').name, 'foto.png')
    return Response.json({
      secure_url: 'https://res.cloudinary.com/fixa-test/image/upload/foto.png',
    })
  })
  assert.equal(
    await service.upload(image()),
    'https://res.cloudinary.com/fixa-test/image/upload/foto.png',
  )
  assert.equal(calls, 1)
})
test('configuração, formato e tamanho são verificados antes de qualquer upload', async () => {
  let calls = 0
  const request = async () => {
    calls++
    return Response.json({})
  }
  await assert.rejects(
    createCloudinaryUploader(undefined, undefined, request).upload(image()),
    /indisponível/,
  )
  const service = createCloudinaryUploader('fixa-test', 'preset-test', request)
  await assert.rejects(
    service.upload(new File(['text'], 'script.svg', { type: 'image/svg+xml' })),
    /JPG/,
  )
  await assert.rejects(
    service.upload(
      new File([new Uint8Array(maxImageSize + 1)], 'large.png', { type: 'image/png' }),
    ),
    /5 MB/,
  )
  assert.equal(calls, 0)
})
test('erro, URL insegura e cancelamento não viram anexo pronto ou retry automático', async () => {
  for (const result of [
    { status: 500 },
    { secure_url: 'http://res.cloudinary.com/fixa/foto.png' },
    { secure_url: 'https://evil.test/foto.png' },
    {},
  ]) {
    let calls = 0
    const service = createCloudinaryUploader('fixa', 'preset', async () => {
      calls++
      return result.status ? new Response('', { status: result.status }) : Response.json(result)
    })
    await assert.rejects(service.upload(image()))
    assert.equal(calls, 1)
  }
  const controller = new AbortController()
  const service = createCloudinaryUploader('fixa', 'preset', async (_url, options) => {
    assert.equal(options.signal, controller.signal)
    throw new DOMException('Aborted', 'AbortError')
  })
  await assert.rejects(service.upload(image(), controller.signal), { name: 'AbortError' })
})
