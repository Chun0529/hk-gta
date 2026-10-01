import * as THREE from 'three'
import {
  BOC_TOWER,
  BUILDINGS,
  GLASS_TOWER,
  MARKERS,
  RED_LIGHTS,
  TAXI_SPAWN,
  type Marker
} from '../data/district'
import type { Aabb } from './collision'

export interface TrafficLight {
  id: string
  x: number
  z: number
  phase: number
  red: boolean
  lamp: THREE.Mesh
}

export interface AiCar {
  mesh: THREE.Group
  x: number
  z: number
  dir: number
  speed: number
  cooldown: number
}

interface Sign {
  mesh: THREE.Mesh
  text: string
  color: string
}

export class World {
  readonly colliders: Aabb[] = []
  readonly lights: TrafficLight[] = []
  readonly ai: AiCar[] = []
  readonly taxi: THREE.Group
  readonly tram: THREE.Group
  tramX = -40
  tramDir = 1
  readonly markerMeshes = new Map<string, THREE.Object3D>()
  readonly milkMeshes = new Map<string, THREE.Object3D>()
  sky: THREE.ShaderMaterial
  private rain: THREE.Points
  private signs: Sign[] = []
  private time = 0

  constructor(private scene: THREE.Scene) {
    this.sky = this.addSky()
    this.addLights()
    this.addGround()
    this.addWater()
    this.addMountains()
    this.addBuildings()
    this.addTowers()
    this.addPier()
    this.addStreetLamps()
    this.addMarkers()
    this.taxi = this.makeTaxi()
    this.taxi.position.set(TAXI_SPAWN.x, 0.35, TAXI_SPAWN.z)
    this.taxi.rotation.y = TAXI_SPAWN.yaw
    this.tram = this.makeTram()
    this.addAiCars()
    this.addTrafficLights()
    this.rain = this.makeRain()
    scene.add(this.rain)
    void document.fonts?.ready.then(() => this.redrawSigns())
  }

