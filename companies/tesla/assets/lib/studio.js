// 3D studio for product pieces: renderer, lights, floor, and loaders for supplied GLB models.
// Products come from real 3D files in companies/<slug>/assets/ (e.g. the Cybercab GLB), never hand-built.
//
// usage: const st = buildStudio(THREE, RoomEnvironment, canvas, { w, h })
//        const car = await loadModel(THREE, GLTFLoader, DRACOLoader, url, { length: 4.2 })
//        st.scene.add(car); st.renderer.render(st.scene, st.camera)

export const DRACO_DECODERS = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

/** Dark studio: soft spot pool on a black floor, warm rim, environment reflections. Transparent background optional. */
export function buildStudio(THREE, RoomEnvironment, canvas, { w = 1920, h = 1080, fov = 30, alpha = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(w, h, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  if (!alpha) scene.background = new THREE.Color(0x050506)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 200)

  const key = new THREE.SpotLight(0xffffff, 260, 30, 0.55, 0.85, 1.6)
  key.position.set(2.5, 8, 4)
  scene.add(key.target)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.03
  const rim = new THREE.DirectionalLight(0xffe2c4, 1.4)
  rim.position.set(-6, 3, -4)
  const fill = new THREE.HemisphereLight(0x8899aa, 0x080808, 0.35)
  scene.add(key, rim, fill)
  scene.fog = new THREE.Fog(0x050506, 9, 22)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.55, metalness: 0, envMapIntensity: 0.08 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
  return { renderer, scene, camera, key, rim, fill, floor }
}

/**
 * Loads a GLB, scales its longest horizontal side to `length` metres, sits it on the floor centred,
 * and (optionally) swaps its material for polished clear-coat metal that keeps the model's colour + normal maps,
 * or with `solid` replaces it with one colour (e.g. the 3D "Cybercab" lettering, whose texture has a white glitch).
 */
export async function loadModel(THREE, GLTFLoader, DRACOLoader, url, { length = 4.2, polish = true, metalness = 0.55, roughness = 0.34, tint = 0xffffff, solid = null } = {}) {
  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODERS)
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(url)
  const model = gltf.scene
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
  model.scale.setScalar(length / Math.max(size.x, size.z))
  const b = new THREE.Box3().setFromObject(model), c = b.getCenter(new THREE.Vector3())
  model.position.set(-c.x, -b.min.y, -c.z)
  model.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = o.receiveShadow = true
    const m = o.material
    // solid: one clean colour for the whole model, dropping its texture (fixes texture glitches); keeps surface detail
    if (solid !== null) return void (o.material = new THREE.MeshPhysicalMaterial({ color: solid, normalMap: m.normalMap, metalness, roughness, clearcoat: 0.4, clearcoatRoughness: 0.3 }))
    if (!polish) return
    o.material = new THREE.MeshPhysicalMaterial({ map: m.map, normalMap: m.normalMap, color: tint, metalness, roughness, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 1.2 })
  })
  // wrap so callers can rotate/move the product around its own centre
  const holder = new THREE.Group()
  holder.add(model)
  // contact shadow: the soft dark pool right under the product that grounds it on any floor
  const fin = new THREE.Box3().setFromObject(model), dim = fin.getSize(new THREE.Vector3())
  holder.add(contactShadow(THREE, dim.x * 1.18, dim.z * 1.5))
  return holder
}

/** A blurred dark ellipse lying on the floor, like ambient occlusion under a car. */
export function contactShadow(THREE, w, d, strength = 0.75) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d'), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, `rgba(0,0,0,${strength})`)
  grad.addColorStop(0.45, `rgba(0,0,0,${strength * 0.55})`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.003
  plane.renderOrder = 1
  return plane
}
