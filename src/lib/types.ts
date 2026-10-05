export interface KeyFact {
  label: string
  value: string
  source?: string
}

export interface Brand {
  name: string
  tagline: string
  description: string
  website: string
  colors: Record<string, string>
  fonts: { display: string; body: string; note?: string }
  logo: string
  order?: number
  features?: string[]
  keyFacts: KeyFact[]
  cta?: string
}

export interface Piece {
  file: string
  url: string
  type: string
  title: string
  duration: number
  aspect: string
  loop: boolean
  posterTime: number
  poster: string | null
}

export interface Version {
  /** folder name, e.g. "v1"; also the URL segment */
  id: string
  name: string
  premise: string
  showcase?: boolean
  featured?: string
  hero?: string
  pieces: Piece[]
}

export interface Company {
  slug: string
  brand: Brand
  versions: Version[]
}