  update(dt: number, focus: THREE.Vector3, rainOn: boolean): void {
    this.time += dt
    this.tramX += this.tramDir * 7 * dt
    if (this.tramX > 100) this.tramDir = -1
    if (this.tramX < -100) this.tramDir = 1
    this.tram.position.set(this.tramX, 0.4, -33)
    this.tram.rotation.y = this.tramDir > 0 ? Math.PI / 2 : -Math.PI / 2

    for (const car of this.ai) {
      car.x += car.dir * car.speed * dt
      if (car.x > 108) car.x = -108
      if (car.x < -108) car.x = 108
      car.mesh.position.set(car.x, 0.35, car.z)
      car.mesh.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2
      car.cooldown = Math.max(0, car.cooldown - dt)
    }

    const cycle = 12
    for (const light of this.lights) {
      const t = (this.time + light.phase) % cycle
      light.red = t > 7.2
      ;(light.lamp.material as THREE.MeshStandardMaterial).color.set(light.red ? 0xff2a2a : 0x37d36a)
      ;(light.lamp.material as THREE.MeshStandardMaterial).emissive.set(light.red ? 0xff2a2a : 0x37d36a)
    }

    this.milkMeshes.forEach((mesh) => {
      mesh.position.y = 0.45 + Math.sin(this.time * 2 + mesh.position.x) * 0.08
    })

    this.rain.visible = rainOn
    if (rainOn) {
      const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * (18 + (i % 5))
        if (y < 0) y = 18
        pos.setXYZ(i, focus.x + ((i * 37) % 40) - 20, y, focus.z + ((i * 19) % 40) - 20)
      }
      pos.needsUpdate = true
    }
  }

  hideMilk(id: string): void {
    const mesh = this.milkMeshes.get(id)
    if (mesh) mesh.visible = false
  }

  showAllMilk(): void {
    this.milkMeshes.forEach((mesh) => {
      mesh.visible = true
    })
  }

  private addSky(): THREE.ShaderMaterial {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTop: { value: new THREE.Color('#140a1c') },
        uHor: { value: new THREE.Color('#c47a6a') }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 uTop;
        uniform vec3 uHor;
        void main() {
          float h = normalize(vPos).y;
          float t = smoothstep(-0.02, 0.55, h);
          gl_FragColor = vec4(mix(uHor, uTop, t), 1.0);
        }
      `
    })
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 28, 18), mat)
    this.scene.add(sky)
    this.scene.fog = new THREE.FogExp2('#241028', 0.0075)
    return mat
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight('#6d587c', '#1a120c', 0.72))
    const sun = new THREE.DirectionalLight('#ffb089', 0.55)
    sun.position.set(-40, 50, 20)
    this.scene.add(sun)
    this.scene.add(new THREE.AmbientLight('#3a3058', 0.35))
  }

  private addGround(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const g = canvas.getContext('2d')
    if (!g) return
    const X = (x: number) => ((x + 120) / 240) * 1024
    const Y = (z: number) => ((z + 80) / 200) * 1024
    g.fillStyle = '#1c1e1a'
    g.fillRect(0, 0, 1024, 1024)
    g.fillStyle = '#071018'
    g.fillRect(0, 0, 1024, Y(-44))
    g.fillStyle = '#3a3c42'
    g.fillRect(0, Y(-36), 1024, Y(-16) - Y(-36))
    g.fillRect(X(-110), Y(24), X(110) - X(-110), Y(32) - Y(24))
    for (const x of [-20, 45]) {
      g.fillRect(X(x - 6), Y(-36), X(x + 6) - X(x - 6), Y(60) - Y(-36))
    }
    g.fillStyle = '#c9b56a'
    for (let x = -110; x < 110; x += 8) {
      g.fillRect(X(x), Y(-27.2), X(3.2) - X(0), 3)
      g.fillRect(X(x), Y(27.4), X(3.2) - X(0), 3)
    }
    g.strokeStyle = '#8fd0c8'
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(0, Y(-33))
    g.lineTo(1024, Y(-33))
    g.stroke()
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = THREE.LinearFilter
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 200),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(0, 0, 20)
    this.scene.add(mesh)
  }

  private addWater(): void {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 40),
      new THREE.MeshStandardMaterial({
        color: '#0b1c2e',
        metalness: 0.65,
        roughness: 0.22,
        transparent: true,
        opacity: 0.92
      })
    )
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0.05, -62)
    this.scene.add(water)
  }

  private addMountains(): void {
    const mat = new THREE.MeshStandardMaterial({ color: '#16121c', roughness: 1 })
    for (const [x, z, h] of [
      [-130, 40, 34],
      [-70, 92, 48],
      [10, 100, 42],
      [90, 88, 36],
      [140, 30, 28]
    ] as const) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(26, h, 6), mat)
      cone.position.set(x, h / 2 - 2, z)
      this.scene.add(cone)
    }
  }

  private addBuildings(): void {
    BUILDINGS.forEach((b, i) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.buildingMat(b.color, b.w, b.h, i + 3))
      mesh.position.set(b.x, b.h / 2, b.z)
      this.scene.add(mesh)
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.92, 0.4, b.d * 0.92),
        new THREE.MeshStandardMaterial({ color: '#1a1c22' })
      )
      roof.position.set(b.x, b.h + 0.2, b.z)
      this.scene.add(roof)
      if (b.h > 24) {
        const pole = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 6, 0.25),
          new THREE.MeshStandardMaterial({ color: '#d9d9d9' })
        )
        pole.position.set(b.x, b.h + 3, b.z)
        this.scene.add(pole)
      }
      this.colliders.push({
        minX: b.x - b.w / 2,
        maxX: b.x + b.w / 2,
        minZ: b.z - b.d / 2,
        maxZ: b.z + b.d / 2
      })
    })
    this.addStall(-40, 22)
    this.addStall(-28, 36)
  }

  private addStall(x: number, z: number): void {
    const mat = new THREE.MeshStandardMaterial({ color: '#8a2f2f' })
    const stall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.4), mat)
    stall.position.set(x, 1.1, z)
    this.scene.add(stall)
    this.colliders.push({ minX: x - 1.6, maxX: x + 1.6, minZ: z - 1.2, maxZ: z + 1.2 })
  }

  private addTowers(): void {
    this.scene.add(this.glassTower(GLASS_TOWER.x, GLASS_TOWER.z))
    this.colliders.push({
      minX: GLASS_TOWER.x - 8,
      maxX: GLASS_TOWER.x + 8,
      minZ: GLASS_TOWER.z - 8,
      maxZ: GLASS_TOWER.z + 8
    })
    this.scene.add(this.bocTower(BOC_TOWER.x, BOC_TOWER.z))
    this.colliders.push({
      minX: BOC_TOWER.x - 7,
      maxX: BOC_TOWER.x + 7,
      minZ: BOC_TOWER.z - 7,
      maxZ: BOC_TOWER.z + 7
    })
  }

  private glassTower(x: number, z: number): THREE.Group {
    const group = new THREE.Group()
    const sizes = [16, 14, 12, 10, 8, 6]
    let y = 0
    sizes.forEach((s, i) => {
      const h = i === 0 ? 18 : 9
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), this.glassMat(i))
      mesh.position.y = y + h / 2
      y += h
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(s + 0.5, 0.45, s + 0.5),
        new THREE.MeshStandardMaterial({ color: '#d6b25e', emissive: '#6a5420', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 })
      )
      band.position.y = y
      y += 0.45
      group.add(mesh, band)
    })
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.4, 14, 8),
      new THREE.MeshStandardMaterial({ color: '#f2f2f2', metalness: 0.8, roughness: 0.2 })
    )
    spire.position.y = y + 7
    group.add(spire)
    group.position.set(x, 0, z)
    return group
  }

  private bocTower(x: number, z: number): THREE.Group {
    const group = new THREE.Group()
    let y = 0
    const widths = [14, 12, 10, 8, 6]
    widths.forEach((w) => {
      const h = 11
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, w),
        new THREE.MeshStandardMaterial({ color: '#d5d8df', metalness: 0.35, roughness: 0.4 })
      )
      mesh.position.y = y + h / 2
      y += h
      group.add(mesh)
    })
    const braceMat = new THREE.MeshStandardMaterial({ color: '#1c1c1c' })
    for (let i = 0; i < 3; i++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 0.22), braceMat)
      const b = a.clone()
      a.position.set(0, 6 + i * 10, 6.5)
      b.position.copy(a.position)
      a.rotation.z = 0.55
      b.rotation.z = -0.55
      group.add(a, b)
    }
    group.position.set(x, 0, z)
    return group
  }

  private addPier(): void {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.4, 18),
      new THREE.MeshStandardMaterial({ color: '#6d6458' })
    )
    deck.position.set(-84, 0.15, -50)
    this.scene.add(deck)
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: '#efe6d6' })
    )
    roof.position.set(-84, 3.2, -50)
    const colMat = new THREE.MeshStandardMaterial({ color: '#efe6d6' })
    for (const [x, z] of [
      [-90, -54],
      [-78, -54],
      [-90, -46],
      [-78, -46]
    ] as const) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), colMat)
      col.position.set(x, 1.6, z)
      this.scene.add(col)
    }
    this.scene.add(roof)
    const sign = this.neon('天星碼頭', '#f4efe4', 8)
    sign.position.set(-84, 3.8, -45.8)
    this.scene.add(sign)
  }

  private addStreetLamps(): void {
    for (let x = -100; x <= 100; x += 24) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 6, 6),
        new THREE.MeshStandardMaterial({ color: '#222' })
      )
      pole.position.set(x, 3, -17.5)
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ffd9a0' })
      )
      bulb.position.set(x, 6.1, -17.5)
      this.scene.add(pole, bulb)
    }
  }

  private addMarkers(): void {
    for (const marker of MARKERS) {
      if (marker.kind === 'neon') {
        const color = marker.id === 'neon-lkf' ? '#ff4fd8' : marker.id === 'neon-pawn' ? '#ffb703' : '#7CFF6B'
        const sign = this.neon(marker.labelZh, color, 6.5)
        sign.position.set(marker.x, marker.id === 'neon-lkf' ? 4.2 : 5.5, marker.z)
        if (marker.id === 'neon-lkf') sign.rotation.y = Math.PI / 2
        this.scene.add(sign)
        this.markerMeshes.set(marker.id, sign)
      } else if (marker.kind === 'milk') {
        const cup = this.milkCup()
        cup.position.set(marker.x, 0.45, marker.z)
        this.scene.add(cup)
        this.milkMeshes.set(marker.id, cup)
      } else if (marker.kind === 'mtr') {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 2.4, 0.3),
          new THREE.MeshStandardMaterial({ color: '#c8102e' })
        )
        post.position.set(marker.x, 1.2, marker.z)
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.16, 0.34),
          new THREE.MeshBasicMaterial({ color: '#ffffff' })
        )
        bar.position.set(marker.x, 1.7, marker.z)
        this.scene.add(post, bar)
        this.markerMeshes.set(marker.id, post)
      } else if (marker.kind === 'drop') {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 0.08, 20),
          new THREE.MeshBasicMaterial({ color: '#ffcc33', transparent: true, opacity: 0.85 })
        )
        pad.position.set(marker.x, 0.08, marker.z)
        this.scene.add(pad)
        this.markerMeshes.set(marker.id, pad)
      } else if (marker.kind === 'cha') {
        const beam = this.beam()
        beam.position.set(marker.x, 6, marker.z)
        this.scene.add(beam)
        this.markerMeshes.set(marker.id, beam)
      }
    }
  }

  private addTrafficLights(): void {
    for (const def of RED_LIGHTS) {
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 4.2, 0.15),
        new THREE.MeshStandardMaterial({ color: '#222' })
      )
      pole.position.set(def.x, 2.1, -16.2)
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x37d36a, emissive: 0x37d36a, emissiveIntensity: 0.8 })
      )
      lamp.position.set(def.x, 4.3, -16.2)
      this.scene.add(pole, lamp)
      this.lights.push({ ...def, red: false, lamp })
    }
  }

  private addAiCars(): void {
    const specs = [
      { x: -30, z: -30, dir: 1, speed: 9, color: 0x355070 },
      { x: 40, z: -30, dir: 1, speed: 11, color: 0x6c584c },
      { x: 10, z: -22, dir: -1, speed: 10, color: 0x22223b },
      { x: -80, z: -22, dir: -1, speed: 8, color: 0x4a4e69 }
    ]
    for (const spec of specs) {
      const mesh = this.makeCar(spec.color, false)
      mesh.position.set(spec.x, 0.35, spec.z)
      this.scene.add(mesh)
      this.ai.push({ mesh, x: spec.x, z: spec.z, dir: spec.dir, speed: spec.speed, cooldown: 0 })
    }
  }

  private makeTaxi(): THREE.Group {
    const taxi = this.makeCar(0xc1121f, true)
    const sign = this.neon('的士', '#ffe66d', 1.4)
    sign.scale.set(0.35, 0.45, 0.35)
    sign.position.set(0, 1.55, 0)
    taxi.add(sign)
    this.scene.add(taxi)
    return taxi
  }

  private makeTram(): THREE.Group {
    const group = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 2.1, 10.5),
      new THREE.MeshStandardMaterial({ color: '#d8efe4', roughness: 0.45 })
    )
    body.position.y = 1.3
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.35, 10.6),
      new THREE.MeshStandardMaterial({ color: '#1f7a4d' })
    )
    stripe.position.y = 1.15
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.7, 9.2),
      new THREE.MeshStandardMaterial({ color: '#9fd7ff', emissive: '#224455', emissiveIntensity: 0.3 })
    )
    win.position.y = 1.7
    group.add(body, stripe, win)
    this.scene.add(group)
    return group
  }

  private makeCar(color: number, taxi: boolean): THREE.Group {
    const group = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.7, 3.4),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 })
    )
    body.position.y = 0.55
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.55, 1.7),
      new THREE.MeshStandardMaterial({ color: taxi ? 0xf7f1d5 : 0x111111, roughness: 0.3 })
    )
    cabin.position.set(0, 1.1, -0.1)
    group.add(body, cabin)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 })
    for (const [x, z] of [
      [-0.75, 1],
      [0.75, 1],
      [-0.75, -1],
      [0.75, -1]
    ] as const) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.24, 10), wheelMat)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(x, 0.28, z)
      group.add(wheel)
    }
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xfff1b8 })
    )
    nose.position.set(0, 0.5, 1.7)
    group.add(nose)
    return group
  }

  private makeRain(): THREE.Points {
    const count = 500
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (i % 40) - 20
      pos[i * 3 + 1] = (i * 3) % 18
      pos[i * 3 + 2] = ((i * 7) % 40) - 20
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: '#d0e4ff', size: 0.08, transparent: true, opacity: 0.55 }))
  }

  private milkCup(): THREE.Group {
    const group = new THREE.Group()
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: '#c9864a', emissive: '#5a3318', emissiveIntensity: 0.4 })
    )
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: '#f4efe6' })
    )
    lid.position.y = 0.18
    group.add(cup, lid)
    return group
  }

  private beam(): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, 12, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffcc33', transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    )
  }

  private neon(text: string, color: string, width: number): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({ transparent: true })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.28), mat)
    this.signs.push({ mesh, text, color })
    this.paintSign(mesh, text, color)
    return mesh
  }

  private redrawSigns(): void {
    for (const sign of this.signs) this.paintSign(sign.mesh, sign.text, sign.color)
  }

  private paintSign(mesh: THREE.Mesh, text: string, color: string): void {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const g = canvas.getContext('2d')
    if (!g) return
    g.clearRect(0, 0, 512, 128)
    g.fillStyle = 'rgba(8, 4, 8, 0.82)'
    g.fillRect(0, 0, 512, 128)
    g.strokeStyle = color
    g.lineWidth = 8
    g.strokeRect(8, 8, 496, 112)
    g.fillStyle = color
    g.font = '700 64px "Microsoft JhengHei", "Noto Sans TC", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 256, 68)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = mesh.material as THREE.MeshBasicMaterial
    mat.map = tex
    mat.needsUpdate = true
  }

  private buildingMat(color: string, w: number, h: number, seed: number): THREE.MeshStandardMaterial {
    const map = this.windowTexture(seed)
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(Math.max(1, w / 5), Math.max(1, h / 7))
    return new THREE.MeshStandardMaterial({
      color,
      emissive: '#ffd7a1',
      emissiveMap: map,
      emissiveIntensity: 0.85,
      roughness: 0.82
    })
  }

  private glassMat(i: number): THREE.MeshStandardMaterial {
    const map = this.windowTexture(20 + i)
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(3, 4)
    return new THREE.MeshStandardMaterial({
      color: '#163044',
      emissive: '#9fd0ff',
      emissiveMap: map,
      emissiveIntensity: 0.55,
      metalness: 0.45,
      roughness: 0.22
    })
  }

  private windowTexture(seed: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 128
    const g = canvas.getContext('2d')!
    g.fillStyle = '#0c1016'
    g.fillRect(0, 0, 64, 128)
    let s = seed * 997 + 13
    const rand = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    for (let y = 4; y < 124; y += 8) {
      for (let x = 3; x < 60; x += 6) {
        if (rand() > 0.38) {
          g.globalAlpha = 0.55 + rand() * 0.45
          g.fillStyle = rand() > 0.8 ? '#9fd0ff' : rand() > 0.45 ? '#ffd27a' : '#fff4d2'
          g.fillRect(x, y, 3, 5)
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = THREE.NearestFilter
    return tex
  }
}

export function markerById(id: string): Marker | undefined {
  return MARKERS.find((m) => m.id === id)
}
