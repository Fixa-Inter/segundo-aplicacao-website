import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AI_PROXY_')
  const target = env.AI_PROXY_TARGET || 'https://ia-api.fixa.solutions'
  const proxy: Record<string, ProxyOptions> = {
    '^/api/web(?:/|$)': {
      target: 'https://web-api.fixa.solutions',
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      rewrite: (path) => path.replace(/^\/api\/web(?=\/|$)/, ''),
      configure(server) {
        server.on('proxyReq', (request) => request.removeHeader('origin'))
        server.on('proxyRes', (response) => {
          response.headers['cache-control'] = 'private, no-store'
        })
      },
    },
    '^/api/ia(?:/|$)': {
      target,
      changeOrigin: true,
      timeout: 120000,
      proxyTimeout: 120000,
      rewrite: (path) => path.replace(/^\/api\/ia(?=\/|$)/, ''),
      configure(server) {
        server.on('proxyRes', (response) => {
          response.headers['cache-control'] = 'private, no-store'
        })
      },
    },
  }
  return { plugins: [react()], server: { port: 5173, strictPort: true, proxy }, preview: { proxy } }
})
