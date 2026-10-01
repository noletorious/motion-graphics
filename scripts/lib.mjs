// Shared helpers for scripts that drive pieces in headless Chrome.
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import puppeteer from 'puppeteer-core'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** All pieces, or the ones matching `slug` / `slug/piece` args. */
export function findPieces(args = []) {
  const all = []
  for (const slug of fs.readdirSync(path.join(ROOT, 'companies'))) {
    const dir = path.join(ROOT, 'companies', slug, 'pieces')
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort()) {
      all.push({ slug, name: f.replace(/\.html$/, ''), file: path.join(dir, f) })
    }
  }
  if (!args.length) return all
  return all.filter((p) => args.some((a) => a === p.slug || a === `${p.slug}/${p.name}`))
}

export const launch = () =>
  puppeteer.launch({ executablePath: CHROME, args: ['--allow-file-access-from-files', '--hide-scrollbars', '--force-color-profile=srgb'] })

/** Open a piece in export mode and wait until it has drawn its first frame. */
export async function openPiece(browser, file) {
  const page = await browser.newPage()
  page.on('pageerror', (e) => console.error('  pageerror:', e.message))
  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto(pathToFileURL(file).href + '?export=1&t=0', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.piece?.ready, { timeout: 20000 })
  const info = await page.evaluate(() => ({ width: piece.width, height: piece.height, duration: piece.duration, loop: piece.loop }))
  await page.setViewport({ width: info.width, height: info.height })
  const poster = await page.$eval('meta[name="piece:poster"]', (m) => Number(m.content)).catch(() => 0)
  return { page, ...info, poster }
}
