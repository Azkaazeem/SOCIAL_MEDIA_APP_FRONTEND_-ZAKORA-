import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      '/posts': 'http://localhost:8800/api',
      '/users': 'http://localhost:8800/api',
      '/auth': 'http://localhost:8800/api',
      '/upload': 'http://localhost:8800/api',
    },
  },
})
