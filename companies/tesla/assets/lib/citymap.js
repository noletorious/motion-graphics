// One city block layout, drawn two ways: a clean dark map and a satellite-style aerial.
// Same streets in both, so a shot can dissolve map → satellite and everything lines up.
// World units are metres; the texture covers SIZE × SIZE metres centred on the origin (x right, z down).

export const SIZE = 80
const PX = 2048 / SIZE // pixels per metre
const ROAD = 10
// streets: vertical (constant x) and horizontal (constant z), in metres
export const STREETS = { x: [-24, 0, 24], z: [-20, 4, 28] }
// the route the car follows, along street centre lines
export const ROUTE = [[-24, 38], [-24, 4], [0, 4], [0, -20], [24, -20], [38, -20]]

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}
const toPx = (m) => (m + SIZE / 2) * PX

function blocks() {
  // the rectangles between streets (and the border)
  const xs = [-SIZE / 2, ...STREETS.x, SIZE / 2], zs = [-SIZE / 2, ...STREETS.z, SIZE / 2]
  const out = []
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + (i ? ROAD / 2 : 0), x1 = xs[i + 1] - (i < xs.length - 2 ? ROAD / 2 : 0)
      const z0 = zs[j] + (j ? ROAD / 2 : 0), z1 = zs[j + 1] - (j < zs.length - 2 ? ROAD / 2 : 0)
      if (x1 - x0 > 2 && z1 - z0 > 2) out.push([x0, z0, x1, z1])
    }
  return out
}

function route(g, color, width, glow) {
  g.save()
  g.strokeStyle = color
  g.lineWidth = width * PX
  g.lineJoin = g.lineCap = 'round'
  if (glow) (g.shadowColor = color), (g.shadowBlur = glow)
  g.beginPath()
  ROUTE.forEach(([x, z], i) => (i ? g.lineTo(toPx(x), toPx(z)) : g.moveTo(toPx(x), toPx(z))))
  g.stroke()
  g.restore()
}

/** Clean dark map: blocks, streets, a park, the route in champagne. */
export function drawMap(canvas, { route: withRoute = true } = {}) {
  canvas.width = canvas.height = 2048
  const g = canvas.getContext('2d')
  g.fillStyle = '#2a2d33'
  g.fillRect(0, 0, 2048, 2048)
  blocks().forEach(([x0, z0, x1, z1], k) => {
    g.fillStyle = k === 4 ? '#1f2b24' : '#1a1c21' // one park
    const r = 1.2 * PX
    g.beginPath()
    g.roundRect(toPx(x0) + 2, toPx(z0) + 2, (x1 - x0) * PX - 4, (z1 - z0) * PX - 4, r)
    g.fill()
  })
  // thin centre lines on the streets
  g.strokeStyle = 'rgba(255,255,255,.06)'
  g.lineWidth = 2
  for (const x of STREETS.x) (g.beginPath(), g.moveTo(toPx(x), 0), g.lineTo(toPx(x), 2048), g.stroke())
  for (const z of STREETS.z) (g.beginPath(), g.moveTo(0, toPx(z)), g.lineTo(2048, toPx(z)), g.stroke())
  // street names, set along the streets like a real map
  g.fillStyle = 'rgba(255,255,255,.38)'
  g.font = `500 ${1.5 * PX}px Manrope, Inter, sans-serif`
  g.textBaseline = 'middle'
  const names = { x: ['Linden Ave', 'Mercer St', 'Hollis Ave'], z: ['Ash St', 'Grand St', 'Bay St'] }
  STREETS.z.forEach((z, i) => g.fillText(names.z[i].toUpperCase(), toPx(-SIZE / 2 + 3), toPx(z)))
  STREETS.x.forEach((x, i) => (g.save(), g.translate(toPx(x), toPx(SIZE / 2 - 3)), g.rotate(-Math.PI / 2), g.fillText(names.x[i].toUpperCase(), 0, 0), g.restore()))
  if (withRoute) route(g, '#e9d3a6', 1.2, 30)
  // start and end markers
  for (const [x, z] of withRoute ? [ROUTE[0], ROUTE[ROUTE.length - 1]] : []) {
    g.fillStyle = '#e9d3a6'
    g.beginPath()
    g.arc(toPx(x), toPx(z), 1.4 * PX, 0, Math.PI * 2)
    g.fill()
  }
  return canvas
}

