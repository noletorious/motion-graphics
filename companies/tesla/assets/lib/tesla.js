// Tesla v1 shared scene + transitions. Imported by the Tesla pieces (relative path), ships with the company's assets.
// Everything here is driven by the piece's time `t`, so the preview and the MP4 export match frame for frame.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { buildStudio, loadModel } from './studio.js'
import { drawMap, drawAerial, SIZE, ROUTE } from './citymap.js'

export { THREE, drawMap, ROUTE }
const ASSETS = new URL('../', import.meta.url).href // companies/tesla/assets/

/** One renderer for a piece: a transparent canvas over CSS backdrops (void, photos, night). */
export function createWorld(canvas, w, h) {
  const st = buildStudio(THREE, RoomEnvironment, canvas, { w, h, alpha: true })
  st.scene.fog = null
  st.floor.material = new THREE.ShadowMaterial({ opacity: 0.5 })
  st.renderer.shadowMap.type = THREE.PCFShadowMap
  st.key.shadow.radius = 14
  st.key.penumbra = 1
  return st
}

/** The dark void: warm softbox environment (glints on metal), a very low key, shadow-only floor. */
export function voidLighting(st, env = 1) {
  const e = new THREE.Scene()
  e.background = new THREE.Color(0x0a0705)
  const soft = (w, h, color, pos, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }))
    m.position.set(...pos)
    m.rotation.set(...rot)
    e.add(m)
  }
  soft(16, 6, 0xfff0dc, [0, 9, 0], [Math.PI / 2, 0, 0])
  soft(3, 9, 0xffd7a8, [-7, 3, 4], [0, Math.PI / 3, 0])
  soft(3, 9, 0xffe6c8, [7, 3, -2], [0, -Math.PI / 2.5, 0])
  st.scene.environment = new THREE.PMREMGenerator(st.renderer).fromScene(e, 0.05).texture
  st.scene.environmentIntensity = 0.9 * env
  st.key.intensity = 30
  st.rim.intensity = 0.5
  st.rim.color.set(0xffc58a)
  st.fill.intensity = 0.05
}

/** The Cybercab (supplied GLB), satin champagne, with a forward glow for its light bar. */
export async function loadCar() {
  const car = await loadModel(THREE, GLTFLoader, DRACOLoader, ASSETS + 'cybercab_optimized.glb', { tint: 0xfff6ee, metalness: 0.45, roughness: 0.38 })
  const glow = new THREE.PointLight(0xfff4e6, 0, 1.6)
  glow.position.set(2.4, 0.75, 0)
  car.add(glow)
  car.userData.setBar = (p) => (glow.intensity = 1.2 * p)
  return car
}

/** A reflection map of soft rainbow light panels on black: what the chrome lettering mirrors. */
let rainbowTex = null
export function rainbowEnv(renderer) {
  if (rainbowTex) return rainbowTex
  const e = new THREE.Scene()
  e.background = new THREE.Color(0x030303)
  // a ring of saturated hue bands all the way round, bright at the horizon, falling to black above and below
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')
  for (let x = 0; x < 1024; x++) {
    const h = ((x / 1024) * 5) % 1 // the spectrum five times around, so every view angle catches several hues
    g.fillStyle = `hsl(${h * 360},100%,55%)`
    g.fillRect(x, 0, 1, 256)
  }
  const fade = g.createLinearGradient(0, 0, 0, 256)
  fade.addColorStop(0, 'rgba(0,0,0,1)')
  fade.addColorStop(0.35, 'rgba(0,0,0,0)')
  fade.addColorStop(0.65, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,1)')
  g.fillStyle = fade
  g.fillRect(0, 0, 1024, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 10, 96, 1, true), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }))
  ring.position.y = 2
  e.add(ring)
  // one small white strip overhead for a crisp chrome highlight
  const top = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }))
  top.position.set(0, 8, 0)
  top.rotation.x = Math.PI / 2
  e.add(top)
  rainbowTex = new THREE.PMREMGenerator(renderer).fromScene(e, 0.03).texture
  return rainbowTex
}

/**
 * The 3D "Cybercab" lettering (its texture has a glitch, so one clean material).
 * Default: champagne metal. With `rainbow: renderer`: iridescent chrome that mirrors rainbowEnv.
 */
