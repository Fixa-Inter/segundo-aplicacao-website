import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError } from '../src/services/httpClient.ts'
import { createCloudinaryUploader, maxImageSize } from '../src/services/cloudinaryService.ts'
const image = () => new File(['image-fixture'], 'foto.png', { type: 'image/png' })
test('upload envia multipart ao Cloudinary sem Bearer da API e devolve somente secure_url', async () => {
  let calls = 0
  const service = createCloudinaryUploader(
    'fixa-test',
    'preset-test',
    async (url, options) => {
      calls++
      assert.equal(url, 'https://api.cloudinary.com/v1_1/fixa-test/image/upload')
      assert.equal(options.method, 'POST')
      assert.equal(options.credentials, 'omit')
      assert.equal(options.headers, undefined)
      assert.equal(options.body.get('upload_preset'), 'preset-test')
      assert.equal(options.body.get('folder'), 'solicitacoes')
      assert.equal(options.body.get('file').name, 'foto.png')
      return Response.json({
        secure_url: 'https://res.cloudinary.com/fixa-test/image/upload/foto.png',
      })
    },
    'solicitacoes',
  )
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

test('resposta malformada de upload devolve erro compreensível sem repetir envio', async () => {
  for (const response of [
    () => new Response('<html>erro do provedor</html>', { status: 200 }),
    () => new Response('{invalido', { status: 200 }),
    () => Response.json({ secure_url: 'not a url' }),
    () => Response.json({ secure_url: null }),
  ]) {
    let calls = 0
    const service = createCloudinaryUploader('fixa', 'preset', async () => {
      calls++
      return response()
    })
    await assert.rejects(service.upload(image()), (error) => {
      assert.ok(error instanceof ApiError)
      assert.match(error.message, /Não foi possível enviar a imagem|resposta inválida/)
      assert.doesNotMatch(error.message, /Unexpected token|JSON|Invalid URL|SyntaxError/)
      return true
    })
    assert.equal(calls, 1)
  }
})

test('falha de rede no upload é amigável e preserva o código HTTP de erro', async () => {
  const offline = createCloudinaryUploader('fixa', 'preset', async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(
    offline.upload(image()),
    (error) =>
      error instanceof ApiError &&
      error.message === 'Não foi possível enviar a imagem. Tente novamente.',
  )
  const limited = createCloudinaryUploader(
    'fixa',
    'preset',
    async () => new Response('', { status: 429 }),
  )
  await assert.rejects(
    limited.upload(image()),
    (error) => error instanceof ApiError && error.status === 429,
  )
})

test('cancelamento antes ou durante upload não envia nem mostra uma falha genérica', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  const service = createCloudinaryUploader('fixa', 'preset', async () => {
    calls++
    return Response.json({ secure_url: 'https://res.cloudinary.com/fixa/foto.png' })
  })
  await assert.rejects(service.upload(image(), controller.signal), { name: 'AbortError' })
  assert.equal(calls, 0)
})

test('upload não marca como pronta uma URL que a IA recusaria pelo tamanho ou fragmento', async () => {
  for (const secure_url of [
    'https://res.cloudinary.com/fixa/' + 'a'.repeat(256),
    'https://res.cloudinary.com/fixa/image/upload/qa.png#imagem',
  ]) {
    const service = createCloudinaryUploader('fixa', 'preset', async () =>
      Response.json({ secure_url }),
    )
    await assert.rejects(service.upload(image()), /resposta inválida/)
  }
})
