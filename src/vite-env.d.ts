/// <reference types="vite/client" />

declare module 'virtual:shares' {
  const shares: { group: string; pieces: import('@/lib/types').Piece[] }[]
  export default shares
}

declare module 'virtual:companies' {
  const companies: import('@/lib/types').Company[]
  export default companies
}
