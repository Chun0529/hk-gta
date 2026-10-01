import { BOUNDS } from '../data/district'
import { MISSIONS, REPEAT_PAY, SHOP } from '../data/missions'
import { mountTitleList } from '../data/titles'
import type { Aabb } from '../game/collision'
import type { Profile, Run } from '../game/Save'
import { UI, tx } from '../i18n'

export interface MapPoint {
  x: number
  z: number
  color: string
}

export interface HudHandlers {
  onResume: () => void
  onQuit: () => void
  onEquip: (id: string) => void
  onBuy: (id: string) => void
  onPickup: () => void
  onMtr: (stationId: string) => void
  onAccept: (id: 'tart' | 'neon') => void
  onRepeat: () => void
  onRain: () => void
  onPress: (code: string) => void
}

export class Hud {
  private live: HTMLElement
  private panel: HTMLElement
  private toastEl: HTMLElement
  private flashEl: HTMLElement
  private mini: HTMLCanvasElement
  private toastTimer = 0

  constructor(
    private root: HTMLElement,
    private handlers: HudHandlers
  ) {
    this.root.innerHTML = `
      <div class="flash"></div>
      <div class="toast"></div>
      <div class="hud-live">
        <div class="hud-stats">
          <div class="cash"></div>
          <div class="clock"></div>
          <div class="stars"></div>
          <div class="hp"><span></span></div>
        </div>
        <div class="hud-side">
          <div class="arrow" hidden>▲</div>
          <canvas class="minimap" width="168" height="168"></canvas>
          <div class="badge"></div>
          <div class="place"></div>
        </div>
        <div class="objective"></div>
        <div class="prompt"></div>
      </div>
      <div class="panel" hidden></div>
      <div class="touch">
        <button type="button" data-code="KeyE">E</button>
        <button type="button" data-code="KeyF">F</button>
        <button type="button" data-code="KeyH">H</button>
        <button type="button" data-code="KeyT">T</button>
        <button type="button" data-code="KeyM">M</button>
      </div>
    `
    this.live = this.root.querySelector('.hud-live') as HTMLElement
    this.panel = this.root.querySelector('.panel') as HTMLElement
    this.toastEl = this.root.querySelector('.toast') as HTMLElement
    this.flashEl = this.root.querySelector('.flash') as HTMLElement
    this.mini = this.root.querySelector('.minimap') as HTMLCanvasElement
    this.root.querySelectorAll<HTMLButtonElement>('.touch button').forEach((btn) => {
      const code = btn.dataset.code ?? ''
      const fire = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        this.handlers.onPress(code)
      }
      btn.addEventListener('pointerdown', fire)
    })
  }

  show(): void {
    this.root.hidden = false
  }

  hide(): void {
    this.root.hidden = true
    this.closePanel()
  }

  toast(text: string): void {
    this.toastEl.textContent = text
    this.toastEl.classList.add('show')
    window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 2400)
  }

  flash(): void {
    this.flashEl.classList.add('on')
    window.setTimeout(() => this.flashEl.classList.remove('on'), 140)
  }

  closePanel(): void {
    this.panel.hidden = true
    this.panel.replaceChildren()
  }

  panelOpen(): boolean {
    return !this.panel.hidden
  }

  update(opts: {
    money: number
    health: number
    clock: string
    stars: number
    title: string
    objective: string
    prompt: string
    place: string
    arrow: number | null
    x: number
    z: number
    yaw: number
    boxes: Aabb[]
    points: MapPoint[]
  }): void {
    const cash = this.root.querySelector('.cash') as HTMLElement
    const clock = this.root.querySelector('.clock') as HTMLElement
    const stars = this.root.querySelector('.stars') as HTMLElement
    const hp = this.root.querySelector('.hp span') as HTMLElement
    const badge = this.root.querySelector('.badge') as HTMLElement
    const place = this.root.querySelector('.place') as HTMLElement
    const objective = this.root.querySelector('.objective') as HTMLElement
    const prompt = this.root.querySelector('.prompt') as HTMLElement
    const arrow = this.root.querySelector('.arrow') as HTMLElement
    cash.textContent = `$${opts.money}`
    clock.textContent = opts.clock
    stars.textContent = opts.stars > 0 ? '★' : ''
    hp.style.width = `${Math.max(0, Math.min(100, opts.health))}%`
    badge.textContent = opts.title
    place.textContent = opts.place
    objective.textContent = opts.objective
    prompt.textContent = opts.prompt
    prompt.hidden = !opts.prompt
    if (opts.arrow === null) arrow.hidden = true
    else {
      arrow.hidden = false
      arrow.style.transform = `rotate(${opts.arrow}rad)`
    }
    this.drawMap(opts.x, opts.z, opts.yaw, opts.boxes, opts.points)
  }

  openPause(profile: Profile): void {
    this.fill(`
      <h2>${tx('暫停', 'Paused')}</h2>
      <button type="button" class="btn-primary" data-act="resume">${tx(UI.resume.zh, UI.resume.en)}</button>
      <div class="title-list"></div>
      <button type="button" class="btn-ghost" data-act="quit">${tx(UI.quit.zh, UI.quit.en)}</button>
    `)
    const list = this.panel.querySelector('.title-list') as HTMLElement
    mountTitleList(list, profile, (id) => {
      this.handlers.onEquip(id)
    })
    this.panel.querySelector('[data-act="resume"]')?.addEventListener('click', () => this.handlers.onResume())
    this.panel.querySelector('[data-act="quit"]')?.addEventListener('click', () => this.handlers.onQuit())
  }

  refreshTitles(profile: Profile): void {
    const list = this.panel.querySelector('.title-list')
    if (list) mountTitleList(list as HTMLElement, profile, (id) => this.handlers.onEquip(id))
  }

  openPhone(run: Run, profile: Profile): void {
    const cards = MISSIONS.map((m) => {
      const done = run.missionsDone.includes(m.id)
      const active = run.activeMission === m.id
      const locked = m.id !== 'home' && !run.missionsDone.includes('home')
      const state = done ? tx(UI.done.zh, UI.done.en) : active ? tx(UI.active.zh, UI.active.en) : locked ? tx(UI.locked.zh, UI.locked.en) : tx(UI.accept.zh, UI.accept.en)
      const canAccept = !done && !locked && !active && m.id !== 'home'
      return `<article class="card">
        <header><strong>${tx(m.zh, m.en)}</strong><em>${state}</em></header>
        <p>${tx(m.briefZh, m.briefEn)}</p>
        <footer>$${m.reward} ${canAccept ? `<button type="button" data-accept="${m.id}">${tx(UI.accept.zh, UI.accept.en)}</button>` : ''}</footer>
      </article>`
    }).join('')
    const repeat = run.missionsDone.includes('tart') && !run.carrying
      ? `<button type="button" class="btn-primary" data-act="repeat">${tx(UI.repeat.zh, UI.repeat.en)} $${REPEAT_PAY}</button>`
      : ''
    this.fill(`
      <h2>${tx(UI.phone.zh, UI.phone.en)}</h2>
      <div class="phone-grid">
        <section><h3>${tx(UI.missions.zh, UI.missions.en)}</h3>${cards}${repeat}</section>
        <section>
          <h3>${tx(UI.stats.zh, UI.stats.en)}</h3>
          <ul class="stats">
            <li>${tx(UI.money.zh, UI.money.en)} $${run.money}</li>
            <li>${tx(UI.milk.zh, UI.milk.en)} ${run.milk.length}/8</li>
            <li>${tx(UI.walk.zh, UI.walk.en)} ${Math.floor(run.walkM)} m</li>
            <li>${tx(UI.drive.zh, UI.drive.en)} ${Math.floor(run.driveM)} m</li>
            <li>${tx(UI.titles.zh, UI.titles.en)} ${profile.unlocked.length}</li>
          </ul>
          <button type="button" class="btn-ghost" data-act="rain">${tx(UI.rain.zh, UI.rain.en)}：${profile.rain ? tx(UI.on.zh, UI.on.en) : tx(UI.off.zh, UI.off.en)}</button>
        </section>
      </div>
      <button type="button" class="btn-ghost" data-act="close">${tx(UI.close.zh, UI.close.en)}</button>
    `)
    this.panel.querySelectorAll<HTMLButtonElement>('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', () => this.handlers.onAccept(btn.dataset.accept as 'tart' | 'neon'))
    })
    this.panel.querySelector('[data-act="repeat"]')?.addEventListener('click', () => this.handlers.onRepeat())
    this.panel.querySelector('[data-act="rain"]')?.addEventListener('click', () => this.handlers.onRain())
    this.panel.querySelector('[data-act="close"]')?.addEventListener('click', () => this.handlers.onResume())
  }

  openMap(): void {
    this.fill(`
      <h2>${tx(UI.map.zh, UI.map.en)}</h2>
      <p class="lead">${tx('中環喺西，灣仔喺東。黃點係目標，紅點係港鐵。', 'Central is west, Wan Chai is east. Yellow is the goal, red is the MTR.')}</p>
      <button type="button" class="btn-ghost" data-act="close">${tx(UI.close.zh, UI.close.en)}</button>
    `)
    this.panel.querySelector('[data-act="close"]')?.addEventListener('click', () => this.handlers.onResume())
  }

  openShop(run: Run): void {
    const items = SHOP.map(
      (item) => `<button type="button" data-buy="${item.id}">
        <strong>${tx(item.zh, item.en)}</strong>
        <span>$${item.price} · ${tx(UI.heal.zh, UI.heal.en)} ${item.heal}</span>
      </button>`
    ).join('')
    const pickup =
      (run.activeMission === 'tart' || run.repeatJob) && !run.carrying
        ? `<button type="button" class="btn-primary" data-act="pickup">${tx(UI.pickup.zh, UI.pickup.en)}</button>`
        : ''
    this.fill(`
      <h2>${tx(UI.shop.zh, UI.shop.en)}</h2>
      <div class="shop-list">${items}</div>
      ${pickup}
      <button type="button" class="btn-ghost" data-act="close">${tx(UI.close.zh, UI.close.en)}</button>
    `)
    this.panel.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => this.handlers.onBuy(btn.dataset.buy ?? ''))
    })
    this.panel.querySelector('[data-act="pickup"]')?.addEventListener('click', () => this.handlers.onPickup())
    this.panel.querySelector('[data-act="close"]')?.addEventListener('click', () => this.handlers.onResume())
  }

  openMtr(here: string): void {
    const stations = [
      { id: 'central', zh: '中環', en: 'Central' },
      { id: 'admiralty', zh: '金鐘', en: 'Admiralty' },
      { id: 'wanchai', zh: '灣仔', en: 'Wan Chai' }
    ]
    const buttons = stations
      .map((s) => {
        const label = tx(s.zh, s.en)
        if (s.id === here) return `<button type="button" disabled>${label} · ${tx(UI.here.zh, UI.here.en)}</button>`
        return `<button type="button" data-mtr="${s.id}">${tx(UI.ride.zh, UI.ride.en)} ${label}</button>`
      })
      .join('')
    this.fill(`
      <h2>${tx(UI.mtr.zh, UI.mtr.en)}</h2>
      <div class="shop-list">${buttons}</div>
      <button type="button" class="btn-ghost" data-act="close">${tx(UI.close.zh, UI.close.en)}</button>
    `)
    this.panel.querySelectorAll<HTMLButtonElement>('[data-mtr]').forEach((btn) => {
      btn.addEventListener('click', () => this.handlers.onMtr(btn.dataset.mtr ?? ''))
    })
    this.panel.querySelector('[data-act="close"]')?.addEventListener('click', () => this.handlers.onResume())
  }

  private fill(html: string): void {
    this.panel.hidden = false
    this.panel.innerHTML = html
  }

  private drawMap(px: number, pz: number, yaw: number, boxes: Aabb[], points: MapPoint[]): void {
    const ctx = this.mini.getContext('2d')
    if (!ctx) return
    const w = 168
    const h = 168
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#12151c'
    ctx.fillRect(0, 0, w, h)
    const X = (x: number) => ((x - BOUNDS.minX) / (BOUNDS.maxX - BOUNDS.minX)) * w
    const Y = (z: number) => ((z - BOUNDS.minZ) / (BOUNDS.maxZ - BOUNDS.minZ)) * h
    ctx.fillStyle = '#243044'
    ctx.fillRect(0, 0, w, Y(-16))
    ctx.fillStyle = '#3a3d46'
    ctx.fillRect(0, Y(-36), w, Y(-16) - Y(-36))
    ctx.fillStyle = '#2a2e38'
    for (const b of boxes) {
      ctx.fillRect(X(b.minX), Y(b.minZ), Math.max(2, X(b.maxX) - X(b.minX)), Math.max(2, Y(b.maxZ) - Y(b.minZ)))
    }
    for (const p of points) {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(X(p.x), Y(p.z), 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.save()
    ctx.translate(X(px), Y(pz))
    ctx.rotate(Math.PI - yaw)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(0, -7)
    ctx.lineTo(5, 6)
    ctx.lineTo(-5, 6)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
