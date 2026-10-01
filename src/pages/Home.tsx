import { useEffect, useRef, useState } from 'react'
import companies from 'virtual:companies'
import type { Company } from '@/lib/types'
import { clock, featured, pad2, typeLabel } from '@/lib/pieces'
import { linkTo } from '@/lib/router'
import { PieceFrame, type PieceFrameHandle } from '@/components/PieceFrame'
import { Foot, TopBar } from '@/components/Chrome'
import { cn } from '@/lib/utils'

const total = companies.reduce((n, c) => n + c.pieces.length, 0)

export function Home() {
  const [hovered, setHovered] = useState<string | null>(null)
  useEffect(() => void (document.title = 'Motion'), [])

  return (
    <div className="page">
      <TopBar right={<><span>Work</span><span className="muted">Index</span></>} />
      <section className="intro">
        <a className="byline mono rise" href="https://noletorious.com">
          ← By noletorious
        </a>
        <h1 className="display rise">
          Exploring{' '}
          <span className="wave" aria-label="motion">
            {[...'motion'].map((ch, i) => (
              <span key={i} aria-hidden style={{ '--i': i } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>{' '}
          work,
          <i>by company</i>
        </h1>
        <div className="lede rise" style={{ animationDelay: '120ms' }}>
          <p>Let's rethink branding and put motion first for companies we love and know.</p>
          <span className="mono muted">
            {pad2(companies.length)} companies — {pad2(total)} pieces
          </span>
        </div>
      </section>
      <section className="grid">
        {companies.map((c, i) => (
          <Tile key={c.slug} company={c} index={i} dimmed={hovered !== null && hovered !== c.slug} onHover={setHovered} />
        ))}
      </section>
      <Foot />
    </div>
  )
}

const canHover = () => matchMedia('(hover: hover)').matches

function Tile({ company: c, index, dimmed, onHover }: { company: Company; index: number; dimmed: boolean; onHover: (s: string | null) => void }) {
  const piece = featured(c)
  const frame = useRef<PieceFrameHandle>(null)
  const el = useRef<HTMLAnchorElement>(null)
  const active = useRef(false)
  const readyRef = useRef(false)
  const [live, setLive] = useState(false) // iframe mounted (first hover / in view on touch)
  const [ready, setReady] = useState(false)
  const [on, setOn] = useState(false)
  const [t, setT] = useState(0)

  const start = () => {
    active.current = true
    setOn(true)
    setLive(true)
    if (readyRef.current) frame.current?.send({ type: 'play' })
  }
  const stop = () => {
    active.current = false
    setOn(false)
    frame.current?.send({ type: 'pause' })
  }

  // Touch screens have no hover: play while the tile is mostly on screen.
  useEffect(() => {
    if (canHover() || !el.current) return
    const io = new IntersectionObserver(([e]) => (e.intersectionRatio > 0.6 ? start() : stop()), { threshold: [0, 0.6, 1] })
    io.observe(el.current)
    return () => io.disconnect()
  }, [])

  const types = [...new Set(c.pieces.map((p) => typeLabel(p.type).toLowerCase()))].join(' · ')
  return (
    <a
      ref={el}
      href={`/${c.slug}`}
      onClick={linkTo(`/${c.slug}`)}
      onMouseEnter={() => canHover() && (start(), onHover(c.slug))}
      onMouseLeave={() => canHover() && (stop(), onHover(null))}
      onFocus={start}
      onBlur={stop}
      className={cn('tile rise', dimmed && 'dim')}
      style={{ animationDelay: `${200 + index * 90}ms` }}
    >
      <div className="frame" style={{ viewTransitionName: `frame-${c.slug}` }}>
        {piece?.poster && <img src={piece.poster} alt="" loading="lazy" decoding="async" />}
        {piece && live && (
          <PieceFrame
            ref={frame}
            piece={piece}
            repeat
            className={cn('live', ready && on && 'show')}
            onMessage={(m) => {
              if (m.type === 'ready') {
                setReady(true)
                readyRef.current = true
                if (!active.current) frame.current?.send({ type: 'pause' })
              }
              setT(m.t)
            }}
          />
        )}
        {piece && (
          <span className={cn('chip mono', on && ready && 'show')}>
            <b /> {typeLabel(piece.type)} · {clock(t)} / {clock(piece.duration)}
          </span>
        )}
        {piece && <span className={cn('progress', on && ready && 'show')} style={{ width: `${(t / piece.duration) * 100}%` }} />}
      </div>
      <div className="meta">
        <div>
          <span className="mono muted idx">{pad2(index + 1)}</span>
          <span className="name">{c.brand.name}</span>
        </div>
        <span className="mono muted hint">
          <span className="rest">
            {c.pieces.length} pieces · {types}
          </span>
          <span className="go">View company →</span>
        </span>
      </div>
    </a>
  )
}
