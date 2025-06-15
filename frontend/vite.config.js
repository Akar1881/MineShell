import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from 'yamljs'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Load configuration and process environment variables
let configContent = fs.readFileSync(path.resolve(__dirname, '../config.yaml'), 'utf8')

// Replace environment variables in the format ${VAR_NAME} with their values
configContent = configContent.replace(/\${([^}]+)}/g, (match, varName) => {
  return process.env[varName] || match // Return the env var value or keep the placeholder if not found
})

const config = yaml.parse(configContent)

export default defineConfig({
  plugins: [react()],
  server: {
    port: config.server.frontend.port,
    host: config.server.frontend.host,
    strictPort: true,
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