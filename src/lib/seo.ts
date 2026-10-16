// Per-route SEO, in one place. The build plugin writes these tags into a prerendered
// index.html for every route (link previews and crawlers that skip JS see the right page),
// and the client swaps them on navigation. Mirrors noletorious.com's tags (OG + Twitter + canonical).

export const SITE = 'https://motion.noletorious.com'
export const SITE_NAME = 'Motion by noletorious'
/** The share image for every route: the home page at 1920×1080 (`npm run og`). */
export const IMAGE = { url: `${SITE}/og.jpg`, width: 1920, height: 1080, alt: 'Motion: exploring motion, by company. A turning ring of brand motion pieces.' }
const AUTHOR = { '@type': 'Person', name: 'Noel Torres', alternateName: 'noletorious', url: 'https://noletorious.com' }

export interface Meta {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: object[]
}

// minimal shapes, so the plugin (node) and the app share this file
type V = { id: string; name: string; premise: string; pieces: { title: string }[] }
type C = { slug: string; brand: { name: string; description: string }; versions: V[] }

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const crumbs = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
})

export function homeMeta(companies: C[]): Meta {
  const description = `Exploring motion, by company. Logo stings, promos and social loops for ${list(companies.map((c) => c.brand.name))}, built in code by noletorious. Spec work, unaffiliated.`
  return {
    title: 'Motion — Exploring motion, by company',
    description,
    path: '/',
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE + '/', description, author: AUTHOR }],
  }
}

export function companyMeta(c: C): Meta {
  const path = `/${c.slug}`
  return {
    title: `${c.brand.name} — Motion`,
    description: `Spec motion graphics for ${c.brand.name}: ${list(c.versions.map((v) => `${v.id} ${v.name}`))}. Concept work by noletorious, unaffiliated with ${c.brand.name}.`,
    path,
    jsonLd: [crumbs([['Motion', '/'], [c.brand.name, path]])],
  }
}

export function versionMeta(c: C, v: V): Meta {
  const path = `/${c.slug}/${v.id}`
  const title = `${c.brand.name} ${v.id} ${v.name} — Motion`
  return {
    title,
    description: `${v.premise} ${v.pieces.length} motion pieces for ${c.brand.name}, built in code. Spec work, unaffiliated.`,
    path,
    type: 'article',
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'CreativeWork', name: title.replace(/ — Motion$/, ''), description: v.premise, url: SITE + path, image: IMAGE.url, author: AUTHOR, about: c.brand.name, genre: 'Motion graphics' },
      crumbs([['Motion', '/'], [c.brand.name, `/${c.slug}`], [`${v.id} ${v.name}`, path]]),
    ],
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The route's head tags, each marked `data-seo` so the client can swap the whole set. */
export function headTags(m: Meta) {
  const url = SITE + (m.path === '/' ? '/' : m.path)
  const tags = [
    `<title data-seo>${esc(m.title)}</title>`,
    `<meta data-seo name="description" content="${esc(m.description)}">`,
    `<link data-seo rel="canonical" href="${url}">`,
    m.noindex && `<meta data-seo name="robots" content="noindex, nofollow">`,
    `<meta data-seo property="og:type" content="${m.type ?? 'website'}">`,
    `<meta data-seo property="og:site_name" content="${SITE_NAME}">`,
    `<meta data-seo property="og:locale" content="en_US">`,
    `<meta data-seo property="og:title" content="${esc(m.title)}">`,
    `<meta data-seo property="og:description" content="${esc(m.description)}">`,
    `<meta data-seo property="og:url" content="${url}">`,
    `<meta data-seo property="og:image" content="${IMAGE.url}">`,
    `<meta data-seo property="og:image:type" content="image/jpeg">`,
    `<meta data-seo property="og:image:width" content="${IMAGE.width}">`,
    `<meta data-seo property="og:image:height" content="${IMAGE.height}">`,
    `<meta data-seo property="og:image:alt" content="${esc(IMAGE.alt)}">`,
    `<meta data-seo name="twitter:card" content="summary_large_image">`,
    `<meta data-seo name="twitter:creator" content="@noletorious">`,
    `<meta data-seo name="twitter:title" content="${esc(m.title)}">`,
    `<meta data-seo name="twitter:description" content="${esc(m.description)}">`,
    `<meta data-seo name="twitter:image" content="${IMAGE.url}">`,
    `<meta data-seo name="twitter:image:alt" content="${esc(IMAGE.alt)}">`,
    ...(m.jsonLd ?? []).map((j) => `<script data-seo type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ]
  return tags.filter(Boolean).join('\n    ')
}

/** Client: replace the head's SEO tags with this route's. */
export function applyMeta(m: Meta) {
  document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove())
  document.head.insertAdjacentHTML('beforeend', headTags(m))
}
