import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Piece } from '@/lib/types'

export interface PieceMessage {
  type: 'ready' | 'time' | 'play' | 'pause' | 'ended' | 'mute' | 'rate'
  t: number
  duration: number
  playing: boolean
  muted: boolean
  rate: number
  cuts: number[]
}
export interface PieceFrameHandle {
  send: (msg: Record<string, unknown>) => void
}
interface Props {
  piece: Piece
  autoplay?: boolean
  muted?: boolean
  /** restart non-looping pieces when they end (previews, hero) */
  repeat?: boolean
  onMessage?: (m: PieceMessage) => void
  className?: string
}

/** A piece running in an iframe, controlled over postMessage (see elements/piece-kit.js). */
export const PieceFrame = forwardRef<PieceFrameHandle, Props>(function PieceFrame(
  { piece, autoplay = true, muted = true, repeat = false, onMessage, className },
  ref,
) {
  const iframe = useRef<HTMLIFrameElement>(null)
  const cb = useRef(onMessage)
  cb.current = onMessage

  const send = (msg: Record<string, unknown>) => iframe.current?.contentWindow?.postMessage({ source: 'site', ...msg }, '*')
  useImperativeHandle(ref, () => ({ send }), [])

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow || e.data?.source !== 'piece') return
      if (e.data.type === 'ended' && repeat) send({ type: 'restart' })
      cb.current?.(e.data)
    }
    addEventListener('message', on)
    return () => removeEventListener('message', on)
  }, [repeat])

  const src = `${piece.url}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}`
  return <iframe ref={iframe} src={src} title={piece.title} allow="autoplay" tabIndex={-1} className={className} />
})
