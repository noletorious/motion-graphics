import type { Company, Piece, Version } from './types'

export const TYPE_LABEL: Record<string, string> = {
  'logo-sting': 'Logo sting',
  'promo-15s': '15s promo',
  'feature-loop': 'Feature loop',
  'social-loop': 'Social loop',
  stat: 'Stat',
  'lower-third': 'Lower third',
  recap: 'Recap',
}
export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const byFile = (v: Version, file?: string) => v.pieces.find((p) => p.file === file)
export const featured = (v: Version): Piece | undefined => byFile(v, v.featured) ?? v.pieces[0]
export const hero = (v: Version): Piece | undefined => byFile(v, v.hero) ?? featured(v)

/** The version a company leads with: the one marked showcase, else the first. */
export const showcase = (c: Company): Version | undefined => c.versions.find((v) => v.showcase) ?? c.versions[0]
export const versionPath = (c: Company, v: Version) => `/${c.slug}/${v.id}`
export const versionLabel = (v: Version) => `${v.id} ${v.name}`

/** Frame shape class for a piece's stage: '' (16:9), 'square' (1:1) or 'tall' (9:16). */
export const shape = (aspect: string) => (aspect === '1:1' ? 'square' : aspect === '9:16' ? 'tall' : '')

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
