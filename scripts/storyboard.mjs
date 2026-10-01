// Level 2 storyboard (PDF prompt 08): screenshot every scene still, then
// write storyboard/index.html with each shot's start time and description.
// Usage: npm run storyboard [-- <scene-id> ...]
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'storyboard')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const board = JSON.parse(fs.readFileSync(path.join(DIR, 'board.json'), 'utf8'))
const only = process.argv.slice(2)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()

// Site pages embed piece shots, so shoot pieces first.
const scenes = board.sections.flatMap((s) => s.scenes).sort((a, b) => Number(!!a.page) - Number(!!b.page))
{
  for (const scene of scenes) {
    if (only.length && !only.includes(scene.id)) continue
    const [w, h] = scene.size
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
    for (let i = 0; i < scene.shots.length; i++) {
      const url = pathToFileURL(path.join(DIR, 'scenes', `${scene.id}.html`)).href + `?shot=${i + 1}`
      await page.goto(url, { waitUntil: 'networkidle0' })
      await page.evaluate(() => document.fonts.ready)
      const out = path.join(DIR, 'shots', `${scene.id}-${i + 1}.png`)
      await page.screenshot({ path: out, fullPage: true })
      console.log('✓', path.relative(ROOT, out))
    }
  }
}
await browser.close()

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0b;--fg:#ecebe6;--mute:#8a8984;--line:#232326}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--fg);font:16px/1.5 "Inter Tight",system-ui,sans-serif;padding:72px 56px 120px}
header{max-width:1600px;margin:0 auto 72px}
h1{font:400 clamp(56px,8vw,128px)/.9 "Instrument Serif",serif;letter-spacing:-.02em}
h1 i{color:var(--mute)}
.intro{margin-top:24px;max-width:720px;color:var(--mute)}
nav{margin-top:32px;display:flex;flex-wrap:wrap;gap:8px 20px;font:13px "JetBrains Mono",monospace}
nav a{color:var(--fg);text-decoration:none;border-bottom:1px solid var(--line)}
section{max-width:1600px;margin:0 auto;padding-top:56px;border-top:1px solid var(--line)}
section+section{margin-top:96px}
h2{font:400 64px/1 "Instrument Serif",serif;letter-spacing:-.01em}
.scene{margin-top:56px}
.scene h3{font:500 13px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.08em;display:flex;gap:16px;align-items:baseline}
.scene h3 span{color:var(--mute)}
.scene p.note{margin-top:8px;color:var(--mute);max-width:900px}
.grid{margin-top:24px;display:grid;gap:28px 20px;grid-template-columns:repeat(auto-fill,minmax(var(--min,340px),1fr))}
.sq .grid{--min:260px}.page .grid{--min:560px}
figure img{width:100%;display:block;border:1px solid var(--line);background:#111}
figcaption{margin-top:12px;font-size:15px}
.t{font:500 12px "JetBrains Mono",monospace;color:var(--fg);display:flex;gap:10px;margin-bottom:6px}
.t span{color:var(--mute)}
</style></head><body>
<header>
  <h1>Storyboard <i>v${board.version}</i></h1>
  <p class="intro">${esc(board.intro)}</p>
  <nav>${board.sections.flatMap((s) => s.scenes.map((sc) => `<a href="#${sc.id}">${esc(s.title === "The site" ? sc.title : s.title + " · " + sc.title)}</a>`)).join('')}</nav>
</header>
${board.sections
  .map(
    (s) => `<section><h2>${esc(s.title)}</h2>
${s.scenes
  .map(
    (sc) => `<div class="scene ${sc.size[0] === sc.size[1] ? 'sq' : ''} ${sc.page ? 'page' : ''}" id="${sc.id}">
  <h3>${esc(sc.title)} <span>${esc(sc.meta)}</span></h3>${sc.note ? `<p class="note">${esc(sc.note)}</p>` : ''}
  <div class="grid">${sc.shots
    .map(
      (shot, i) => `<figure><img loading="lazy" src="shots/${sc.id}-${i + 1}.png" alt=""><figcaption><div class="t">Shot ${String(i + 1).padStart(2, '0')} <span>${esc(shot.t)}</span></div>${esc(shot.d)}</figcaption></figure>`,
    )
    .join('')}</div>
</div>`,
  )
  .join('\n')}</section>`,
  )
  .join('\n')}
</body></html>`
fs.writeFileSync(path.join(DIR, 'index.html'), html)
console.log('✓ storyboard/index.html')
