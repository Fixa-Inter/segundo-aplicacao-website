import { api } from './api'
import { createManuService } from './manuService'

export const manuApi = createManuService(api, import.meta.env?.VITE_AI_BASE_URL?.replace(/\/$/, ''))
