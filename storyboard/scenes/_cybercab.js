// Storyboard helper for Tesla v1: renders the visible shot's 3D pose with the supplied Cybercab GLB.
// A shot opts in with data-pose='{ "cam":[x,y,z], "look":[x,y,z], "rot":deg, "bar":0..1, "set":"studio|night|pad", "key":0..1 }'.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { buildStudio, loadModel, contactShadow } from '../../elements/models/studio.js'
import { drawMap, drawAerial, SIZE } from '../../elements/models/citymap.js'

window.__async = true
const shot = document.querySelector('.shot:not([hidden])')
const pose = shot?.dataset.pose && JSON.parse(shot.dataset.pose)
const canvas = document.getElementById('gl')
if (!pose) {
  canvas.style.display = 'none'
  window.__done = true
} else {
  const stage = document.querySelector('.stage')
  const [W, H] = [stage.offsetWidth, stage.offsetHeight]
  const st = buildStudio(THREE, RoomEnvironment, canvas, { w: W, h: H, alpha: ['night', 'amber', 'pad', 'void'].includes(pose.set) })
  void contactShadow
  // satin champagne, per Tesla's own imagery: cool the texture's orange cast a little
  const car = await loadModel(THREE, GLTFLoader, DRACOLoader, '../../companies/tesla/assets/cybercab_optimized.glb', { tint: 0xfff6ee, metalness: 0.45, roughness: 0.38 })
  st.scene.add(car)
  car.rotation.y = ((pose.rot ?? 0) * Math.PI) / 180
  car.visible = pose.car !== false
  if (pose.at) car.position.set(pose.at[0], 0, pose.at[1])

  // the model carries its own light line; this adds the glow it throws forward
  const glow = new THREE.PointLight(0xfff4e6, 1.2 * (pose.bar ?? 0), 1.6)
  glow.position.set(2.4, 0.75, 0)
  car.add(glow)

  st.key.intensity = 260 * (pose.key ?? 1)
  st.scene.environmentIntensity *= pose.env ?? 1
  st.rim.intensity *= pose.rim ?? 1
  if (pose.set === 'night') {
    st.scene.fog = null
    st.floor.material = new THREE.ShadowMaterial({ opacity: 0.65 }) // the wet street is the backdrop; the floor only adds shadow
    st.key.intensity *= 0.45
    st.scene.environmentIntensity *= 0.7
    st.key.position.set(-3, 9, 2)
    st.rim.color.set(0x9fb6ff)
  }
  if (pose.set === 'amber') {
    // Tesla's warm studio, lit like their photos: big soft sources, warm bounce, low contrast.
    // The light comes mostly from a custom environment (softboxes + amber walls) instead of hard lamps.
    st.scene.fog = null
    const env = new THREE.Scene()
    env.background = new THREE.Color(0x6b4a2c)
    const box = (w, h, color, pos, rot = [0, 0, 0]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }))
      m.position.set(...pos)
      m.rotation.set(...rot)
      env.add(m)
    }
    box(16, 10, 0xfff6ea, [0, 9, 0], [Math.PI / 2, 0, 0]) // overhead softbox
    box(12, 6, 0xfff0e0, [9, 5, 6], [0, -Math.PI / 3, 0]) // front-side softbox: the bright sheen along the body
    box(10, 5, 0xf0caa0, [0, 3, -9]) // warm back wall
    box(10, 5, 0xdcae7c, [-9, 3, 0], [0, Math.PI / 2, 0]) // amber side bounce
    box(10, 5, 0xe8c294, [9, 3, 0], [0, -Math.PI / 2, 0])
    box(30, 30, 0xd9b48c, [0, -0.5, 0], [-Math.PI / 2, 0, 0]) // cream floor bounce
    const pm = new THREE.PMREMGenerator(st.renderer)
    st.scene.environment = pm.fromScene(env, 0.06).texture
    st.scene.environmentIntensity = 2.0
    st.key.intensity = 60 // a soft top light just for the shadow
    st.key.angle = 0.9
    st.key.penumbra = 1
    st.key.color.set(0xfff0dc)
    st.key.position.set(0.5, 10, 1.5)
    st.renderer.shadowMap.type = THREE.PCFShadowMap
    st.key.shadow.radius = 14
    st.rim.intensity = 0.35
    st.rim.color.set(0xffc58a)
    st.fill.intensity = 0.15
    st.floor.material = new THREE.ShadowMaterial({ opacity: 0.3 })
    car.traverse((o) => {
      if (o.isMesh && o.material.isMeshPhysicalMaterial) {
        Object.assign(o.material, { roughness: 0.48, metalness: 0.32, clearcoat: 0.25, clearcoatRoughness: 0.45 })
        o.material.color.set(0xe4e7ee) // pull the texture's orange toward Tesla's pale champagne
      }
    })
  }
  if (pose.set === 'void') {
    // dark void for the lettering: warm soft env, very low key, the floor only holds shadow
    st.scene.fog = null
    const env = new THREE.Scene()
    env.background = new THREE.Color(0x0a0705)
    const soft = (w, h, color, pos, rot = [0, 0, 0]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }))
      m.position.set(...pos); m.rotation.set(...rot); env.add(m)
    }
    soft(16, 6, 0xfff0dc, [0, 9, 0], [Math.PI / 2, 0, 0])
    soft(3, 9, 0xffd7a8, [-7, 3, 4], [0, Math.PI / 3, 0]) // a tall warm strip: the long glint along metal
    soft(3, 9, 0xffe6c8, [7, 3, -2], [0, -Math.PI / 2.5, 0])
    st.scene.environment = new THREE.PMREMGenerator(st.renderer).fromScene(env, 0.05).texture
    st.scene.environmentIntensity = 0.9 * (pose.env ?? 1)
    st.key.intensity = 30
    st.key.penumbra = 1
    st.rim.intensity = 0.5
    st.rim.color.set(0xffc58a)
    st.fill.intensity = 0.05
    st.floor.material = new THREE.ShadowMaterial({ opacity: 0.5 })
  }
  if (pose.text) {
    // the 3D "Cybercab" lettering, champagne metal (its texture has a glitch, so it gets one clean material)
    const t = pose.text
    const text = await loadModel(THREE, GLTFLoader, DRACOLoader, '../../companies/tesla/assets/cybercab-text-compressed.glb', { length: t.w ?? 2.8, solid: 0xead9b8, metalness: 0.85, roughness: 0.24 })
    text.children.forEach((c) => c.type === 'Mesh' && c.geometry.type === 'PlaneGeometry' && (c.visible = false)) // no contact shadow for a floating object
    // brighter than the scene: the lettering is the hero, so its metal picks up more of the softboxes
    text.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = false // floating: no shadow on the floor
      if (o.material.isMeshPhysicalMaterial) o.material.envMapIntensity = t.glow ?? 2.4
    })
    text.position.set(t.x ?? 0, t.y ?? 2.2, t.z ?? 0)
    text.rotation.y = ((t.rot ?? 0) * Math.PI) / 180
    st.scene.add(text)
  }
  if (pose.set === 'pad') {
    st.scene.fog = null
    st.floor.material = new THREE.ShadowMaterial({ opacity: 0.65 })
    // inductive charging pad glowing under the car
    // a wide glowing outline around the car's footprint, so the pad reads even with the car on it
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.66, 128), new THREE.MeshBasicMaterial({ color: 0xf3e3c3 }))
    ring.rotation.x = -Math.PI / 2
    ring.scale.set(1, 0.52, 1)
    ring.position.set(0, 0.004, 0)
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 128), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.08 }))
    disc.rotation.x = -Math.PI / 2
    disc.scale.set(1, 0.52, 1)
    disc.position.set(0, 0.003, 0)
    st.scene.add(ring, disc)
    const padGlow = new THREE.PointLight(0xffd9a0, 8, 2.5)
    padGlow.position.set(-0.2, 0.15, 0)
    st.scene.add(padGlow)
  }
  if (pose.set === 'map' || pose.set === 'aerial') {
    // top-down city: the map and the satellite view share one street layout; "mix" dissolves between them
    st.scene.fog = null
    st.scene.background = new THREE.Color(0x111214)
    st.floor.visible = false
    const plane = (canvas, opacity) => {
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshBasicMaterial({ map: tex, transparent: opacity < 1, opacity }))
      m.rotation.x = -Math.PI / 2
      return m
    }
    const mix = pose.mix ?? (pose.set === 'aerial' ? 1 : 0)
    // only the layers in view, separated enough not to flicker; the satellite draws on top while dissolving
    if (mix < 1) st.scene.add(plane(drawMap(document.createElement('canvas')), 1))
    if (mix > 0) {
      const aerial = plane(drawAerial(document.createElement('canvas')), mix)
      aerial.position.y = 0.02
      aerial.renderOrder = 1
      st.scene.add(aerial)
    }
    st.key.position.set(car.position.x + 3, 14, car.position.z + 4)
    st.key.target.position.copy(car.position)
  }
  if (pose.set === 'amber') st.renderer.toneMappingExposure = 1.12
  st.camera.fov = pose.fov ?? 30
  // shift the framing (fractions of the frame) to leave room for type: + moves the car left / up
  if (pose.shift) st.camera.setViewOffset(W, H, (pose.shift[0] ?? 0) * W, (pose.shift[1] ?? 0) * H, W, H)
  st.camera.updateProjectionMatrix()
  st.camera.position.set(...pose.cam)
  st.camera.lookAt(...(pose.look ?? [0, 0.6, 0]))
  st.renderer.render(st.scene, st.camera)
  window.__done = true
}
