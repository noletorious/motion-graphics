import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

// Scans companies/*/brand.json + companies/*/pieces/*.html and exposes them
// as `virtual:companies`. Adding a company = adding a folder; nothing else.

const VIRTUAL_ID = 'virtual:companies'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const ROOT = path.resolve(__dirname, '../companies')

function readMeta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta\\s+name=["']piece:${name}["']\\s+content=["']([^"']*)["']`, 'i')
  return html.match(re)?.[1]
}

function scan() {
  if (!fs.existsSync(ROOT)) return []
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, d.name, 'brand.json')))
    .map((d) => {
      const slug = d.name
      const brand = JSON.parse(fs.readFileSync(path.join(ROOT, slug, 'brand.json'), 'utf8'))
      const piecesDir = path.join(ROOT, slug, 'pieces')
      const pieces = fs.existsSync(piecesDir)
        ? fs
            .readdirSync(piecesDir)
            .filter((f) => f.endsWith('.html'))
            .sort()
            .map((file) => {
              const html = fs.readFileSync(path.join(piecesDir, file), 'utf8')
              const poster = file.replace(/\.html$/, '.poster.jpg')
              return {
                file,
                url: `/companies/${slug}/pieces/${file}`,
                type: readMeta(html, 'type') ?? 'piece',
                title: readMeta(html, 'title') ?? file.replace(/\.html$/, ''),
                duration: Number(readMeta(html, 'duration') ?? 0),
                aspect: readMeta(html, 'aspect') ?? '16:9',
                loop: readMeta(html, 'loop') === 'true',
                posterTime: Number(readMeta(html, 'poster') ?? 0),
                poster: fs.existsSync(path.join(piecesDir, poster)) ? `/companies/${slug}/pieces/${poster}` : null,
              }
            })
        : []
      return { slug, brand, pieces }
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
    },
    load(id) {
      if (id === RESOLVED_ID) return `export default ${JSON.stringify(scan())}`
    },
    configureServer(server) {
      server.watcher.add(ROOT)
      const reload = (file: string) => {
        if (!file.startsWith(ROOT)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
      server.watcher.on('change', reload)
    },
    closeBundle() {
      // Pieces are self-contained pages; ship the folder as-is.
      if (fs.existsSync(ROOT)) fs.cpSync(ROOT, path.join(outDir, 'companies'), { recursive: true })
    },
  }
}
