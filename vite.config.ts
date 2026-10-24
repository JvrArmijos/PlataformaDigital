import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbFile = path.resolve(__dirname, '.mock-db.json')

function mockDbPlugin() {
  return {
    name: 'mock-db-server',
    configureServer(server: any) {
      server.middlewares.use('/api/mock-store', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          if (fs.existsSync(dbFile)) {
            try {
              const data = fs.readFileSync(dbFile, 'utf-8')
              res.statusCode = 200
              res.end(data)
              return
            } catch {}
          }
          res.statusCode = 200
          res.end(JSON.stringify({}))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => { body += chunk })
          req.on('end', () => {
            try {
              fs.writeFileSync(dbFile, body, 'utf-8')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (err: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mockDbPlugin(),
  ],
  server: {
    host: true, // Expone el servidor Vite a la red local (Permite abrir desde celulares en la misma Wi-Fi)
    port: 5173,
  }
})
