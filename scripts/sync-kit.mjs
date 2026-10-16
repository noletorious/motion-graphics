// Copies elements/piece-kit.js into every piece's <script id="piece-kit">, and the shared
// 3D modules (elements/models/*.js) into any companies/<slug>/assets/lib/ folder, so built
// pieces can import them from their own company's assets (elements/ never ships).
import fs from 'fs'
import path from 'path'
import { ROOT, findPieces } from './lib.mjs'

const kit = fs.readFileSync(path.join(ROOT, 'elements/piece-kit.js'), 'utf8').trim()
const re = /<script id="piece-kit">[\s\S]*?<\/script>/

for (const { file } of findPieces()) {
  const html = fs.readFileSync(file, 'utf8')
  if (!re.test(html)) continue
  const next = html.replace(re, () => `<script id="piece-kit">\n${kit}\n</script>`)
  if (next !== html) {
    fs.writeFileSync(file, next)
    console.log('✓', path.relative(ROOT, file))
  }
}

const models = path.join(ROOT, 'elements/models')
for (const slug of fs.readdirSync(path.join(ROOT, 'companies'))) {
  const lib = path.join(ROOT, 'companies', slug, 'assets/lib')
  if (!fs.existsSync(lib)) continue
  for (const f of fs.readdirSync(models).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(models, f), 'utf8'), dst = path.join(lib, f)
    if (fs.existsSync(dst) && fs.readFileSync(dst, 'utf8') === src) continue
    fs.writeFileSync(dst, src)
    console.log('✓', path.relative(ROOT, dst))
  }
}
