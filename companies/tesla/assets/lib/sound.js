// Tesla v1 sound: a small synth set for the music (drums, filtered bass, pads, arp) and the
// sound design, which is timed from the same numbers the visuals use (see glitchHits / flashHit).
// Every voice is plain Web Audio on any BaseAudioContext, so the offline export renders it exactly.
// Music is written as short per-beat events (no long notes from t=0), so it plays right after a seek.
// Voiced low and dark on purpose: chords sit around A2–A3, filters stay under ~1 kHz.

// ---------------------------------------------------------------- voices

const noiseBufs = new WeakMap()
function noise(ctx) {
  if (!noiseBufs.has(ctx)) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = b.getChannelData(0)
    let s = 11
    for (let i = 0; i < d.length; i++) d[i] = ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1
    noiseBufs.set(ctx, b)
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBufs.get(ctx)
  return src
}
/** gain envelope: 0 → peak in `a`, hold, exponential-ish fall to silence at `at + dur` */
function env(ctx, at, dur, peak, a = 0.005, hold = 0) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(peak, at + a)
  if (hold) g.gain.setValueAtTime(peak, at + a + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  return g
}
const osc = (ctx, type, f, at, stop) => {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f, at)
  o.start(at)
  o.stop(stop + 0.05)
  return o
}
const filt = (ctx, type, f, q = 0.7) => {
  const b = ctx.createBiquadFilter()
  b.type = type
  b.frequency.value = f
  b.Q.value = q
  return b
}
export const hz = (n) => 440 * Math.pow(2, (n - 69) / 12)

/** Decode an audio file once (in Piece.setup); the AudioBuffer then plays on any context, live or offline. */
export async function loadSample(url) {
  const data = await (await fetch(url)).arrayBuffer()
  return new OfflineAudioContext(2, 1, 44100).decodeAudioData(data)
}

