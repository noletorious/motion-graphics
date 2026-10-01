/// <reference types="vite/client" />

declare module 'virtual:companies' {
  const companies: import('@/lib/types').Company[]
  export default companies
}
