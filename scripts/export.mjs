// Renders pieces to MP4: steps every frame in headless Chrome, pipes PNGs
// to ffmpeg, renders the Web Audio graph offline, muxes both, then checks
// the result with ffprobe.
// Usage: npm run export -- <slug>/<piece> | <slug> | --all  [--fps 60]
import fs from 'fs'
import path from 'path'
import { spawn, execFileSync } from 'child_process'
import { ROOT, findPieces, launch, openPiece } from './lib.mjs'

const args = process.argv.slice(2)
const fpsAt = args.indexOf('--fps')
const FPS = fpsAt >= 0 ? Number(args.splice(fpsAt, 2)[1]) : 60
const targets = args.includes('--all') ? findPieces() : findPieces(args)
if (!targets.length) {
  console.error('Usage: npm run export -- <slug>/<piece> | <slug> | --all [--fps 60]')
  process.exit(1)
}
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'

const browser = await launch()
for (const p of targets) {
  const { page, width, height, duration } = await openPiece(browser, p.file)
  const outDir = path.join(ROOT, 'exports', p.slug)
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `${p.name}.mp4`)
  const wav = path.join(outDir, `${p.name}.wav`)
  console.log(`▶ ${p.slug}/${p.name}  ${width}×${height}  ${duration}s @ ${FPS}fps`)

  // 1 · audio, rendered offline from the same sound events the preview plays
  const b64 = await page.evaluate(async () => {
    const sr = 48000
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * piece.duration), sr)
    piece.buildAudio(ctx, 0)
    const buf = await ctx.startRendering()
    const [L, R] = [buf.getChannelData(0), buf.getChannelData(1)]
    const n = L.length, data = new DataView(new ArrayBuffer(44 + n * 4))
    const str = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)))
    str(0, 'RIFF'); data.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt ')
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true)
    data.setUint32(24, sr, true); data.setUint32(28, sr * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true)
    str(36, 'data'); data.setUint32(40, n * 4, true)
    for (let i = 0; i < n; i++) {
      data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true)
      data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true)
    }
    let s = ''
    const u8 = new Uint8Array(data.buffer)
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
    return btoa(s)
  })
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'))

  // 2 · video: seek → screenshot → pipe, frame by frame
  const ff = spawn(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k',
    '-t', String(duration), '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))))
  const cdp = await page.createCDPSession()
  const frames = Math.round(duration * FPS)
  const t0 = Date.now()
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => piece.seek(t), f / FPS)
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r))
    if (f % FPS === 0) process.stdout.write(`\r  frame ${f}/${frames}`)
  }
  ff.stdin.end()
  await done
  fs.unlinkSync(wav)
  await page.close()

  // 3 · verify
  const probe = JSON.parse(execFileSync(FFMPEG.replace(/ffmpeg$/, 'ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', out]).toString())
  const v = probe.streams.find((s) => s.codec_type === 'video'), a = probe.streams.find((s) => s.codec_type === 'audio')
  const ok = v && a && v.width === width && v.height === height && Math.abs(Number(probe.format.duration) - duration) < 0.1
  console.log(`\r  ${ok ? '✓' : '✗'} ${path.relative(ROOT, out)}  ${v?.width}×${v?.height}  ${Number(probe.format.duration).toFixed(2)}s  ${v?.r_frame_rate}fps  audio:${a ? a.codec_name : 'none'}  ${(Number(probe.format.size) / 1e6).toFixed(1)}MB  (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
await browser.close()
