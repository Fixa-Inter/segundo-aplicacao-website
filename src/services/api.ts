import axios from 'axios'

// Pronto para o contrato real da API. Nunca coloque secrets em variáveis VITE_*.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || undefined,
  timeout: 10000,
})