export async function loadLettering(width = 3.6, glow = 3.8, { rainbow = null } = {}) {
  const text = await loadModel(THREE, GLTFLoader, DRACOLoader, ASSETS + 'cybercab-text-compressed.glb', { length: width, solid: 0xead9b8, metalness: 0.85, roughness: 0.24 })
  const env = rainbow && rainbowEnv(rainbow)
  text.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = false
    if (o.geometry.type === 'PlaneGeometry') o.visible = false // no contact shadow: it floats
    if (!o.material.isMeshPhysicalMaterial) return
    if (env)
      o.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 1, roughness: 0.08, normalMap: o.material.normalMap, envMap: env, envMapIntensity: glow * 0.5,
        iridescence: 0.5, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 700], clearcoat: 1, clearcoatRoughness: 0.05,
      })
    else o.material.envMapIntensity = glow
  })
  return text
}

/** Top-down city: map + satellite planes (cross-dissolve) and the route as an animated ribbon. */
export function buildCity(st) {
  const group = new THREE.Group()
  const plane = (canvas) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
    m.rotation.x = -Math.PI / 2
    return m
  }
  const map = plane(drawMap(document.createElement('canvas'), { route: false }))
  const aerial = plane(drawAerial(document.createElement('canvas'), { route: false }))
  aerial.position.y = 0.02
  aerial.renderOrder = 1
  // route ribbon along street centre lines, drawn on by a draw range
  const pts = ROUTE.map(([x, z]) => new THREE.Vector3(x, 0.06, z))
  const path = new THREE.CurvePath()
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]))
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(path, 400, 0.55, 6), new THREE.MeshBasicMaterial({ color: 0xe9d3a6 }))
  ribbon.scale.y = 0.05
  ribbon.renderOrder = 2
  const total = ribbon.geometry.index.count
  group.add(map, aerial, ribbon)
  st.scene.add(group)
  const lengths = pts.slice(1).map((p, i) => p.distanceTo(pts[i])), full = lengths.reduce((a, b) => a + b)
  return {
    group,
    /** mix 0 = map, 1 = satellite; route 0..1 drawn */
    set(mix, route) {
      map.material.opacity = 1
      aerial.material.opacity = mix
      aerial.visible = mix > 0.001
      ribbon.geometry.setDrawRange(0, Math.floor((total * route) / 6) * 6)
    },
    /** position + heading along the route at fraction u */
    at(u) {
      let d = u * full
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i] || i === lengths.length - 1) {
          const a = pts[i], b = pts[i + 1], f = Math.min(1, d / lengths[i])
          return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, heading: Math.atan2(-(b.z - a.z), b.x - a.x) }
        }
        d -= lengths[i]
      }
    },
  }
}

/** The charging pad: a green outline around the car's footprint, a glow beneath, and pulses rippling out from under it. */
export function buildPad(st) {
  const GREEN = 0x3ee07f
  const group = new THREE.Group()
  const flat = (geo, color, opacity, y) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }))
    m.rotation.x = -Math.PI / 2
    m.scale.set(1, 0.52, 1)
    m.position.y = y
    group.add(m)
    return m
  }
  const ring = flat(new THREE.RingGeometry(2.55, 2.66, 128), GREEN, 0.9, 0.004)
  const disc = flat(new THREE.CircleGeometry(2.55, 128), GREEN, 0.12, 0.003)
  const waves = [0, 1, 2].map(() => flat(new THREE.RingGeometry(0.96, 1, 128), GREEN, 0, 0.005))
  const glow = new THREE.PointLight(GREEN, 8, 3.2)
  glow.position.set(0, 0.15, 0)
  group.add(glow)
  st.scene.add(group)
  const PERIOD = 0.75
  return {
    group,
    /** tt: seconds since the shot began. Waves leave the car's centre every PERIOD and fade at the outline. */
    set(tt) {
      const beat = (tt % PERIOD) / PERIOD
      const thump = Math.exp(-beat * 5) // bright right as a wave leaves
      ring.material.opacity = 0.55 + 0.45 * thump
      disc.material.opacity = 0.08 + 0.18 * thump
      glow.intensity = 5 + 9 * thump
      waves.forEach((w, i) => {
        const ph = ((tt + i * PERIOD) % (3 * PERIOD)) / (3 * PERIOD)
        w.scale.set(0.6 + 2.2 * ph, (0.6 + 2.2 * ph) * 0.52, 1)
        w.material.opacity = tt < i * PERIOD ? 0 : 0.85 * (1 - ph)
      })
    },
    PERIOD,
  }
}

