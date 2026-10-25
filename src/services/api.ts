import { createHttpClient } from './httpClient.ts'

// Apenas o endereço público. Senhas e chaves do servidor nunca pertencem a VITE_*.
export const api = createHttpClient(import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, ''))
