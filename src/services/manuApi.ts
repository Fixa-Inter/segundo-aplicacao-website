import { resolveManuBaseURL } from '../utils/manu'
import { api } from './api'
import { createManuService } from './manuService'

export const manuApi = createManuService(
  api,
  resolveManuBaseURL(import.meta.env.VITE_AI_BASE_URL, window.location.origin),
)
