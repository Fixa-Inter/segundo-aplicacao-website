import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AI_PROXY_')
  const target = env.AI_PROXY_TARGET || 'https://ia-api.fixa.solutions'
  const proxy: Record<string, ProxyOptions> = {
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
