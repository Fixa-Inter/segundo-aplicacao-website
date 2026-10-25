import { api } from './api'
import { createManuService } from './manuService'
import { resolveManuBaseURL } from '../utils/manu'
export const manuApi = createManuService(
  api,
  resolveManuBaseURL(import.meta.env.VITE_AI_BASE_URL, window.location.origin),
)
