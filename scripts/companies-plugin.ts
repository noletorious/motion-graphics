import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'
import { SITE, companyMeta, headTags, homeMeta, versionMeta, type Meta } from '../src/lib/seo'

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
      // draft versions are off the site but still need reviewing here
      const vj = path.join(ROOT, slug, 'versions', v, 'version.json')
      if (fs.existsSync(vj) && readJson(vj).draft) out.push({ group: `${slug} ${v} · draft`, pieces: scanPieces(slug, v) })
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
        // "draft": true in version.json keeps a version off the site until it's built and approved
        .filter((v) => !v.draft)
      return { slug, brand, versions }
    })
    .filter((c) => c.versions.length)
    .sort((a, b) => (a.brand.order ?? 99) - (b.brand.order ?? 99) || a.slug.localeCompare(b.slug))
}

/** Every public route with its SEO meta (drafts are already filtered out by scan). */
function routes(): Meta[] {
  const cs = scan()
  return [homeMeta(cs), ...cs.flatMap((c) => [companyMeta(c), ...c.versions.map((v) => versionMeta(c, v))])]
}
const metaFor = (url: string) => {
  const p = '/' + url.split('?')[0].split('/').filter(Boolean).join('/')
  if (p === '/review') return { title: 'Review — Motion', description: 'Dev-only review page.', path: p, noindex: true }
  return routes().find((m) => m.path === p) ?? routes()[0]
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
    // the route's title, description, canonical, Open Graph, Twitter and JSON-LD tags
    transformIndexHtml(html, ctx) {
      return html.replace('<!--seo-->', `<!--seo-->${headTags(metaFor(ctx.originalUrl ?? ctx.path ?? '/'))}<!--/seo-->`)
    },
    configureServer(server) {
      const SHARE = path.resolve(ROOT, '../share')
      server.watcher.add([ROOT, SHARE])
      // piece libraries (assets/lib/*.js) import `three` through the piece's import map, so serve them as-is
      // instead of letting Vite rewrite their bare imports (the build copies them untouched too)
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        if (!url.startsWith('/companies/') || !url.endsWith('.js')) return next()
        const file = path.join(ROOT, url.slice('/companies/'.length))
        if (!file.startsWith(ROOT) || !fs.existsSync(file)) return next()
        res.setHeader('Content-Type', 'text/javascript')
        res.end(fs.readFileSync(file))
      })
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
      // SEO: a prerendered index.html per route (so link previews see that page's tags), plus sitemap and robots
      const index = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const head = /<!--seo-->[\s\S]*?<!--\/seo-->/
      const all = routes()
      for (const m of all.slice(1)) {
        const dir = path.join(outDir, ...m.path.split('/').filter(Boolean))
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), index.replace(head, `<!--seo-->${headTags(m)}<!--/seo-->`))
      }
      const today = new Date().toISOString().slice(0, 10)
      const urls = all.map((m) => `  <url><loc>${SITE}${m.path}</loc><lastmod>${today}</lastmod><priority>${m.path === '/' ? '1.0' : m.type === 'article' ? '0.8' : '0.6'}</priority></url>`)
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
      fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /review\n\nSitemap: ${SITE}/sitemap.xml\n`)
    },
  }
}
