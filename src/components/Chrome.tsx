import { useEffect, useRef, useState, type ReactNode } from 'react'
import companies from 'virtual:companies'
import { linkTo, navigate, usePath } from '@/lib/router'
import { pad2, versionPath } from '@/lib/pieces'
import { cn } from '@/lib/utils'
import logo from '@/assets/noletorious-logo-dark.svg'

export interface Crumb {
  label: string
  href?: string
}

/** Logo / company / version, plus the directory. The directory is the main way around the site. */
export function TopBar({ crumbs = [] }: { crumbs?: Crumb[] }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/" onClick={linkTo('/')} className="wordmark">
          <img src={logo} alt="" />
          Motion
        </a>
        {crumbs.map((c, i) => (
          <span key={i} className="crumb">
            <span className="sep" aria-hidden>
              /
            </span>
            {c.href ? (
              <a href={c.href} onClick={linkTo(c.href)}>
                {c.label}
              </a>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <button className="mono dir-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Directory
      </button>
      <Directory open={open} onClose={() => setOpen(false)} />
    </header>
  )
}

function Directory({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const path = usePath()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const go = (href: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    onClose()
    navigate(href)
  }

  return (
    <dialog
      ref={ref}
      className="directory"
      onClose={onClose}
      // a click on the backdrop lands on the <dialog> itself
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label="Directory"
    >
      <div className="dir-inner">
        <div className="dir-head">
          <span className="mono muted">Directory</span>
          <button className="mono dir-close" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </div>
        <ul className="dir-tree">
          <li>
            <a href="/" onClick={go('/')} className={cn('dir-home', path === '/' && 'on')}>
              Home
            </a>
          </li>
          {companies.map((c, i) => (
            <li key={c.slug}>
              <a href={`/${c.slug}`} onClick={go(`/${c.slug}`)} className={cn('dir-co', path === `/${c.slug}` && 'on')}>
                <span className="mono muted">{pad2(i + 1)}</span>
                {c.brand.name}
              </a>
              <ul>
                {c.versions.map((v) => {
                  const href = versionPath(c, v)
                  return (
                    <li key={v.id}>
                      <a href={href} onClick={go(href)} className={cn('dir-v', path === href && 'on')}>
                        <span className="mono">{v.id}</span>
                        <span className="dir-vname">{v.name}</span>
                        {v.showcase && <span className="mono dir-tag">Showcase</span>}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}

export function Foot({ children }: { children?: ReactNode }) {
  return (
    <footer className="foot">
      {children ?? <span className="mono muted">Spec work. Not affiliated with or endorsed by the companies shown.</span>}
      <span className="mono muted">© {new Date().getFullYear()}</span>
    </footer>
  )
}
