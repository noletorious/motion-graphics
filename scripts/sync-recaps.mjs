// Rewrites every companies/*/versions/*/share/recap.html from elements/recap-template.html,
// keeping each file's own <script id="recap-config"> block (and titling it from that config).
// Usage: npm run sync-recaps   (then npm run sync-kit)
import fs from 'fs'
import path from 'path'
import { ROOT, findPieces } from './lib.mjs'

const template = fs.readFileSync(path.join(ROOT, 'elements/recap-template.html'), 'utf8')
const CONFIG = /<script id="recap-config">[\s\S]*?<\/script>/

for (const p of findPieces().filter((p) => p.folder === 'share' && p.name === 'recap' && p.slug !== 'share')) {
  const config = fs.readFileSync(p.file, 'utf8').match(CONFIG)?.[0]
  if (!config) continue
  const name = config.match(/name: '([^']+)'/)?.[1] ?? p.slug
  const v = config.match(/\bv: '([^']+)'/)?.[1] ?? p.version
  const out = template
    .replace(CONFIG, () => config)
    .replace('<meta name="piece:title" content="Recap">', `<meta name="piece:title" content="${name} ${v} recap">`)
    .replace('<title>Recap</title>', `<title>${name} ${v} — Recap</title>`)
  fs.writeFileSync(p.file, out)
  console.log('✓', path.relative(ROOT, p.file))
}
