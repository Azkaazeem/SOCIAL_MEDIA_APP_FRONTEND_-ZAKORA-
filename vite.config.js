import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  resolve: {
    preserveSymlinks: true,
  },
  cacheDir: path.join(os.tmpdir(), 'zakora_vite_cache'),
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