/**
 * The drive: the car holds still while the world streams past at speed (grid, lane dashes, light
 * streaks, gates overhead), lidar rings sweep out from the car and route chevrons glow ahead of it.
 */
export function buildDrive(st, { speed = 16 } = {}) {
  const group = new THREE.Group()
  const r = rng(21)
  const add = (geo, color, opacity, additive = true) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }))
    group.add(m)
    return m
  }
  // ground grid (4m cells), scrolled by texture offset
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#08090c'
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(233,211,166,.38)'
  g.lineWidth = 2
  g.strokeRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(190,220,255,.1)'
  for (let i = 1; i < 4; i++) (g.beginPath(), g.moveTo(i * 64, 0), g.lineTo(i * 64, 256), g.moveTo(0, i * 64), g.lineTo(256, i * 64), g.stroke())
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(40, 40)
  tex.anisotropy = 8
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ map: tex }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.003
  group.add(ground)
  // lane edges: dashes either side of the car
  const dashes = []
  for (const z of [-2.1, 2.1]) for (let i = 0; i < 26; i++) {
    const d = add(new THREE.PlaneGeometry(2, 0.09), 0xf3e3c3, 0.85)
    d.rotation.x = -Math.PI / 2
    d.position.set(0, 0.004, z)
    dashes.push({ m: d, x0: -40 + i * 4 })
  }
  // route chevrons ahead of the car, in its lane
  const chev = new THREE.Shape()
  chev.moveTo(0, 0.7), chev.lineTo(0.55, 0), chev.lineTo(0, -0.7), chev.lineTo(-0.25, -0.7), chev.lineTo(0.3, 0), chev.lineTo(-0.25, 0.7)
  const chevrons = []
  for (let i = 0; i < 12; i++) {
    const m = add(new THREE.ShapeGeometry(chev), 0xe9d3a6, 0)
    m.rotation.x = -Math.PI / 2
    m.position.y = 0.006
    chevrons.push({ m, x0: 3 + i * 1.8 })
  }
  // light streaks in the air either side
  const streaks = []
  for (let i = 0; i < 90; i++) {
    const side = r() < 0.5 ? -1 : 1
    const m = add(new THREE.BoxGeometry(3 + r() * 6, 0.025, 0.025), r() < 0.3 ? 0xbfe6ff : r() < 0.6 ? 0xf3e3c3 : 0xffffff, 0.35 + r() * 0.5)
    // far side: anywhere up to 4.8m high; camera side: low and close to the road, so none cross the lens
    const far = side < 0
    streaks.push({ m, x0: -60 + r() * 120, y: far ? 0.3 + r() * 4.5 : 0.08 + r() * 0.5, z: far ? -(3.5 + r() * 12) : 2.9 + r() * 1.3, v: 1.6 + r() * 1.8 })
  }
  // gates overhead: thin frames the car passes under
  const gates = []
  for (let i = 0; i < 4; i++) {
    const gate = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: 0xf3e3c3, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
    const post = (z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.2, 0.06), mat)
      m.position.set(0, 2.1, z)
      gate.add(m)
    }
    post(-3.6), post(3.6)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.2), mat)
    beam.position.set(0, 4.2, 0)
    gate.add(beam)
    group.add(gate)
    gates.push({ g: gate, x0: 10 + i * 22 })
  }
  // lidar: rings sweeping out from the car
  const lidar = [0, 1, 2, 3].map(() => {
    const m = add(new THREE.RingGeometry(0.97, 1, 160), 0xbfe6ff, 0)
    m.rotation.x = -Math.PI / 2
    m.position.y = 0.008
    return m
  })
  st.scene.add(group)
  const wrap = (x, lo, hi) => lo + ((((x - lo) % (hi - lo)) + (hi - lo)) % (hi - lo))
  return {
    group,
    LIDAR: 0.6,
    /** tt: seconds since the drive began */
    set(tt) {
      const d = tt * speed
      tex.offset.x = (d / 4) % 1
      for (const s of dashes) s.m.position.x = wrap(s.x0 - d, -50, 54)
      for (const s of chevrons) {
        const x = wrap(s.x0 - d * 0.5, 3, 24.6) // they drift toward the car slower than the ground: the route ahead
        s.m.position.x = x
        s.m.material.opacity = 0.9 * Math.min(1, (x - 3) / 2) * Math.min(1, (24.6 - x) / 6)
      }
      for (const s of streaks) s.m.position.set(wrap(s.x0 - d * s.v, -60, 60), s.y, s.z)
      for (const s of gates) s.g.position.x = wrap(s.x0 - d, -30, 58)
      lidar.forEach((m, i) => {
        const ph = ((tt + i * 0.6) % 2.4) / 2.4
        m.scale.setScalar(2.4 + 16 * ph)
        m.material.opacity = tt < i * 0.6 ? 0 : 0.7 * (1 - ph) ** 1.5
      })
    },
  }
}

