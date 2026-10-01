// Writes <piece>.poster.jpg next to each piece, at its piece:poster time.
// Home tiles and piece cards show these until the live piece is needed.
// Usage: npm run posters [-- <slug> | <slug>/<piece> ...]
import path from 'path'
import { ROOT, findPieces, launch, openPiece } from './lib.mjs'

const browser = await launch()
for (const p of findPieces(process.argv.slice(2))) {
  const { page, poster } = await openPiece(browser, p.file)
  await page.evaluate((t) => piece.seek(t), poster)
  const out = p.file.replace(/\.html$/, '.poster.jpg')
  await page.screenshot({ path: out, type: 'jpeg', quality: 82 })
  await page.close()
  console.log('✓', path.relative(ROOT, out))
}
await browser.close()
