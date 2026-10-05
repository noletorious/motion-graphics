// Copies elements/piece-kit.js into every piece's <script id="piece-kit">.
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
