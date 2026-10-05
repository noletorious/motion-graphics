import { useEffect, useRef, useState } from 'react'
import companies from 'virtual:companies'
import type { Company, Piece, Version } from '@/lib/types'
import { clock, hero as heroOf, host, pad2, showcase, typeLabel, versionLabel, versionPath } from '@/lib/pieces'
import { linkTo } from '@/lib/router'
import { PieceFrame, type PieceFrameHandle } from '@/components/PieceFrame'
import { Foot, TopBar } from '@/components/Chrome'
import { cn } from '@/lib/utils'

/** Next stop after this version: the company's next version, else the next company's showcase. */
function nextOf(c: Company, v: Version) {
  const vi = c.versions.indexOf(v)
  if (vi < c.versions.length - 1) return { company: c, version: c.versions[vi + 1] }
  const nc = companies[(companies.indexOf(c) + 1) % companies.length]
  return { company: nc, version: showcase(nc)! }
}

export function VersionPage({ company: c, version: v }: { company: Company; version: Version }) {
  const next = nextOf(c, v)
  const hero = heroOf(v)
  const heroRef = useRef<PieceFrameHandle>(null)
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => void (document.title = `${c.brand.name} ${versionLabel(v)} — Motion`), [c, v])
  useEffect(() => setActive(null), [c, v])

  const play = (file: string) => {
    heroRef.current?.send({ type: 'mute', muted: true }) // one sound at a time
    setActive(file)
  }

  return (
    <div className="page">
      <TopBar crumbs={[{ label: c.brand.name, href: `/${c.slug}` }, { label: versionLabel(v) }]} />
      <section className="co-head">
        <div className="rise">
          <h1 className="co-name">{c.brand.name}</h1>
          <p className="v-label">
            <span className="mono muted">{v.id}</span> <i>{v.name}</i>
          </p>
        </div>
        <div className="rise" style={{ animationDelay: '80ms' }}>
          <p className="co-desc">{v.premise}</p>
          <p className="co-about muted">{c.brand.description}</p>
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

      {hero && <Hero key={versionPath(c, v)} name={`frame-${c.slug}-${v.id}`} piece={hero} frameRef={heroRef} onSound={() => setActive(null)} />}

      <section className="pieces-head">
        <h2>Pieces</h2>
        <span className="mono muted">{pad2(v.pieces.length)}</span>
      </section>
      <section className="pieces">
        {v.pieces.map((p, n) => (
          <PieceCard key={p.file} piece={p} index={n} active={active === p.file} onPlay={() => play(p.file)} />
        ))}
      </section>

      <Foot>
        <a className="next" href={versionPath(next.company, next.version)} onClick={linkTo(versionPath(next.company, next.version))}>
          <span className="mono muted">
            Next · {next.company.brand.name} {next.version.id}
          </span>
          <span className="next-name">{next.company === c ? next.version.name : next.company.brand.name} →</span>
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

function Hero({ name, piece, frameRef, onSound }: { name: string; piece: Piece; frameRef: React.RefObject<PieceFrameHandle>; onSound: () => void }) {
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
    <section className="hero" style={{ viewTransitionName: name }}>
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
