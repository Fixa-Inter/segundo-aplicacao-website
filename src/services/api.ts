import { createHttpClient } from './httpClient.ts'

export const api = createHttpClient(import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, ''))