export const V = {
  /** a decoded sample, with an optional fade-out so it can be cut short on a beat */
  sample(c, o, at, buf, { gain = 1, offset = 0, dur = buf.duration - offset, fade = 0.3 } = {}) {
    const src = c.createBufferSource(), g = c.createGain()
    src.buffer = buf
    g.gain.setValueAtTime(gain, at)
    g.gain.setValueAtTime(gain, at + Math.max(0, dur - fade))
    g.gain.linearRampToValueAtTime(0.0001, at + dur)
    src.connect(g).connect(o)
    src.start(at, offset)
    src.stop(at + dur + 0.02)
  },
  kick(c, o, at, g = 0.55) {
    const s = osc(c, 'sine', 150, at, at + 0.4)
    s.frequency.exponentialRampToValueAtTime(42, at + 0.12)
    s.connect(env(c, at, 0.4, g, 0.002)).connect(o)
    const n = noise(c)
    n.connect(filt(c, 'lowpass', 2500)).connect(env(c, at, 0.03, g * 0.18, 0.001)).connect(o)
    n.start(at), n.stop(at + 0.05)
  },
  hat(c, o, at, g = 0.025, open = false) {
    const n = noise(c), d = open ? 0.18 : 0.04
    n.connect(filt(c, 'highpass', 6500)).connect(env(c, at, d, g, 0.001)).connect(o)
    n.start(at), n.stop(at + d + 0.02)
  },
  clap(c, o, at, g = 0.09) {
    for (const [dt, k] of [[0, 0.6], [0.012, 0.8], [0.024, 1]]) {
      const n = noise(c)
      n.connect(filt(c, 'bandpass', 1100, 1.2)).connect(env(c, at + dt, dt === 0.024 ? 0.16 : 0.02, g * k, 0.001)).connect(o)
      n.start(at + dt), n.stop(at + dt + 0.2)
    }
  },
  /** filtered saw bass, a plucky envelope on the filter */
  bass(c, o, at, f, dur = 0.24, g = 0.11) {
    const lp = filt(c, 'lowpass', 700, 4)
    lp.frequency.setValueAtTime(700, at)
    lp.frequency.exponentialRampToValueAtTime(120, at + dur)
    const e = env(c, at, dur + 0.05, g, 0.004)
    osc(c, 'sawtooth', f, at, at + dur).connect(lp)
    osc(c, 'sine', f / 2, at, at + dur).connect(e)
    lp.connect(e).connect(o)
  },
  /** warm chord: detuned saws through a soft lowpass, swelling in and out over `dur` */
  pad(c, o, at, notes, dur = 2, g = 0.018, bright = 850) {
    const lp = filt(c, 'lowpass', bright, 0.5)
    const e = c.createGain()
    e.gain.setValueAtTime(0.0001, at)
    e.gain.linearRampToValueAtTime(g, at + Math.min(0.35, dur / 3))
    e.gain.setValueAtTime(g, at + dur * 0.7)
    e.gain.linearRampToValueAtTime(0.0001, at + dur)
    for (const n of notes) for (const d of [-7, 7]) {
      const s = osc(c, 'sawtooth', hz(n), at, at + dur)
      s.detune.value = d
      s.connect(lp)
    }
    lp.connect(e).connect(o)
  },
  /** short bell-ish pluck for the arp */
  pluck(c, o, at, n, g = 0.05, dur = 0.35) {
    const f = hz(n)
    osc(c, 'triangle', f, at, at + dur).connect(env(c, at, dur, g, 0.002)).connect(o)
    osc(c, 'sine', f * 2, at, at + dur * 0.4).connect(env(c, at, dur * 0.4, g * 0.3, 0.002)).connect(o)
  },
  /** chord hit for the resolve: pad + bright attack + sub */
  stab(c, o, at, notes, g = 0.05) {
    V.pad(c, o, at, notes, 0.5, g * 0.5, 1600)
    for (const n of notes) osc(c, 'triangle', hz(n), at, at + 0.6).connect(env(c, at, 0.6, g * 0.35, 0.002)).connect(o)
  },
  /** noise riser into `end` */
  riser(c, o, end, dur = 0.6, g = 0.06) {
    const at = end - dur, n = noise(c), bp = filt(c, 'bandpass', 400, 1.5)
    bp.frequency.setValueAtTime(400, at)
    bp.frequency.exponentialRampToValueAtTime(7000, end)
    const e = c.createGain()
    e.gain.setValueAtTime(0.0001, at)
    e.gain.exponentialRampToValueAtTime(g, end - 0.01)
    e.gain.linearRampToValueAtTime(0.0001, end + 0.02)
    n.connect(bp).connect(e).connect(o)
    n.start(at), n.stop(end + 0.05)
  },
  /** air moving past: falls from bright to dark over `dur` (an object decelerating into place) */
  sweepDown(c, o, at, dur = 0.8, g = 0.06) {
    const n = noise(c), bp = filt(c, 'bandpass', 6000, 1.2)
    bp.frequency.setValueAtTime(6000, at)
    bp.frequency.exponentialRampToValueAtTime(300, at + dur)
    n.connect(bp).connect(env(c, at, dur, g, 0.02)).connect(o)
    n.start(at), n.stop(at + dur + 0.05)
  },
  /** the hit: sub drop + a dark noise burst */
  impact(c, o, at, g = 0.35) {
    const s = osc(c, 'sine', 70, at, at + 1.2)
    s.frequency.exponentialRampToValueAtTime(32, at + 1.0)
    s.connect(env(c, at, 1.2, g, 0.003)).connect(o)
    const n = noise(c)
    n.connect(filt(c, 'lowpass', 900)).connect(env(c, at, 0.35, g * 0.3, 0.002)).connect(o)
    n.start(at), n.stop(at + 0.4)
  },
  /** one torn band of a glitch: a short square blip with a little noise, pitched per band */
  glitch(c, o, at, f, g = 0.035) {
    const hp = filt(c, 'highpass', 400)
    osc(c, 'square', f, at, at + 0.05).connect(hp)
    const n = noise(c)
    n.connect(filt(c, 'bandpass', f * 3, 3)).connect(hp)
    n.start(at), n.stop(at + 0.06)
    hp.connect(env(c, at, 0.045, g, 0.001)).connect(o)
  },
  /** aerosol: bright hiss with a fast flutter, held for exactly `dur` */
  spray(c, o, at, dur, g = 0.05) {
    const n = noise(c), hp = filt(c, 'highpass', 3500), e = c.createGain()
    e.gain.setValueAtTime(0.0001, at)
    e.gain.linearRampToValueAtTime(g, at + 0.04)
    e.gain.setValueAtTime(g, at + dur - 0.06)
    e.gain.linearRampToValueAtTime(0.0001, at + dur)
    const lfo = osc(c, 'sine', 23, at, at + dur), depth = c.createGain()
    depth.gain.value = g * 0.35
    lfo.connect(depth).connect(e.gain)
    n.connect(hp).connect(e).connect(o)
    n.start(at), n.stop(at + dur + 0.05)
  },
  /** glassy shimmer for light passing over metal */
  shimmer(c, o, at, dur = 0.5, g = 0.03) {
    const n = noise(c), bp = filt(c, 'bandpass', 2500, 6)
    bp.frequency.setValueAtTime(2500, at)
    bp.frequency.exponentialRampToValueAtTime(9000, at + dur)
    n.connect(bp).connect(env(c, at, dur, g, dur * 0.5)).connect(o)
    n.start(at), n.stop(at + dur + 0.05)
  },
  /** air rushing past, centred on `mid`: rises in, falls away (the light-bar wipe, the zoom-through) */
  swoosh(c, o, mid, dur = 0.5, g = 0.05) {
    const at = mid - dur / 2, n = noise(c), bp = filt(c, 'bandpass', 300, 0.9)
    bp.frequency.setValueAtTime(300, at)
    bp.frequency.exponentialRampToValueAtTime(2200, mid)
    bp.frequency.exponentialRampToValueAtTime(400, at + dur)
    const e = c.createGain()
    e.gain.setValueAtTime(0.0001, at)
    e.gain.exponentialRampToValueAtTime(g, mid)
    e.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    n.connect(bp).connect(e).connect(o)
    n.start(at), n.stop(at + dur + 0.05)
  },
  /** a soft low sonar ping (the lidar rings) */
  ping(c, o, at, g = 0.03, f = 196) {
    osc(c, 'sine', f, at, at + 0.6).connect(env(c, at, 0.6, g, 0.004)).connect(o)
    osc(c, 'sine', f * 1.5, at, at + 0.3).connect(env(c, at, 0.3, g * 0.3, 0.004)).connect(o)
  },
  glint(c, o, at, n = 76, g = 0.035) {
    for (const [m, k] of [[1, 1], [2.01, 0.4], [3.02, 0.2]]) osc(c, 'sine', hz(n) * m, at, at + 1.2).connect(env(c, at, 1.2 - m * 0.2, g * k, 0.003)).connect(o)
  },
  /** soft UI tap: a short pitched blip on a gentle low body (felt, not clicked) */
  tap(c, o, at, g = 0.08) {
    const s = osc(c, 'sine', 820, at, at + 0.07)
    s.frequency.exponentialRampToValueAtTime(520, at + 0.05)
    s.connect(env(c, at, 0.07, g, 0.001)).connect(o)
    osc(c, 'sine', 110, at, at + 0.12).connect(env(c, at, 0.12, g * 0.9, 0.002)).connect(o)
  },
  /** sample a 0..1 curve f(t) over [at, at+dur] onto an AudioParam */
  curve(param, at, dur, f, scale = 1, base = 0) {
    const n = Math.max(2, Math.ceil(dur * 60)), v = new Float32Array(n)
    for (let i = 0; i < n; i++) v[i] = base + scale * f((i / (n - 1)) * dur)
    param.setValueCurveAtTime(v, at, dur)
  },
  /** electric hum whose level follows `f(t)` (0..1), e.g. a pulse the picture also shows */
  hum(c, o, at, dur, f, g = 0.05, root = 55) {
    const e = c.createGain()
    e.gain.setValueAtTime(0, at)
    V.curve(e.gain, at, dur, f, g)
    const lp = filt(c, 'lowpass', 700)
    for (const [m, k] of [[1, 1], [2, 0.5], [3, 0.25]]) {
      const s = osc(c, m === 3 ? 'sawtooth' : 'sine', root * m, at, at + dur), kg = c.createGain()
      kg.gain.value = k
      s.connect(kg).connect(lp)
    }
    lp.connect(e).connect(o)
  },
  /** electric motor whine whose pitch and level follow speed `f(t)` (0..1) */
  motor(c, o, at, dur, f, g = 0.025) {
    const s = osc(c, 'triangle', 200, at, at + dur), e = c.createGain()
    V.curve(s.frequency, at, dur, f, 520, 180)
    e.gain.setValueAtTime(0, at)
    V.curve(e.gain, at, dur, f, g)
    s.connect(filt(c, 'lowpass', 2400)).connect(e).connect(o)
  },
}

