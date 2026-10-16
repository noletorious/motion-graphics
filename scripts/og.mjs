// Screenshots the home page at 1920×1080 → public/og.jpg, the share image (og:image / twitter:image) for every route.
// Usage: npm run og   (re-run when the home page or its showcases change)
import fs from 'fs'
import path from 'path'
import { createServer } from 'vite'
import { ROOT, launch } from './lib.mjs'

const server = await createServer({ root: ROOT, server: { port: 0, open: false }, logLevel: 'error' })
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await launch()
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('  pageerror:', e.message))
await page.setViewport({ width: 1920, height: 1080 })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
await new Promise((r) => setTimeout(r, 4000)) // headline animation settles, the front card's piece is playing
const out = path.join(ROOT, 'public/og.jpg')
fs.mkdirSync(path.dirname(out), { recursive: true })
await page.screenshot({ path: out, type: 'jpeg', quality: 86 })
await browser.close()
await server.close()
console.log('✓', path.relative(ROOT, out))