/** Satellite-style aerial: asphalt, sidewalks, rooftops with shadows, trees, lane markings, crosswalks. */
export function drawAerial(canvas, { seed = 7, routeAlpha = 0.9, route: withRoute = true } = {}) {
  canvas.width = canvas.height = 2048
  const g = canvas.getContext('2d'), r = rng(seed)
  // asphalt with grain
  g.fillStyle = '#34363a'
  g.fillRect(0, 0, 2048, 2048)
  for (let i = 0; i < 26000; i++) {
    const v = 40 + r() * 30
    g.fillStyle = `rgba(${v},${v},${v + 3},.35)`
    g.fillRect(r() * 2048, r() * 2048, 2, 2)
  }
  const roofs = ['#6d6b66', '#8e8273', '#5e6267', '#a39b8e', '#7a7470', '#4f5357', '#9a8b78', '#b0a89b']
  blocks().forEach(([x0, z0, x1, z1], k) => {
    // sidewalk ring
    g.fillStyle = '#8b8a85'
    g.fillRect(toPx(x0), toPx(z0), (x1 - x0) * PX, (z1 - z0) * PX)
    const ix0 = x0 + 2.5, iz0 = z0 + 2.5, ix1 = x1 - 2.5, iz1 = z1 - 2.5
    if (k === 4) {
      // park: grass and tree canopy
      g.fillStyle = '#3d4f33'
      g.fillRect(toPx(ix0), toPx(iz0), (ix1 - ix0) * PX, (iz1 - iz0) * PX)
      for (let t = 0; t < 220; t++) tree(g, toPx(ix0 + r() * (ix1 - ix0)), toPx(iz0 + r() * (iz1 - iz0)), (0.7 + r() * 1.1) * PX, r)
      return
    }
    // buildings: split the block into lots, each a roof with a drop shadow and rooftop units
    let x = ix0
    while (x < ix1 - 2) {
      const w = Math.min(ix1 - x, 3 + r() * 5)
      let z = iz0
      while (z < iz1 - 2) {
        const d = Math.min(iz1 - z, 3.5 + r() * 6)
        const px = toPx(x), pz = toPx(z), pw = (w - 0.4) * PX, pd = (d - 0.4) * PX, h = 0.6 + r() * 2.2
        g.fillStyle = 'rgba(0,0,0,.35)'
        g.fillRect(px + h * PX * 0.5, pz + h * PX * 0.5, pw, pd)
        g.fillStyle = roofs[Math.floor(r() * roofs.length)]
        g.fillRect(px, pz, pw, pd)
        // roof texture: faint grain so it reads as photo, not flat colour
        for (let n = 0; n < pw * pd / 60; n++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},.06)`; g.fillRect(px + r() * pw, pz + r() * pd, 3, 3) }
        g.fillStyle = 'rgba(255,255,255,.10)'
        g.fillRect(px, pz, pw, 3)
        g.fillRect(px, pz, 3, pd)
        for (let u = 0; u < 1 + r() * 3; u++) {
          g.fillStyle = 'rgba(210,210,205,.55)'
          g.fillRect(px + r() * (pw - 20), pz + r() * (pd - 20), 14 + r() * 16, 10 + r() * 14)
        }
        z += d
      }
      x += w
    }
    // street trees along the sidewalk
    for (let t = 0; t < 10; t++) tree(g, toPx(x0 + 1.2 + r() * (x1 - x0 - 2.4)), toPx(r() < 0.5 ? z0 + 1.2 : z1 - 1.2), (0.7 + r() * 0.6) * PX, r)
  })
  // lane markings and crosswalks
  g.strokeStyle = 'rgba(235,225,190,.75)'
  g.lineWidth = 0.15 * PX
  g.setLineDash([3 * PX, 3 * PX])
  for (const x of STREETS.x) (g.beginPath(), g.moveTo(toPx(x), 0), g.lineTo(toPx(x), 2048), g.stroke())
  for (const z of STREETS.z) (g.beginPath(), g.moveTo(0, toPx(z)), g.lineTo(2048, toPx(z)), g.stroke())
  g.setLineDash([])
  g.fillStyle = 'rgba(240,240,235,.8)'
  for (const x of STREETS.x)
    for (const z of STREETS.z)
      for (let s = -4; s <= 4; s += 1) {
        g.fillRect(toPx(x + s) - 6, toPx(z - ROAD / 2 - 2.2), 12, 1.6 * PX)
        g.fillRect(toPx(x - ROAD / 2 - 2.2), toPx(z + s) - 6, 1.6 * PX, 12)
      }
  if (withRoute) route(g, `rgba(233,211,166,${routeAlpha})`, 1.1, 40)
  return canvas
}

function tree(g, x, y, rad, r) {
  g.fillStyle = 'rgba(0,0,0,.35)'
  g.beginPath()
  g.arc(x + rad * 0.35, y + rad * 0.35, rad, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = `rgb(${30 + r() * 18},${46 + r() * 22},${28 + r() * 12})`
  g.beginPath()
  g.arc(x, y, rad, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,.08)'
  g.beginPath()
  g.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.5, 0, Math.PI * 2)
  g.fill()
}