// ---------------------------------------------------------------- timing from the visuals

/** The bands of glitchImage / glitchReveal (tesla.js) appear at p = show / 1.25 of a linear [a, b] transition. */
export function glitchHits(bands, a, b) {
  const out = []
  for (const [i, band] of bands.entries()) {
    const p = band.show / 1.25
    if (p > 0 && p < 1) out.push({ t: a + p * (b - a), f: 300 + ((i * 7919) % 9) * 140 })
  }
  return out.sort((x, y) => x.t - y.t).filter((h, i, all) => !i || h.t - all[i - 1].t > 0.008)
}
/** flash() (tesla.js): the white peaks at p = 0.4 of a linear [a, b] transition */
export const flashHit = (a, b) => a + 0.4 * (b - a)

// ---------------------------------------------------------------- music

/** Events for a groove between [from, to): kick/hat/clap/bass on a 120 BPM grid. `chord(t)` → [root, ...notes] */
export function groove(from, to, chord, { kick = true, clap = true, hats = true, bass = true, arp = false, level = 1, beat = 0.5 } = {}) {
  const ev = []
  for (let t = Math.ceil(from / (beat / 2) - 1e-6) * (beat / 2); t < to - 1e-6; t += beat / 2) {
    const q = Math.round(t / (beat / 2)) // 8th-note index
    const [root, ...notes] = chord(t)
    if (kick && q % 2 === 0) ev.push({ t, fn: (c, o, at) => V.kick(c, o, at, 0.5 * level) })
    if (clap && q % 4 === 2) ev.push({ t, fn: (c, o, at) => V.clap(c, o, at, 0.08 * level) })
    if (hats && q % 2 === 1) ev.push({ t, fn: (c, o, at) => V.hat(c, o, at, 0.035 * level, q % 8 === 7) })
    if (bass) ev.push({ t, fn: (c, o, at) => V.bass(c, o, at, hz(root - 12 + (q % 8 === 7 ? 12 : 0)), 0.2, (q % 2 ? 0.07 : 0.11) * level) })
    if (arp) ev.push({ t, fn: (c, o, at) => V.pluck(c, o, at, notes[q % notes.length], 0.03 * level) })
  }
  return ev
}
/** One pad chord per bar (2s) in [from, to). */
export function pads(from, to, chord, g = 0.016, bar = 2) {
  const ev = []
  for (let t = from; t < to - 1e-6; t = Math.floor(t / bar + 1 + 1e-6) * bar) {
    const end = Math.min(to, Math.floor(t / bar + 1 + 1e-6) * bar)
    const [, ...notes] = chord(t)
    ev.push({ t, fn: (c, o, at) => V.pad(c, o, at, notes, end - t + 0.15, g) })
  }
  return ev
}

// A minor, i – VI – III – VII: [bass root, ...chord]
export const CH = {
  Am: [45, 45, 48, 52, 59],
  F: [41, 45, 48, 53, 57],
  C: [48, 43, 48, 52, 55],
  G: [43, 43, 47, 50, 55],
}
