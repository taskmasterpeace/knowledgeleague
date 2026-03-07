import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/replicate': {
          target: 'https://api.replicate.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/replicate/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.REPLICATE_API_TOKEN) {
                proxyReq.setHeader('Authorization', `Bearer ${env.REPLICATE_API_TOKEN}`)
              }
            })
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test-setup.ts',
    },
  }
})
