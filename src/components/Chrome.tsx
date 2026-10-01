import type { ReactNode } from 'react'
import { linkTo } from '@/lib/router'
import logo from '@/assets/noletorious-logo-dark.svg'

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="topbar">
      <a href="/" onClick={linkTo('/')} className="wordmark">
        <img src={logo} alt="" />
        Motion
      </a>
      <nav className="mono navr">{right}</nav>
    </header>
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