// ---------------------------------------------------------------- transitions (DOM)

const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

/** The torn bands of a glitch (seeded); sound.js times one hit per band from these. */
export function bandsFor(seed) {
  const r = rng(seed), bands = []
  let y = 0
  while (y < 100) {
    const h = 4 + r() * 11
    bands.push({ top: y, bottom: Math.min(100, y + h), dx: (r() - 0.5) * 460, show: r() * 0.7 })
    y += h
  }
  return bands
}

/**
 * Glitch slice into a photo: torn horizontal bands of the incoming image slide into place, each with
 * its own offset and a red/cyan fringe. `host` is an empty layer above the outgoing shot. p: 0 → 1.
 */
export function glitchImage(host, img, p, seed = 3) {
  if (!host._bands) {
    host._bands = bandsFor(seed).map((b) => {
      const d = document.createElement('div')
      d.style.cssText = `position:absolute;inset:0;background:url(${img.src}) ${img.x ?? '50%'} ${img.y ?? '50%'}/cover;transform-origin:${img.x ?? '50%'} ${img.y ?? '50%'};clip-path:inset(${b.top}% 0 ${100 - b.bottom}% 0)`
      host.appendChild(d)
      return { ...b, d }
    })
  }
  const on = p > 0 && p < 1
  host.style.display = on ? 'block' : 'none'
  if (!on) return
  for (const b of host._bands) {
    const live = b.show < p * 1.25
    const k = Math.max(0, 1 - p * 1.1)
    b.d.style.display = live ? 'block' : 'none'
    b.d.style.transform = `translateX(${b.dx * k}px) scale(${img.s ?? 1})`
    b.d.style.filter = k > 0.05 ? `drop-shadow(${10 * k}px 0 0 rgba(255,0,70,.6)) drop-shadow(${-10 * k}px 0 0 rgba(0,255,230,.6))` : 'none'
  }
}

/** Glitch reveal of any layer (e.g. the 3D canvas): it appears band by band with a jitter. p: 0 → 1. */
export function glitchReveal(el, p, seed = 5) {
  el._bands ??= bandsFor(seed)
  if (p >= 1) return void ((el.style.clipPath = 'none'), (el.style.transform = 'none'))
  const W = el.offsetWidth, H = el.offsetHeight
  const live = el._bands.filter((b) => b.show < p * 1.25)
  el.style.clipPath = live.length ? `path(evenodd, '${live.map((b) => `M0 ${(b.top * H) / 100}H${W}V${(b.bottom * H) / 100}H0Z`).join(' ')}')` : 'inset(0 0 100% 0)'
  el.style.transform = `translateX(${Math.sin(p * 47) * 36 * (1 - p)}px)`
}

/** Light-bar flash: a white line opens across the frame, then a full white flash fades. p: 0 → 1. */
export function flash(line, white, p) {
  const open = Math.min(1, p / 0.4), fade = Math.max(0, (p - 0.4) / 0.6)
  line.style.opacity = p > 0 && p < 1 ? 1 - fade : 0
  line.style.transform = `scaleX(${open})`
  white.style.opacity = p > 0.35 && p < 1 ? (1 - fade) * 0.9 : 0
}

/** Light-bar wipe: the incoming layer is revealed left to right behind a bright vertical line. p: 0 → 1. */
export function lightWipe(incoming, line, p) {
  const on = p > 0 && p < 1
  incoming.style.clipPath = p >= 1 ? 'none' : `inset(0 ${(1 - Math.max(0, p)) * 100}% 0 0)`
  line.style.opacity = on ? 1 : 0
  line.style.transform = `translateX(${p * 1920}px)`
}
