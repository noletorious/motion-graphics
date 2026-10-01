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
  featured?: string
  hero?: string
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

export interface Company {
  slug: string
  brand: Brand
  pieces: Piece[]
}
