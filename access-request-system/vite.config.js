import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端 5173，/api 代理到 json-server（3005）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
