import { lazy, Suspense } from 'react'
import companies from 'virtual:companies'
import { usePath } from '@/lib/router'
import { Home } from '@/pages/Home'
import { CompanyPage } from '@/pages/CompanyPage'
import { VersionPage } from '@/pages/Version'

// Review page (PDF prompt 11) is a dev tool; it never ships in the build.
const Review = import.meta.env.DEV ? lazy(() => import('@/pages/Review')) : null

export default function App() {
  const [slug, vid] = usePath().split('/').filter(Boolean)
  if (slug === 'review' && Review)
    return (
      <Suspense fallback={null}>
        <Review />
      </Suspense>
    )
  const company = companies.find((c) => c.slug === slug)
  const version = company?.versions.find((v) => v.id === vid)
  if (company && version) return <VersionPage key={`${company.slug}/${version.id}`} company={company} version={version} />
  if (company && !vid) return <CompanyPage key={company.slug} company={company} />
  return <Home />
}
