import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api-baro': {
        target: 'https://ia.maua.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-baro/, '/api/v1'),
      },
    },
  },
})