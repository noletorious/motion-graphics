import { useEffect, useRef, useState } from 'react'
import companies from 'virtual:companies'
import type { Company as CompanyT, Piece } from '@/lib/types'
import { clock, hero as heroOf, host, pad2, typeLabel } from '@/lib/pieces'
import { linkTo } from '@/lib/router'
import { PieceFrame, type PieceFrameHandle } from '@/components/PieceFrame'
import { Foot, TopBar } from '@/components/Chrome'
import { cn } from '@/lib/utils'

export function Company({ company: c }: { company: CompanyT }) {
  const i = companies.indexOf(c)
  const next = companies[(i + 1) % companies.length]
  const hero = heroOf(c)
  const heroRef = useRef<PieceFrameHandle>(null)
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => void (document.title = `${c.brand.name} — Motion`), [c])
  useEffect(() => setActive(null), [c])

  const play = (file: string) => {
    heroRef.current?.send({ type: 'mute', muted: true }) // one sound at a time
    setActive(file)
  }

  return (
    <div className="page">
      <TopBar
        right={
          <>
            <a href="/" onClick={linkTo('/')}>← Index</a>
            <span className="muted">
              {pad2(i + 1)} / {pad2(companies.length)}
            </span>
          </>
        }
      />
      <section className="co-head">
        <h1 className="co-name rise">{c.brand.name}</h1>
        <div className="rise" style={{ animationDelay: '80ms' }}>
          <p className="co-desc">{c.brand.description}</p>
          <a className="mono co-site" href={c.brand.website} target="_blank" rel="noreferrer">
            {host(c.brand.website)} ↗
          </a>
        </div>
      </section>
      <dl className="facts rise" style={{ animationDelay: '140ms' }}>
        {c.brand.keyFacts.map((f) => (
          <div key={f.label} className="fact">
            <dt className="mono muted">{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      {hero && <Hero key={c.slug} slug={c.slug} piece={hero} frameRef={heroRef} onSound={() => setActive(null)} />}

      <section className="pieces-head">
        <h2>Pieces</h2>
        <span className="mono muted">{pad2(c.pieces.length)}</span>
      </section>
      <section className="pieces">
        {c.pieces.map((p, n) => (
          <PieceCard key={p.file} piece={p} index={n} active={active === p.file} onPlay={() => play(p.file)} />
        ))}
      </section>

      <Foot>
        <a className="next" href={`/${next.slug}`} onClick={linkTo(`/${next.slug}`)}>
          <span className="mono muted">Next company</span>
          <span className="next-name">{next.brand.name} →</span>
        </a>
        <span className="mono muted disclaim">
          Spec work. {c.brand.name} is a trademark of its owner.
          <br />
          Not affiliated or endorsed.
        </span>
      </Foot>
    </div>
  )
}

function Hero({ slug, piece, frameRef, onSound }: { slug: string; piece: Piece; frameRef: React.RefObject<PieceFrameHandle>; onSound: () => void }) {
  const [ready, setReady] = useState(false)
  const [t, setT] = useState(0)
  const [muted, setMuted] = useState(true)
  const toggle = () => {
    const m = !muted
    frameRef.current?.send({ type: 'mute', muted: m })
    if (!m) {
      frameRef.current?.send({ type: 'restart' })
      onSound()
    }
  }
  return (
    <section className="hero" style={{ viewTransitionName: `frame-${slug}` }}>
      {piece.poster && <img src={piece.poster} alt="" />}
      <PieceFrame
        ref={frameRef}
        piece={piece}
        repeat
        className={cn('live', ready && 'show')}
        onMessage={(m) => {
          if (m.type === 'ready') setReady(true)
          setT(m.t)
          setMuted(m.muted)
        }}
      />
      <div className="hero-bar mono">
        <span>{typeLabel(piece.type)} — {piece.title}</span>
        <span>
          {clock(t)} / {clock(piece.duration)}
          <button onClick={toggle} className="sound">{muted ? 'Sound off' : 'Sound on'}</button>
        </span>
      </div>
      <span className="hero-progress" style={{ width: `${(t / piece.duration) * 100}%` }} />
    </section>
  )
}

function PieceCard({ piece: p, index, active, onPlay }: { piece: Piece; index: number; active: boolean; onPlay: () => void }) {
  const ref = useRef<PieceFrameHandle>(null)
  const [ready, setReady] = useState(false)
  const [ended, setEnded] = useState(false)
  useEffect(() => {
    if (!active) setReady(false)
  }, [active])
  const span = p.aspect === '1:1' ? 'sq' : p.type === 'promo-15s' ? 'full' : 'wide'
  const click = () => {
    if (active) {
      setEnded(false)
      ref.current?.send({ type: 'restart' })
    } else onPlay()
  }
  return (
    <article className={cn('piece', span)}>
      <button className={cn('piece-frame', p.aspect === '1:1' && 'square')} onClick={click} aria-label={`Play ${p.title}`}>
        {p.poster && <img src={p.poster} alt="" loading="lazy" decoding="async" />}
        {active && (
          <PieceFrame
            ref={ref}
            piece={p}
            muted={false}
            className={cn('live', ready && 'show')}
            onMessage={(m) => {
              if (m.type === 'ready') setReady(true)
              if (m.type === 'play') setEnded(false)
              if (m.type === 'ended') setEnded(true)
            }}
          />
        )}
        <span className={cn('play', active && !ended && 'hide')}>
          <svg viewBox="0 0 24 24">{active ? <path d="M12 5a7 7 0 1 1-6.6 4.7M5 4v5h5" fill="none" stroke="currentColor" strokeWidth="2" /> : <path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" />}</svg>
        </span>
      </button>
      <div className="piece-meta mono muted">
        <span>
          {pad2(index + 1)} · {typeLabel(p.type)}
        </span>
        <span>
          {clock(p.duration)} · {p.aspect}
          {p.loop && ' · loop'}
        </span>
      </div>
      <h3 className="piece-title">{p.title}</h3>
    </article>
  )
}
