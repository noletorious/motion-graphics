import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { companiesPlugin } from './scripts/companies-plugin'

export default defineConfig({
  plugins: [react(), companiesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // only the app is a Vite entry; pieces under companies/ are standalone pages (three via their own import map)
  optimizeDeps: { entries: ['index.html'] },
  server: {
    port: Number(process.env.PORT) || 5173,
    open: true,
  },
})
