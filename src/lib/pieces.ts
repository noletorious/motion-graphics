import type { Company, Piece } from './types'

export const TYPE_LABEL: Record<string, string> = {
  'logo-sting': 'Logo sting',
  'promo-15s': '15s promo',
  'feature-loop': 'Feature loop',
  'social-loop': 'Social loop',
  stat: 'Stat',
  'lower-third': 'Lower third',
}
export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const byFile = (c: Company, file?: string) => c.pieces.find((p) => p.file === file)
export const featured = (c: Company): Piece | undefined => byFile(c, c.brand.featured) ?? c.pieces[0]
export const hero = (c: Company): Piece | undefined => byFile(c, c.brand.hero) ?? featured(c)

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
