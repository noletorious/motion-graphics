import { useEffect } from 'react'
import type { Company } from '@/lib/types'
import { pad2, versionPath } from '@/lib/pieces'
import { linkTo } from '@/lib/router'
import { Foot, TopBar } from '@/components/Chrome'
import { applyMeta, companyMeta } from '@/lib/seo'

/** Plain list of a company's versions. The directory modal is the main way around. */
export function CompanyPage({ company: c }: { company: Company }) {
  useEffect(() => applyMeta(companyMeta(c)), [c])
  return (
    <div className="page">
      <TopBar crumbs={[{ label: c.brand.name }]} />
      <section className="co-head">
        <h1 className="co-name rise">{c.brand.name}</h1>
        <p className="co-desc rise" style={{ animationDelay: '80ms' }}>
          {c.brand.description}
        </p>
      </section>
      <ul className="v-list rise" style={{ animationDelay: '140ms' }}>
        {c.versions.map((v) => (
          <li key={v.id}>
            <a href={versionPath(c, v)} onClick={linkTo(versionPath(c, v))}>
              <span className="mono muted">{v.id}</span>
              <span className="v-name">{v.name}</span>
              <span className="v-premise muted">{v.premise}</span>
              <span className="mono muted">
                {v.showcase && 'Showcase · '}
                {pad2(v.pieces.length)} pieces →
              </span>
            </a>
          </li>
        ))}
      </ul>
      <Foot />
    </div>
  )
}
