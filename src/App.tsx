import { lazy, Suspense } from 'react'
import companies from 'virtual:companies'
import { usePath } from '@/lib/router'
import { Home } from '@/pages/Home'
import { Company } from '@/pages/Company'

// Review page (PDF prompt 11) is a dev tool; it never ships in the build.
const Review = import.meta.env.DEV ? lazy(() => import('@/pages/Review')) : null

export default function App() {
  const path = usePath()
  const slug = path.replace(/^\/|\/$/g, '')
  if (slug === 'review' && Review)
    return (
      <Suspense fallback={null}>
        <Review />
      </Suspense>
    )
  const company = companies.find((c) => c.slug === slug)
  return company ? <Company key={company.slug} company={company} /> : <Home />
}
