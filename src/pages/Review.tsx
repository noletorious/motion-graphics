import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import companies from 'virtual:companies'
import { PieceFrame, type PieceFrameHandle, type PieceMessage } from '@/components/PieceFrame'
import { typeLabel } from '@/lib/pieces'
import { cn } from '@/lib/utils'
import logo from '@/assets/noletorious-logo-dark.svg'

// Level 3 review page (PDF prompt 11). Dev only: /review
// Click the picture to pin a comment at that time and spot, comment on sound,
// drag scene cuts to retime them, then copy everything back to Claude.

interface Note {
  id: string
  piece: string // slug/file
  kind: 'pin' | 'sound' | 'trim'
  t: number
  x?: number
  y?: number
  from?: number
  to?: number
  text: string
}
const KEY = 'review-notes-v1'
const load = (): Note[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
const all = companies.flatMap((c) => c.pieces.map((p) => ({ id: `${c.slug}/${p.file}`, company: c, piece: p })))
const labelOf = (id: string) => {
  const e = all.find((a) => a.id === id)
  return e ? `${e.company.brand.name} · ${typeLabel(e.piece.type)}` : id
}
const fmt = (n: Note) => {
  const head = `${labelOf(n.piece)} · ${n.t.toFixed(2)}s`
  if (n.kind === 'pin') return `${head} · pin at ${Math.round(n.x!)}% across, ${Math.round(n.y!)}% down: ${n.text}`
  if (n.kind === 'sound') return `${head} · sound: ${n.text}`
  return `${labelOf(n.piece)} · cut at ${n.from!.toFixed(2)}s → move to ${n.to!.toFixed(2)}s${n.text ? `: ${n.text}` : ''}`
}

export default function Review() {
  const [sel, setSel] = useState(() => new URLSearchParams(location.search).get('p') ?? all[0]?.id)
  const entry = all.find((a) => a.id === sel) ?? all[0]
  const frame = useRef<PieceFrameHandle>(null)
  const [st, setSt] = useState<Pick<PieceMessage, 't' | 'playing' | 'rate' | 'cuts'>>({ t: 0, playing: false, rate: 1, cuts: [] })
  const [notes, setNotes] = useState<Note[]>(load)
  const [draft, setDraft] = useState<Omit<Note, 'id' | 'text'> | null>(null)
  const [text, setText] = useState('')
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const dur = entry.piece.duration

  useEffect(() => void (document.title = 'Review — Motion'), [])
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(notes))
    } catch {}
  }, [notes])
  // focus after the click that opened the draft has finished moving focus
  useEffect(() => {
    if (draft) requestAnimationFrame(() => input.current?.focus())
  }, [draft])
  useEffect(() => {
    history.replaceState(null, '', `/review?p=${sel}`)
    setSt({ t: 0, playing: false, rate: 1, cuts: [] })
    setDraft(null)
  }, [sel])

  const send = (m: Record<string, unknown>) => frame.current?.send(m)
  const mine = useMemo(() => notes.filter((n) => n.piece === entry.id).sort((a, b) => a.t - b.t), [notes, entry.id])
  const trims = mine.filter((n) => n.kind === 'trim')
  const cutAt = (c: number) => trims.find((n) => n.from === c)?.to ?? c

  const startDraft = (d: Omit<Note, 'id' | 'text'>) => {
    send({ type: 'pause' })
    setDraft(d)
    setText('')
  }
  const save = () => {
    if (!draft || (!text.trim() && draft.kind !== 'trim')) return setDraft(null)
    setNotes((ns) => [...ns.filter((n) => !(draft.kind === 'trim' && n.kind === 'trim' && n.piece === draft.piece && n.from === draft.from)), { ...draft, id: crypto.randomUUID(), text: text.trim() }])
    setDraft(null)
  }

  const pin = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    startDraft({ piece: entry.id, kind: 'pin', t: st.t, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    return Math.min(dur, Math.max(0, ((clientX - r.left) / r.width) * dur))
  }
  const scrub = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    send({ type: 'pause' })
    send({ type: 'seek', t: timeAt(e.clientX) })
  }
  const grabCut = (from: number) => (e: RPointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    send({ type: 'pause' })
    setDrag({ from, to: cutAt(from) })
  }
  const moveCut = (e: RPointerEvent) => {
    if (!drag) return
    const to = Math.round(timeAt(e.clientX) * 100) / 100
    setDrag({ ...drag, to })
    send({ type: 'seek', t: to })
  }
  const dropCut = () => {
    if (!drag) return
    if (Math.abs(drag.to - drag.from) >= 0.02) startDraft({ piece: entry.id, kind: 'trim', t: drag.to, from: drag.from, to: drag.to })
    setDrag(null)
  }

  const copy = async () => {
    const byPiece = all.map((a) => notes.filter((n) => n.piece === a.id).sort((x, y) => x.t - y.t)).filter((l) => l.length)
    await navigator.clipboard.writeText(byPiece.flat().map(fmt).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const square = entry.piece.aspect === '1:1'
  return (
    <div className="review">
      <aside className="rv-list">
        <a href="/" className="wordmark"><img src={logo} alt="" />Motion</a>
        <p className="mono muted rv-k">Review</p>
        {companies.map((c) => (
          <div key={c.slug}>
            <p className="mono muted rv-co">{c.brand.name}</p>
            {c.pieces.map((p) => {
              const id = `${c.slug}/${p.file}`
              const n = notes.filter((x) => x.piece === id).length
              return (
                <button key={id} className={cn('rv-item', id === entry.id && 'on')} onClick={() => setSel(id)}>
                  <span>{typeLabel(p.type)}</span>
                  {n > 0 && <span className="mono rv-count">{n}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      <main className="rv-main">
        <div className={cn('rv-stage', square && 'square')}>
          <PieceFrame
            key={entry.id}
            ref={frame}
            piece={entry.piece}
            autoplay={false}
            muted={false}
            className="live show"
            onMessage={(m) => setSt({ t: m.t, playing: m.playing, rate: m.rate, cuts: m.cuts ?? [] })}
          />
          <div className="rv-hit" onClick={pin}>
            {mine
              .filter((n) => n.kind === 'pin' && Math.abs(n.t - st.t) < 0.35)
              .map((n) => (
                <span key={n.id} className="rv-pin" style={{ left: `${n.x}%`, top: `${n.y}%` }} title={n.text} />
              ))}
            {draft?.kind === 'pin' && <span className="rv-pin draft" style={{ left: `${draft.x}%`, top: `${draft.y}%` }} />}
          </div>
        </div>

        <div className="rv-controls mono">
          <button onClick={() => send({ type: st.playing ? 'pause' : 'play' })}>{st.playing ? 'Pause' : 'Play'}</button>
          {[1, 2].map((r) => (
            <button key={r} className={cn(st.rate === r && 'on')} onClick={() => send({ type: 'rate', rate: r })}>
              {r}×
            </button>
          ))}
          <span className="rv-time">
            {st.t.toFixed(2)}s / {dur.toFixed(2)}s
          </span>
          <button onClick={() => startDraft({ piece: entry.id, kind: 'sound', t: st.t })}>Comment on sound</button>
        </div>

        <div className="rv-track" ref={track} onPointerDown={scrub} onPointerMove={(e) => (drag ? moveCut(e) : e.buttons && send({ type: 'seek', t: timeAt(e.clientX) }))} onPointerUp={dropCut}>
          <div className="rv-fill" style={{ width: `${(st.t / dur) * 100}%` }} />
          {st.cuts.map((c) => {
            const pos = drag?.from === c ? drag.to : cutAt(c)
            return (
              <span key={c} className={cn('rv-cut', pos !== c && 'moved')} style={{ left: `${(pos / dur) * 100}%` }} onPointerDown={grabCut(c)} title={`cut ${c}s — drag to move`} />
            )
          })}
          {mine
            .filter((n) => n.kind !== 'trim')
            .map((n) => (
              <span key={n.id} className={cn('rv-mark', n.kind)} style={{ left: `${(n.t / dur) * 100}%` }} />
            ))}
        </div>

        {draft && (
          <form className="rv-draft" onSubmit={(e) => (e.preventDefault(), save())}>
            <span className="mono muted">
              {draft.kind === 'pin' && `${draft.t.toFixed(2)}s · pin at ${Math.round(draft.x!)}% / ${Math.round(draft.y!)}%`}
              {draft.kind === 'sound' && `${draft.t.toFixed(2)}s · sound`}
              {draft.kind === 'trim' && `cut ${draft.from!.toFixed(2)}s → ${draft.to!.toFixed(2)}s (note optional)`}
            </span>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setDraft(null)} placeholder="What should change?" />
            <button type="submit" className="mono">Save</button>
          </form>
        )}
      </main>

      <aside className="rv-notes">
        <div className="rv-notes-head">
          <p className="mono muted">
            {notes.length} comment{notes.length === 1 ? '' : 's'} total
          </p>
          <button className="mono rv-copy" onClick={copy} disabled={!notes.length}>
            {copied ? 'Copied' : 'Copy all comments'}
          </button>
        </div>
        {mine.map((n) => (
          <div key={n.id} className="rv-note" onClick={() => send({ type: 'seek', t: n.t })}>
            <span className="mono muted">
              {n.kind === 'trim' ? `cut ${n.from!.toFixed(2)} → ${n.to!.toFixed(2)}s` : `${n.t.toFixed(2)}s · ${n.kind === 'pin' ? 'picture' : 'sound'}`}
            </span>
            <p>{n.text || '—'}</p>
            <button className="mono rv-del" onClick={(e) => (e.stopPropagation(), setNotes((ns) => ns.filter((x) => x.id !== n.id)))}>
              ×
            </button>
          </div>
        ))}
        {!mine.length && <p className="muted rv-empty">Click the picture to pin a comment at that moment. Drag a cut marker on the timeline to retime it.</p>}
        {notes.length > 0 && (
          <button className="mono muted rv-clear" onClick={() => confirm('Delete every comment?') && setNotes([])}>
            Clear all
          </button>
        )}
      </aside>
    </div>
  )
}
