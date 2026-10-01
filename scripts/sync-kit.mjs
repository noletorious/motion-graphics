// Copies elements/piece-kit.js into every piece's <script id="piece-kit">.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const kit = fs.readFileSync(path.join(ROOT, 'elements/piece-kit.js'), 'utf8').trim()
const re = /<script id="piece-kit">[\s\S]*?<\/script>/

for (const slug of fs.readdirSync(path.join(ROOT, 'companies'))) {
  const dir = path.join(ROOT, 'companies', slug, 'pieces')
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const p = path.join(dir, f)
    const html = fs.readFileSync(p, 'utf8')
    if (!re.test(html)) continue
    const next = html.replace(re, () => `<script id="piece-kit">\n${kit}\n</script>`)
    if (next !== html) {
      fs.writeFileSync(p, next)
      console.log('✓', path.relative(ROOT, p))
    }
  }
}
