import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

// Scans companies/<slug>/brand.json and companies/<slug>/versions/<v>/{version.json,pieces/*.html}
// and exposes them as `virtual:companies`. Adding a company or a version = adding a folder.

const VIRTUAL_ID = 'virtual:companies'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const SHARES_ID = 'virtual:shares'
const RESOLVED_SHARES = '\0' + SHARES_ID
const ROOT = path.resolve(__dirname, '../companies')

function readMeta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta\\s+name=["']piece:${name}["']\\s+content=["']([^"']*)["']`, 'i')
  return html.match(re)?.[1]
}

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'))
const dirs = (p: string) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [])

const scanPieces = (slug: string, v: string) => readPieces(path.join(ROOT, slug, 'versions', v, 'pieces'), `/companies/${slug}/versions/${v}/pieces`)

function readPieces(dir: string, base: string) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((file) => {
      const html = fs.readFileSync(path.join(dir, file), 'utf8')
      const poster = file.replace(/\.html$/, '.poster.jpg')
      return {
        file,
        url: `${base}/${file}`,
        type: readMeta(html, 'type') ?? 'piece',
        title: readMeta(html, 'title') ?? file.replace(/\.html$/, ''),
        duration: Number(readMeta(html, 'duration') ?? 0),
        aspect: readMeta(html, 'aspect') ?? '16:9',
        loop: readMeta(html, 'loop') === 'true',
        posterTime: Number(readMeta(html, 'poster') ?? 0),
        poster: fs.existsSync(path.join(dir, poster)) ? `${base}/${poster}` : null,
      }
    })
}

/** Posting assets (never on the public site): companies/<slug>/versions/<v>/share/ and share/<group>/. Dev /review only. */
function scanShares() {
  const out: { group: string; pieces: ReturnType<typeof readPieces> }[] = []
  for (const g of dirs(path.resolve(ROOT, '../share'))) out.push({ group: `Site · ${g}`, pieces: readPieces(path.resolve(ROOT, '../share', g), `/share/${g}`) })
  for (const slug of dirs(ROOT))
    for (const v of dirs(path.join(ROOT, slug, 'versions'))) {
      const pieces = readPieces(path.join(ROOT, slug, 'versions', v, 'share'), `/companies/${slug}/versions/${v}/share`)
      if (pieces.length) out.push({ group: `${slug} ${v} · share`, pieces })
    }
  return out
}

function scan() {
  return dirs(ROOT)
    .filter((slug) => fs.existsSync(path.join(ROOT, slug, 'brand.json')))
    .map((slug) => {
      const brand = readJson(path.join(ROOT, slug, 'brand.json'))
      const versions = dirs(path.join(ROOT, slug, 'versions'))
        .filter((v) => fs.existsSync(path.join(ROOT, slug, 'versions', v, 'version.json')))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((id) => ({ id, ...readJson(path.join(ROOT, slug, 'versions', id, 'version.json')), pieces: scanPieces(slug, id) }))
      return { slug, brand, versions }
    })
    .sort((a, b) => (a.brand.order ?? 99) - (b.brand.order ?? 99) || a.slug.localeCompare(b.slug))
}

export function companiesPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'companies',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      if (id === SHARES_ID) return RESOLVED_SHARES
    },
    load(id) {
      if (id === RESOLVED_ID) return `export default ${JSON.stringify(scan())}`
      if (id === RESOLVED_SHARES) return `export default ${JSON.stringify(scanShares())}`
    },
    configureServer(server) {
      const SHARE = path.resolve(ROOT, '../share')
      server.watcher.add([ROOT, SHARE])
      const reload = (file: string) => {
        if (!file.startsWith(ROOT) && !file.startsWith(SHARE)) return
        for (const id of [RESOLVED_ID, RESOLVED_SHARES]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
      server.watcher.on('change', reload)
    },
    closeBundle() {
      // Pieces are self-contained pages; ship the folder as-is.
      // share/ folders are posting assets (recaps, blog headers); they never ship with the site
      if (fs.existsSync(ROOT)) fs.cpSync(ROOT, path.join(outDir, 'companies'), { recursive: true, filter: (src) => !src.split(path.sep).includes('share') })
    },
  }
}
