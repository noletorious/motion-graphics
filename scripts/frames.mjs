// QA contact sheet: node scripts/frames.mjs <slug>/<piece> [t1 t2 ...]
// Renders the piece at each time and writes exports/frames/<slug>-<piece>.png
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const [id, ...ts] = process.argv.slice(2)
const [slug, name] = id.split('/')
const file = path.join(ROOT, 'companies', slug, 'pieces', `${name}.html`)

const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('pageerror:', e.message))
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()))
await page.setViewport({ width: 1920, height: 1080 })
await page.goto(pathToFileURL(file).href + '?export=1&t=0', { waitUntil: 'networkidle0' })
await page.waitForFunction(() => window.piece?.ready, { timeout: 15000 })
const { width, height, duration } = await page.evaluate(() => ({ width: piece.width, height: piece.height, duration: piece.duration }))
await page.setViewport({ width, height })
const times = ts.length ? ts.map(Number) : Array.from({ length: 12 }, (_, i) => +((duration * i) / 11).toFixed(2))
const shots = []
for (const t of times) {
  await page.evaluate((t) => piece.seek(t), t)
  shots.push({ t, b64: (await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 })) })
}
const cols = 4
await page.setViewport({ width: 1600, height: 900 })
await page.setContent(`<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;font:600 15px monospace;color:#fff">${shots
  .map((s) => `<div><img style="width:100%;display:block" src="data:image/jpeg;base64,${s.b64}">${s.t.toFixed(2)}s</div>`)
  .join('')}</body>`)
const out = path.join(ROOT, 'exports', 'frames', `${slug}-${name}.png`)
fs.mkdirSync(path.dirname(out), { recursive: true })
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(out)
