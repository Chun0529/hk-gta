import * as THREE from 'three'
import { characterById } from '../data/characters'
import { FERRY_ZONE, LKF, MARKERS, SPAWN, districtName, inRect } from '../data/district'
import { MILK_PAY, MISSIONS, POSTCARD_COST, REPEAT_PAY, SHOP, TIP_COST } from '../data/missions'
import { newlyEarned, titleName } from '../data/titles'
import { Hud, type MapPoint } from '../ui/Hud'
import { blip, clockHour, clockLabel, hornSound } from './clock'
import { blocked, normalizeAngle } from './collision'
import { Input } from './Input'
import { Player, type MoveInput } from './Player'
import {
  clearRun,
  freshRun,
  loadProfile,
  loadRun,
  saveProfile,
  saveRun,
  type Profile,
  type Run
} from './Save'
import { World } from './World'
import { UI, tx } from '../i18n'

export class Game {
  readonly profile: Profile
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private world: World
  private player: Player
  private input: Input
  private hud: Hud
  private run: Run | null = null
  private mode: 'menu' | 'play' = 'menu'
  private elapsed = 0
  private saveAcc = 0
  private hurt = 0
  private prevX = 0
  private hadWanted = false
  private missCd = new Map<string, number>()
  private toasts: string[] = []
  private toastBusy = false
  private menu = { hide: () => {}, show: () => {} }
  constructor(canvas: HTMLCanvasElement, hudRoot: HTMLElement) {
    this.profile = loadProfile()
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600)
    this.world = new World(this.scene)
    this.player = new Player(this.scene)
    this.player.group.visible = false
    this.input = new Input(canvas)
    this.input.enabled = false
    this.input.sensitivity = this.profile.sensitivity
    this.hud = new Hud(hudRoot, {
      onResume: () => this.closePanel(),
      onQuit: () => this.quit(),
      onEquip: (id) => this.equip(id),
      onBuy: (id) => this.buy(id),
      onPickup: () => this.pickupTarts(),
      onMtr: (id) => this.rideMtr(id),
      onAccept: (id) => this.accept(id),
      onRepeat: () => this.repeatJob(),
      onRain: () => this.toggleRain(),
      onPress: (code) => this.input.press(code)
    })
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.renderer.setAnimationLoop(() => this.frame())
  }

  bindMenu(menu: { hide: () => void; show: () => void }): void {
    this.menu = menu
  }

  hasRun(): boolean {
    return this.run !== null || loadRun() !== null
  }

  summary(): string {
    const run = this.run ?? loadRun()
    if (!run) return ''
    return tx(
      `$${run.money} · 奶茶 ${run.milk.length}/8 · 任務 ${run.missionsDone.length}/3`,
      `$${run.money} · tea ${run.milk.length}/8 · jobs ${run.missionsDone.length}/3`
    )
  }

  setCharacter(id: string): void {
    this.profile.characterId = characterById(id).id
    saveProfile(this.profile)
  }

  equip(id: string): void {
    if (!this.profile.unlocked.includes(id)) return
    this.profile.equipped = id
    saveProfile(this.profile)
    this.hud.refreshTitles(this.profile)
  }

  setRain(on: boolean): void {
    this.profile.rain = on
    saveProfile(this.profile)
  }

  setHints(on: boolean): void {
    this.profile.hints = on
    saveProfile(this.profile)
  }

  setSensitivity(n: number): void {
    this.profile.sensitivity = n
    this.input.sensitivity = n
    saveProfile(this.profile)
  }

  startNew(): void {
    clearRun()
    const id = this.profile.characterId
    if (!this.profile.played.includes(id)) this.profile.played.push(id)
    this.run = freshRun(id)
    this.bootRun(true)
  }

  continueGame(): void {
    const saved = this.run ?? loadRun()
    if (!saved) {
      this.startNew()
      return
    }
    this.run = saved
    if (!this.profile.played.includes(saved.characterId)) this.profile.played.push(saved.characterId)
    this.bootRun(false)
  }

  private bootRun(fresh: boolean): void {
    const run = this.run
    if (!run) return
    const character = characterById(run.characterId)
    this.player.setOutfit(character.shirt, character.accent)
    this.player.mode = run.mode
    this.player.taxiSpeed = run.taxiSpeed
    this.player.x = run.x
    this.player.z = run.z
    this.player.yaw = run.yaw
    this.world.tramX = run.tramX
    this.world.taxi.position.set(run.taxiX, 0.35, run.taxiZ)
    this.world.taxi.rotation.y = run.taxiYaw
    if (run.mode === 'taxi') {
      this.player.x = run.taxiX
      this.player.z = run.taxiZ
      this.player.yaw = run.taxiYaw
    }
    this.world.showAllMilk()
    for (const id of run.milk) this.world.hideMilk(id)
    this.prevX = this.player.x
    this.hadWanted = run.wanted > 0
    this.mode = 'play'
    this.input.enabled = true
    this.hud.show()
    this.menu.hide()
    this.player.sync()
    this.persist()
    this.refreshTitles()
    if (fresh) {
      const starter = character.titleId
      if (this.profile.unlocked.includes(starter)) this.profile.equipped = starter
      if (this.profile.hints) this.pushToast(tx(UI.welcome.zh, UI.welcome.en))
    }
    saveProfile(this.profile)
  }

  private quit(): void {
    this.persist()
    this.mode = 'menu'
    this.input.enabled = false
    this.hud.hide()
    this.player.group.visible = false
    if (document.pointerLockElement) document.exitPointerLock()
    this.menu.show()
  }

  private frame(): void {
    try {
      const dt = Math.min(0.05, this.clockDelta())
      this.elapsed += dt
      this.handleUi()
      if (this.mode === 'menu') this.updateMenu(dt)
      else if (!this.hud.panelOpen()) this.updatePlay(dt)
      this.renderer.render(this.scene, this.camera)
      this.input.endFrame()
    } catch (error) {
      console.error(error)
    }
  }

  private last = performance.now()
  private clockDelta(): number {
    const now = performance.now()
    const dt = (now - this.last) / 1000
    this.last = now
    return dt
  }

  private updateMenu(dt: number): void {
    const t = this.elapsed
    this.camera.position.set(-42 + Math.sin(t * 0.07) * 3, 16, 34)
    this.camera.lookAt(-86, 28, 8)
    this.world.update(dt, this.camera.position, this.profile.rain)
  }

  private updatePlay(dt: number): void {
    const run = this.run
    if (!run) return
    this.hurt = Math.max(0, this.hurt - dt)
    for (const [k, v] of this.missCd) this.missCd.set(k, v - dt)
    const input = this.readInput()
    let moved = 0
    if (run.mode === 'tram') {
      this.player.mode = 'tram'
      this.player.addLook(input, dt)
      const before = this.world.tramX
      this.world.update(dt, this.camera.position, this.profile.rain)
      this.player.x = this.world.tramX
      this.player.z = -33
      this.player.yaw = this.world.tramDir > 0 ? Math.PI / 2 : -Math.PI / 2
      run.tramTravelM += Math.abs(this.world.tramX - before)
      this.player.sync()
      if (this.input.consume('KeyF')) this.exitVehicle()
    } else if (run.mode === 'taxi') {
      this.player.mode = 'taxi'
      moved = this.player.updateTaxi(dt, input, this.world.taxi, this.world.colliders)
      run.driveM += moved
      this.world.update(dt, this.camera.position, this.profile.rain)
      this.bumpCars()
      this.checkLights()
      if (this.input.consume('KeyH')) {
        run.honks += 1
        hornSound()
      }
      if (this.input.consume('KeyF')) this.exitVehicle()
    } else {
      this.player.mode = 'foot'
      const yaw = this.world.taxi.rotation.y
      const hx = Math.abs(Math.sin(yaw)) * 1.8 + Math.abs(Math.cos(yaw)) * 0.95
      const hz = Math.abs(Math.cos(yaw)) * 1.8 + Math.abs(Math.sin(yaw)) * 0.95
      const taxiBox = {
        minX: this.world.taxi.position.x - hx,
        maxX: this.world.taxi.position.x + hx,
        minZ: this.world.taxi.position.z - hz,
        maxZ: this.world.taxi.position.z + hz
      }
      this.world.colliders.push(taxiBox)
      moved = this.player.updateFoot(dt, input, this.world.colliders)
      this.world.colliders.pop()
      run.walkM += moved
      if (this.profile.rain) run.rainWalkM += moved
      this.world.update(dt, this.camera.position, this.profile.rain)
      this.checkHazards()
      if (this.input.consume('KeyF')) this.board()
    }
    run.x = this.player.x
    run.z = this.player.z
    run.yaw = this.player.yaw
    run.mode = this.player.mode
    run.taxiSpeed = this.player.taxiSpeed
    run.tramX = this.world.tramX
    if (run.mode === 'taxi') {
      run.taxiX = this.player.x
      run.taxiZ = this.player.z
      run.taxiYaw = this.player.yaw
    } else {
      run.taxiX = this.world.taxi.position.x
      run.taxiZ = this.world.taxi.position.z
      run.taxiYaw = this.world.taxi.rotation.y
    }
    this.prevX = this.player.x
    run.gameMinutes += dt * 1.5
    this.updateZones(dt)
    this.collectMilk()
    this.checkDelivery(dt)
    this.decayWanted(dt)
    this.paintSky()
    this.syncBeams()
    if (this.input.consume('KeyE')) this.interact()
    this.refreshTitles()
    this.followCamera(dt)
    this.paintHud()
    this.saveAcc += dt
    if (this.saveAcc > 4) {
      this.saveAcc = 0
      this.persist()
    }
  }

  private readInput(): MoveInput {
    let forward = 0
    let strafe = 0
    if (this.input.held('KeyW') || this.input.held('ArrowUp')) forward += 1
    if (this.input.held('KeyS') || this.input.held('ArrowDown')) forward -= 1
    if (this.input.held('KeyD')) strafe += 1
    if (this.input.held('KeyA')) strafe -= 1
    forward += -this.input.stickY
    strafe += this.input.stickX
    let turn = 0
    if (this.input.held('KeyQ') || this.input.held('ArrowLeft')) turn -= 1
    if (this.input.held('KeyR') || this.input.held('ArrowRight')) turn += 1
    const mag = Math.hypot(this.input.stickX, this.input.stickY)
    return {
      forward: Math.max(-1, Math.min(1, forward)),
      strafe: Math.max(-1, Math.min(1, strafe)),
      turn,
      lookX: this.input.lookX,
      lookY: this.input.lookY,
      sprint: this.input.held('ShiftLeft') || this.input.held('ShiftRight') || mag > 0.88,
      handbrake: this.input.held('Space'),
      sensitivity: this.input.sensitivity
    }
  }

  private handleUi(): void {
    if (this.mode !== 'play') return
    const open = this.hud.panelOpen()
    if (open) {
      if (this.input.consume('Escape') || this.input.consume('KeyT') || this.input.consume('KeyM')) this.closePanel()
      return
    }
    if (this.input.consume('Escape')) this.hud.openPause(this.profile)
    else if (this.input.consume('KeyT')) this.openPhone()
    else if (this.input.consume('KeyM')) this.hud.openMap()
    if (this.hud.panelOpen() && document.pointerLockElement) document.exitPointerLock()
  }

  private closePanel(): void {
    this.hud.closePanel()
  }

  private openPhone(): void {
    if (!this.run) return
    this.hud.openPhone(this.run, this.profile)
  }

  private toggleRain(): void {
    this.setRain(!this.profile.rain)
    if (this.run) this.hud.openPhone(this.run, this.profile)
  }

  private board(): void {
    const run = this.run
    if (!run || run.mode !== 'foot') return
    const taxiD = Math.hypot(this.world.taxi.position.x - this.player.x, this.world.taxi.position.z - this.player.z)
    const tramD = Math.hypot(this.world.tramX - this.player.x, -33 - this.player.z)
    if (taxiD < 3.5 && taxiD <= tramD) {
      run.mode = 'taxi'
      this.player.mode = 'taxi'
      this.player.x = this.world.taxi.position.x
      this.player.z = this.world.taxi.position.z
      this.player.yaw = this.world.taxi.rotation.y
      this.player.taxiSpeed = 0
      this.player.group.visible = false
      return
    }
    if (tramD < 4.4) {
      run.mode = 'tram'
      this.player.mode = 'tram'
      this.player.group.visible = false
    }
  }

  private exitVehicle(): void {
    const run = this.run
    if (!run) return
    const yaw = this.player.yaw
    let x = this.player.x + Math.cos(yaw) * 2.5
    let z = this.player.z - Math.sin(yaw) * 2.5
    if (blocked(x, z, 0.45, this.world.colliders)) {
      x = this.player.x - Math.cos(yaw) * 2.5
      z = this.player.z + Math.sin(yaw) * 2.5
    }
    this.player.x = x
    this.player.z = z
    this.player.taxiSpeed = 0
    this.player.mode = 'foot'
    run.mode = 'foot'
    run.taxiSpeed = 0
    this.player.sync()
  }

  private interact(): void {
    const run = this.run
    if (!run || run.mode !== 'foot') return
    const nearest = this.nearestInteract()
    if (!nearest) return
    if (nearest.kind === 'cha') {
      run.chaVisits += 1
      this.hud.openShop(run)
    } else if (nearest.kind === 'mtr' && nearest.stationId) {
      this.hud.openMtr(nearest.stationId)
    } else if (nearest.kind === 'neon') {
      this.shootNeon(nearest.id)
    } else if (nearest.kind === 'busker') {
      this.spend(TIP_COST, tx('打賞咗海傍藝人。', 'You tipped the busker.'))
    } else if (nearest.kind === 'souvenir') {
      this.spend(POSTCARD_COST, tx('買咗張維港明信片。', 'You bought a harbour postcard.'))
    }
  }

  private nearestInteract() {
    let best: (typeof MARKERS)[number] | null = null
    let bestD = 3.4
    for (const marker of MARKERS) {
      if (marker.kind === 'milk' || marker.kind === 'drop' || marker.kind === 'ferry') continue
      const d = Math.hypot(marker.x - this.player.x, marker.z - this.player.z)
      const reach = marker.kind === 'neon' ? 4 : 3.2
      if (d < reach && d < bestD) {
        best = marker
        bestD = d
      }
    }
    return best
  }

  private shootNeon(id: string): void {
    const run = this.run
    if (!run) return
    if (run.neons.includes(id)) {
      this.pushToast(tx(UI.alreadyPhoto.zh, UI.alreadyPhoto.en))
      return
    }
    run.neons.push(id)
    this.hud.flash()
    blip()
    const sign = MARKERS.find((m) => m.id === id)
    this.pushToast(`${tx(UI.photo.zh, UI.photo.en)} · ${sign ? tx(sign.labelZh, sign.labelEn) : ''}`)
    if (run.neons.length >= 5 && !run.missionsDone.includes('neon')) this.complete('neon')
  }

  private spend(cost: number, message: string): void {
    const run = this.run
    if (!run) return
    if (run.money < cost) {
      this.pushToast(tx(UI.poor.zh, UI.poor.en))
      return
    }
    run.money -= cost
    run.spent += cost
    blip()
    this.pushToast(message)
  }

  private buy(id: string): void {
    const run = this.run
    const item = SHOP.find((entry) => entry.id === id)
    if (!run || !item) return
    if (run.money < item.price) {
      this.pushToast(tx(UI.poor.zh, UI.poor.en))
      return
    }
    run.money -= item.price
    run.spent += item.price
    run.health = Math.min(100, run.health + item.heal)
    if (item.id === 'bun') {
      run.buns += 1
      if (run.activeMission === 'home') this.complete('home')
    }
    blip()
    this.refreshTitles()
  }

  private pickupTarts(): void {
    const run = this.run
    if (!run || run.carrying) return
    if (run.activeMission !== 'tart' && !run.repeatJob) return
    run.carrying = true
    run.deliveryLeft = 90
    this.closePanel()
    this.pushToast(tx('蛋撻上手，九十秒內送到灣仔。', 'Tarts in hand. Wan Chai in ninety seconds.'))
  }

  private accept(id: 'tart' | 'neon'): void {
    const run = this.run
    if (!run || run.carrying || run.missionsDone.includes(id) || !run.missionsDone.includes('home')) return
    run.activeMission = id
    if (id !== 'tart') run.repeatJob = false
    this.openPhone()
  }

  private repeatJob(): void {
    const run = this.run
    if (!run || run.carrying || !run.missionsDone.includes('tart')) return
    run.repeatJob = true
    run.activeMission = 'tart'
    this.closePanel()
    this.pushToast(tx('返金華冰室拎多一箱。', 'Pick up another box at the cafe.'))
  }

  private rideMtr(stationId: string): void {
    const run = this.run
    if (!run || run.mode !== 'foot') return
    const dest = MARKERS.find((m) => m.stationId === stationId)
    if (!dest) return
    this.player.x = dest.x
    this.player.z = dest.z + 2.2
    this.player.sync()
    run.mtrRides += 1
    run.x = this.player.x
    run.z = this.player.z
    blip()
    this.closePanel()
    this.pushToast(tx(`到咗${dest.labelZh}。`, `Arrived at ${dest.labelEn}.`))
  }

  private complete(id: 'home' | 'tart' | 'neon'): void {
    const run = this.run
    const mission = MISSIONS.find((m) => m.id === id)
    if (!run || !mission || run.missionsDone.includes(id)) return
    run.missionsDone.push(id)
    run.money += mission.reward
    if (run.activeMission === id) run.activeMission = null
    if (id === 'tart') run.repeatJob = false
    this.pushToast(`${tx(UI.missionGet.zh, UI.missionGet.en)} · ${tx(mission.zh, mission.en)} +$${mission.reward}`)
    blip()
  }

  private collectMilk(): void {
    const run = this.run
    if (!run) return
    for (const marker of MARKERS) {
      if (marker.kind !== 'milk' || run.milk.includes(marker.id)) continue
      if (Math.hypot(marker.x - this.player.x, marker.z - this.player.z) > 1.7) continue
      run.milk.push(marker.id)
      run.money += MILK_PAY
      this.world.hideMilk(marker.id)
      blip()
      this.pushToast(`${tx(UI.milkGet.zh, UI.milkGet.en)} ${run.milk.length}/8`)
    }
  }

  private checkDelivery(dt: number): void {
    const run = this.run
    if (!run?.carrying) return
    run.deliveryLeft -= dt
    const drop = MARKERS.find((m) => m.id === 'drop')
    if (drop && Math.hypot(drop.x - this.player.x, drop.z - this.player.z) < 4) {
      run.carrying = false
      if (run.repeatJob) {
        run.repeatJob = false
        run.money += REPEAT_PAY
        if (run.activeMission === 'tart') run.activeMission = null
        this.pushToast(tx(`又送完一單，+$${REPEAT_PAY}。`, `Another drop done, +$${REPEAT_PAY}.`))
        blip()
      } else this.complete('tart')
      return
    }
    if (run.deliveryLeft <= 0) {
      run.carrying = false
      this.pushToast(tx(UI.missionFail.zh, UI.missionFail.en))
    }
  }

  private updateZones(dt: number): void {
    const run = this.run
    if (!run) return
    const hour = clockHour(run.gameMinutes)
    const night = hour >= 19 || hour < 6
    if (inRect(this.player.x, this.player.z, LKF) && night) run.lkfSeconds += dt
    if (inRect(this.player.x, this.player.z, FERRY_ZONE)) run.ferrySeconds += dt
  }

  private checkLights(): void {
    const run = this.run
    if (!run || Math.abs(this.player.taxiSpeed) < 4) {
      this.prevX = this.player.x
      return
    }
    if (this.player.z < -36 || this.player.z > -16) return
    for (const light of this.world.lights) {
      const crossed = (this.prevX - light.x) * (this.player.x - light.x) < 0
      if (!crossed || !light.red) continue
      run.redLights += 1
      run.wanted = 1
      run.wantedLeft = 14
      if (!this.hadWanted) this.pushToast(tx(UI.star.zh, UI.star.en))
      this.hadWanted = true
    }
  }

  private decayWanted(dt: number): void {
    const run = this.run
    if (!run?.wanted) return
    const alley = inRect(this.player.x, this.player.z, LKF)
    run.wantedLeft -= dt * (alley ? 5 : 0.35)
    if (run.wantedLeft <= 0) {
      run.wanted = 0
      run.wantedLeft = 0
      if (this.hadWanted) this.pushToast(tx(UI.clearStar.zh, UI.clearStar.en))
      this.hadWanted = false
    }
  }

  private checkHazards(): void {
    const hazards = this.world.ai.map((car, i) => ({ id: `car-${i}`, x: car.x, z: car.z, hit: 1.45, near: 2.7 }))
    const along = Math.abs(this.world.tramX - this.player.x)
    const across = Math.abs(-33 - this.player.z)
    if (along < 5.6 && across < 2.1) this.damage(30)
    else if (along < 6.2 && across < 3 && (this.missCd.get('tram') ?? 0) <= 0) {
      this.missCd.set('tram', 3)
      if (this.run) this.run.nearMiss += 1
    }
    for (const hazard of hazards) {
      const d = Math.hypot(hazard.x - this.player.x, hazard.z - this.player.z)
      if (d < hazard.hit) this.damage(30)
      else if (d < hazard.near && (this.missCd.get(hazard.id) ?? 0) <= 0) {
        this.missCd.set(hazard.id, 3)
        if (this.run) this.run.nearMiss += 1
      }
    }
  }

  private bumpCars(): void {
    for (const car of this.world.ai) {
      const dx = this.player.x - car.x
      const dz = this.player.z - car.z
      if (Math.hypot(dx, dz) < 2.4) {
        this.player.taxiSpeed *= -0.3
        this.player.x += dx * 0.15
        this.player.z += dz * 0.15
      }
    }
  }

  private damage(amount: number): void {
    const run = this.run
    if (!run || this.hurt > 0) return
    this.hurt = 0.9
    run.health -= amount
    if (run.health > 0) return
    run.health = 70
    run.money = Math.max(0, run.money - 40)
    run.wanted = 0
    run.wantedLeft = 0
    this.hadWanted = false
    this.player.mode = 'foot'
    run.mode = 'foot'
    this.player.x = SPAWN.x
    this.player.z = SPAWN.z
    this.player.sync()
    this.pushToast(tx(UI.hospital.zh, UI.hospital.en))
  }

  private syncBeams(): void {
    const run = this.run
    if (!run) return
    const cha = this.world.markerMeshes.get('cha')
    if (cha) {
      cha.visible =
        run.activeMission === 'home' || ((run.activeMission === 'tart' || run.repeatJob) && !run.carrying)
    }
    const drop = this.world.markerMeshes.get('drop')
    if (drop) drop.visible = run.carrying
  }

  private paintSky(): void {
    const run = this.run
    if (!run) return
    const hour = clockHour(run.gameMinutes)
    const hor = this.world.sky.uniforms.uHor.value as THREE.Color
    if (hour >= 4 && hour < 7) hor.set('#e7b09a')
    else if (hour >= 23 || hour < 4) hor.set('#241838')
    else hor.set('#c47a6a')
  }

  private goal(): { x: number; z: number } | null {
    const run = this.run
    if (!run) return null
    if (run.carrying) return MARKERS.find((m) => m.id === 'drop') ?? null
    if (run.activeMission === 'home') return MARKERS.find((m) => m.id === 'cha') ?? null
    if ((run.activeMission === 'tart' || run.repeatJob) && !run.carrying) return MARKERS.find((m) => m.id === 'cha') ?? null
    if (run.activeMission === 'neon') {
      return MARKERS.find((m) => m.kind === 'neon' && !run.neons.includes(m.id)) ?? null
    }
    return null
  }

  private followCamera(dt: number): void {
    let dist = 8
    const yaw = this.player.yaw
    for (let d = 8; d >= 2.4; d -= 0.7) {
      const cx = this.player.x - Math.sin(yaw) * d
      const cz = this.player.z - Math.cos(yaw) * d
      if (!blocked(cx, cz, 0.3, this.world.colliders)) {
        dist = d
        break
      }
    }
    const desired = new THREE.Vector3(
      this.player.x - Math.sin(yaw) * dist,
      2.5 + this.player.pitch * 3.2,
      this.player.z - Math.cos(yaw) * dist
    )
    const k = 1 - Math.exp(-dt * 7)
    this.camera.position.lerp(desired, k)
    this.camera.lookAt(this.player.x, 1.4, this.player.z)
  }

  private paintHud(): void {
    const run = this.run
    if (!run) return
    const goal = this.goal()
    const place = districtName(this.player.x, this.player.z)
    const points: MapPoint[] = MARKERS.filter((m) => m.kind === 'mtr').map((m) => ({ x: m.x, z: m.z, color: '#ff4d4d' }))
    if (goal) points.push({ x: goal.x, z: goal.z, color: '#ffd15c' })
    let objective = tx('按 T 開手機接任務', 'Press T and pick a job')
    if (run.carrying) objective = tx(`蛋撻飛送 · ${Math.ceil(run.deliveryLeft)} 秒`, `Tart run · ${Math.ceil(run.deliveryLeft)}s`)
    else if (run.activeMission === 'home') objective = tx('去金華冰室買菠蘿包', 'Buy a pineapple bun at the cafe')
    else if (run.activeMission === 'tart') objective = tx('返冰室拎蛋撻', 'Pick up the tarts')
    else if (run.activeMission === 'neon') objective = tx(`影招牌 ${run.neons.length}/5`, `Signs ${run.neons.length}/5`)
    const prompt = this.promptText()
    const arrow = goal ? normalizeAngle(Math.atan2(goal.x - this.player.x, goal.z - this.player.z) - this.player.yaw) : null
    this.hud.update({
      money: run.money,
      health: run.health,
      clock: clockLabel(run.gameMinutes),
      stars: run.wanted,
      title: this.profile.equipped ? titleName(this.profile.equipped) : tx('未有稱號', 'No title'),
      objective,
      prompt,
      place: tx(place.zh, place.en),
      arrow,
      x: this.player.x,
      z: this.player.z,
      yaw: this.player.yaw,
      boxes: this.world.colliders,
      points
    })
  }

  private promptText(): string {
    const run = this.run
    if (!run) return ''
    if (run.mode !== 'foot') return tx('按 F 落車', 'Press F to get out')
    const near = this.nearestInteract()
    if (near?.kind === 'cha') return tx('按 E 入金華冰室', 'Press E to enter the cafe')
    if (near?.kind === 'mtr') return tx('按 E 搭港鐵', 'Press E for the MTR')
    if (near?.kind === 'neon') return tx('按 E 影低招牌', 'Press E to photograph the sign')
    if (near?.kind === 'busker') return tx(`按 E 打賞 $${TIP_COST}`, `Press E to tip $${TIP_COST}`)
    if (near?.kind === 'souvenir') return tx(`按 E 買明信片 $${POSTCARD_COST}`, `Press E to buy a postcard $${POSTCARD_COST}`)
    const taxiD = Math.hypot(this.world.taxi.position.x - this.player.x, this.world.taxi.position.z - this.player.z)
    const tramD = Math.hypot(this.world.tramX - this.player.x, -33 - this.player.z)
    if (taxiD < 3.5 && taxiD <= tramD) return tx('按 F 上的士', 'Press F to drive the taxi')
    if (tramD < 4.4) return tx('按 F 上叮叮', 'Press F to board the tram')
    return ''
  }

  private refreshTitles(): void {
    const fresh = newlyEarned(this.profile, this.run)
    if (!fresh.length) return
    for (const id of fresh) {
      this.profile.unlocked.push(id)
      this.pushToast(`${tx(UI.titleGet.zh, UI.titleGet.en)}：${titleName(id)}`)
    }
    if (!this.profile.equipped && this.profile.unlocked[0]) this.profile.equipped = this.profile.unlocked[0]
    saveProfile(this.profile)
  }

  private pushToast(text: string): void {
    this.toasts.push(text)
    if (!this.toastBusy) this.pumpToast()
  }

  private pumpToast(): void {
    const next = this.toasts.shift()
    if (!next) {
      this.toastBusy = false
      return
    }
    this.toastBusy = true
    this.hud.toast(next)
    window.setTimeout(() => this.pumpToast(), 1700)
  }

  private persist(): void {
    if (this.run) saveRun(this.run)
    saveProfile(this.profile)
  }

  private resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / Math.max(1, h)
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }
}
