import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from 'yamljs'
import path from 'path'

// Load configuration
const config = yaml.load(path.resolve(__dirname, '../config.yaml'))

export default defineConfig({
  plugins: [react()],
  server: {
    port: config.server.frontend.port,
    host: config.server.frontend.host,
    proxy: {
      '/api': {
        target: `http://${config.server.backend.host}:${config.server.backend.port}`,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})