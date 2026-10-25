import { ApiError } from './httpClient.ts'
export const maxImageSize = 5 * 1024 * 1024
const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export function validateImageFile(file: File) {
  if (!formats.includes(file.type)) throw new ApiError('Escolha uma imagem JPG, PNG, WEBP ou GIF.')
  if (!file.size || file.size > maxImageSize) throw new ApiError('Cada imagem deve ter até 5 MB.')
}
export function createCloudinaryUploader(
  cloudName?: string,
  uploadPreset?: string,
  request: typeof fetch = fetch,
  folder?: string,
) {
  const configured = Boolean(
    cloudName && /^[a-zA-Z0-9_-]+$/.test(cloudName) && uploadPreset?.trim(),
  )
  return {
    configured,
    async upload(file: File, signal?: AbortSignal): Promise<string> {
      validateImageFile(file)
      if (!configured) throw new ApiError('O envio de imagens está indisponível no momento.')
      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', uploadPreset!)
      if (folder?.trim()) body.append('folder', folder.trim())
      const response = await request(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
        signal,
        credentials: 'omit',
      })
      if (!response.ok)
        throw new ApiError('Não foi possível enviar a imagem. Tente novamente.', response.status)
      const result: unknown = await response.json()
      const value =
        result && typeof result === 'object' && 'secure_url' in result ? result.secure_url : null
      if (typeof value !== 'string')
        throw new ApiError('O serviço de imagens retornou uma resposta inválida.')
      const url = new URL(value)
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.hostname !== 'res.cloudinary.com'
      )
        throw new ApiError('O serviço de imagens retornou uma resposta inválida.')
      return url.href
    },
  }
}
