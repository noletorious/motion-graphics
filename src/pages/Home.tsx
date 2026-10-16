import { useEffect, useMemo, useRef, useState } from 'react'
import companies from 'virtual:companies'
import type { Company, Piece, Version } from '@/lib/types'
import { featured, pad2, showcase, versionLabel, versionPath } from '@/lib/pieces'
import { navigate } from '@/lib/router'
import { PieceFrame } from '@/components/PieceFrame'
import { Foot, TopBar } from '@/components/Chrome'
import { cn } from '@/lib/utils'

const versions = companies.reduce((n, c) => n + c.versions.length, 0)

export function Home() {
  useEffect(() => void (document.title = 'Motion'), [])
  return (
    <div className="page">
      <TopBar />
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
          </span>
          ,
          <i>by company</i>
        </h1>
        <p className="lede rise" style={{ animationDelay: '120ms' }}>
          Let's rethink branding and put motion first for companies we love and know.
        </p>
      </section>
      <Carousel />
      <Foot>
        <span className="mono muted">
          {pad2(companies.length)} companies — {pad2(versions)} versions · Spec work, not affiliated with the companies shown.
        </span>
      </Foot>
    </div>
  )
}

// ---------------------------------------------------------------- carousel

interface Card {
  company: Company
  version: Version
}

const MIN_CARDS = 8 // companies repeat until the ring is full (for now)
const DEG_PER_SEC = 4.5 // one turn ≈ 80s
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180

