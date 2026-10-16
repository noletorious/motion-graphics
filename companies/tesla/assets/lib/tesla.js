// Tesla v1 shared scene + transitions. Imported by the Tesla pieces (relative path), ships with the company's assets.
// Everything here is driven by the piece's time `t`, so the preview and the MP4 export match frame for frame.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { buildStudio, loadModel } from './studio.js'
import { drawMap, drawAerial, SIZE, ROUTE } from './citymap.js'

export { THREE }
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

/** The 3D "Cybercab" lettering in champagne metal (its texture has a glitch, so one clean material). */
export async function loadLettering(width = 3.6, glow = 3.8) {
  const text = await loadModel(THREE, GLTFLoader, DRACOLoader, ASSETS + 'cybercab-text-compressed.glb', { length: width, solid: 0xead9b8, metalness: 0.85, roughness: 0.24 })
  text.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = false
    if (o.geometry.type === 'PlaneGeometry') o.visible = false // no contact shadow: it floats
    if (o.material.isMeshPhysicalMaterial) o.material.envMapIntensity = glow
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

/** A wide charging-pad outline around the car's footprint, pulsing warm. */
export function buildPad(st) {
  const group = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.66, 128), new THREE.MeshBasicMaterial({ color: 0xf3e3c3, transparent: true }))
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 128), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.08 }))
  for (const m of [ring, disc]) (m.rotation.x = -Math.PI / 2), m.scale.set(1, 0.52, 1)
  ring.position.y = 0.004
  disc.position.y = 0.003
  const glow = new THREE.PointLight(0xffd9a0, 8, 2.5)
  glow.position.set(0, 0.15, 0)
  group.add(ring, disc, glow)
  st.scene.add(group)
  return { group, pulse: (p) => ((ring.material.opacity = 0.55 + 0.45 * p), (disc.material.opacity = 0.05 + 0.1 * p), (glow.intensity = 4 + 6 * p)) }
}

// ---------------------------------------------------------------- transitions (DOM)

const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

function bandsFor(seed) {
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