/** A slowly turning 3D ring of company showcases. Only the front card plays live. */
function Carousel() {
  const cards = useMemo<Card[]>(() => {
    const base = companies.flatMap((c) => {
      const v = showcase(c)
      return v ? [{ company: c, version: v }] : []
    })
    if (!base.length) return []
    const n = Math.max(MIN_CARDS, base.length)
    return Array.from({ length: n }, (_, i) => base[i % base.length])
  }, [])
  const n = cards.length
  const step = 360 / n

  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const els = useRef<(HTMLElement | null)[]>([])
  const motion = useRef({ angle: 0, vel: -DEG_PER_SEC, target: null as number | null, hover: false, drag: null as null | { x: number; angle: number; t: number; v: number } })
  const dragged = useRef(false)
  const [front, setFront] = useState(0)
  const [size, setSize] = useState({ w: 640, r: 900 })
  // Only turn and play while someone can see it: on screen, in a visible tab.
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)
  useEffect(() => {
    let onScreen = true
    const update = () => {
      visibleRef.current = onScreen && document.visibilityState === 'visible'
      setVisible(visibleRef.current)
    }
    const io = new IntersectionObserver(([e]) => ((onScreen = e.isIntersecting), update()))
    if (section.current) io.observe(section.current)
    document.addEventListener('visibilitychange', update)
    return () => (io.disconnect(), document.removeEventListener('visibilitychange', update))
  }, [])

  // Card width follows the viewport; the radius keeps neighbours from overlapping.
  useEffect(() => {
    const fit = () => {
      // sized by width and height, so the whole ring fits under the headline on load
      const w = Math.min(680, Math.max(260, innerWidth < 700 ? innerWidth * 0.74 : Math.min(innerWidth * 0.38, innerHeight * 0.58)))
      setSize({ w, r: (w / 2 + 24) / Math.tan(Math.PI / n) })
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [n])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let shownFront = -1
    const m = motion.current
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visibleRef.current) return void (raf = requestAnimationFrame(tick))
      if (m.target !== null) {
        // stepping (buttons, side-card clicks): ease toward the target angle
        const d = m.target - m.angle
        m.angle += d * Math.min(1, dt * 6)
        if (Math.abs(d) < 0.05) (m.angle = m.target), (m.target = null)
      } else if (!m.drag) {
        const cruise = m.hover || reducedMotion() ? 0 : -DEG_PER_SEC
        m.vel += (cruise - m.vel) * Math.min(1, dt * 1.8) // glide into hover stops and out of flings
        m.angle += m.vel * dt
      }
      if (ring.current) ring.current.style.transform = `translateZ(${-size.r}px) rotateY(${m.angle}deg)`
      let best = 0
      let bestD = 999
      els.current.forEach((el, i) => {
        if (!el) return
        const rel = Math.abs(norm(i * step + m.angle))
        if (rel < bestD) (bestD = rel), (best = i)
        const fall = Math.max(0, rel - step / 2) // full strength while a card is near the front
        el.style.opacity = String(Math.max(0, 1 - fall / 120))
        el.style.filter = `brightness(${1 - Math.min(fall, 110) / 150})`
        el.style.pointerEvents = rel < 100 ? 'auto' : 'none'
      })
      if (best !== shownFront) setFront((shownFront = best))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, size.r])

  const stepBy = (dir: number) => {
    const m = motion.current
    m.target = Math.round(((m.target ?? m.angle) - dir * step) / step) * step
    m.vel = 0
  }

  // drag / swipe to spin; a fling keeps its momentum, then glides back to cruise
  const onDown = (e: React.PointerEvent) => {
    const m = motion.current
    m.drag = { x: e.clientX, angle: m.angle, t: performance.now(), v: 0 }
    m.target = null
    dragged.current = false
  }
  const onMove = (e: React.PointerEvent) => {
    const m = motion.current
    if (!m.drag) return
    if (!dragged.current && Math.abs(e.clientX - m.drag.x) > 6) {
      dragged.current = true
      stage.current?.setPointerCapture(e.pointerId)
    }
    if (!dragged.current) return
    const now = performance.now()
    const next = m.drag.angle + ((e.clientX - m.drag.x) / size.w) * step
    m.drag.v = (next - m.angle) / Math.max(0.016, (now - m.drag.t) / 1000)
    m.drag.t = now
    m.angle = next
  }
  const onUp = () => {
    const m = motion.current
    if (!m.drag) return
    if (dragged.current) m.vel = Math.max(-200, Math.min(200, m.drag.v))
    m.drag = null
  }

  const open = (i: number) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    if (dragged.current) return
    if (i !== front) return stepBy(norm(i * step + motion.current.angle) > 0 ? 1 : -1)
    navigate(versionPath(cards[i].company, cards[i].version))
  }

  if (!n) return null
  const cur = cards[front]
  const h = (size.w * 9) / 16
  return (
    <section ref={section} className="carousel rise" style={{ animationDelay: '220ms' }} aria-roledescription="carousel" aria-label="Showcases">
      <div
        ref={stage}
        className="c-stage"
        style={{ height: h * 1.08, perspective: `${Math.round(size.r * 2.6)}px` }}
        onPointerEnter={() => (motion.current.hover = true)}
        onPointerLeave={() => (motion.current.hover = false)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={ring} className="c-ring" style={{ width: size.w, height: h }}>
          {cards.map((card, i) => {
            const piece = featured(card.version)
            const isFront = i === front
            return (
              <a
                key={i}
                ref={(el) => (els.current[i] = el)}
                href={versionPath(card.company, card.version)}
                onClick={open(i)}
                draggable={false}
                tabIndex={isFront ? 0 : -1}
                className={cn('c-card', isFront && 'front')}
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(${size.r}px)`,
                  viewTransitionName: isFront ? `frame-${card.company.slug}-${card.version.id}` : undefined,
                }}
                aria-label={`${card.company.brand.name} ${versionLabel(card.version)}`}
              >
                {piece?.poster && <img src={piece.poster} alt="" draggable={false} decoding="async" />}
                {isFront && visible && piece && <FrontPlayer piece={piece} />}
              </a>
            )
          })}
        </div>
      </div>

      <div className="c-caption">
        <button className="mono c-btn" onClick={() => stepBy(-1)} aria-label="Previous showcase">
          ←
        </button>
        <a className="c-label" key={front} href={versionPath(cur.company, cur.version)} onClick={open(front)} aria-live="polite">
          <span className="c-name">{cur.company.brand.name}</span>
          <span className="mono muted">
            {cur.version.id} · {cur.version.name} →
          </span>
        </a>
        <button className="mono c-btn" onClick={() => stepBy(1)} aria-label="Next showcase">
          →
        </button>
      </div>
    </section>
  )
}

/** The live preview on the front card; fades in over the poster once the piece is ready. */
function FrontPlayer({ piece }: { piece: Piece }) {
  const [ready, setReady] = useState(false)
  return <PieceFrame piece={piece} repeat className={cn('live', ready && 'show')} onMessage={(m) => m.type === 'ready' && setReady(true)} />
}
