import { CHARACTERS } from '../data/characters'
import { mountTitleList } from '../data/titles'
import type { Profile } from '../game/Save'
import { TIPS, UI, getLang, onLang, setLang, tx } from '../i18n'

export interface MenuApi {
  profile: () => Profile
  hasRun: () => boolean
  summary: () => string
  setCharacter: (id: string) => void
  equip: (id: string) => void
  setRain: (on: boolean) => void
  setHints: (on: boolean) => void
  setSensitivity: (n: number) => void
  startNew: () => void
  continueGame: () => void
}

type Screen = 'main' | 'character' | 'titles' | 'settings' | 'controls' | 'confirm'

export class MenuApp {
  private screen: Screen = 'main'
  private tip = 0
  private timer = 0

  constructor(
    private root: HTMLElement,
    private api: MenuApi
  ) {
    onLang(() => {
      if (!this.root.hidden) this.render()
    })
    this.timer = window.setInterval(() => {
      this.tip = (this.tip + 1) % TIPS.length
      const el = this.root.querySelector('.tip-text')
      if (el) el.textContent = tx(TIPS[this.tip].zh, TIPS[this.tip].en)
    }, 4200)
    this.render()
  }

  show(): void {
    this.root.hidden = false
    this.screen = 'main'
    this.render()
  }

  hide(): void {
    this.root.hidden = true
  }

  destroy(): void {
    window.clearInterval(this.timer)
  }

  private render(): void {
    const lang = getLang()
    this.root.innerHTML = `
      <header class="topbar">
        <p>${tx(UI.disclaimer.zh, UI.disclaimer.en)} · ${tx(UI.devices.zh, UI.devices.en)}</p>
        <div class="top-actions">
          <div class="lang" role="group" aria-label="language">
            <button type="button" data-lang="zh" class="${lang === 'zh' ? 'on' : ''}">中文</button>
            <span>/</span>
            <button type="button" data-lang="en" class="${lang === 'en' ? 'on' : ''}">EN</button>
          </div>
          <button type="button" data-act="full">${tx(UI.fullscreen.zh, UI.fullscreen.en)}</button>
        </div>
      </header>
      <div class="menu-body">${this.body()}</div>
      <footer class="ticker">
        <span class="tip-flag">${tx(UI.tip.zh, UI.tip.en)}</span>
        <span class="tip-text">${tx(TIPS[this.tip].zh, TIPS[this.tip].en)}</span>
        <span class="place-label">${tx(UI.place.zh, UI.place.en)}</span>
      </footer>
    `
    this.root.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang === 'en' ? 'en' : 'zh'))
    })
    this.root.querySelector('[data-act="full"]')?.addEventListener('click', () => {
      if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.()
      else void document.exitFullscreen?.()
    })
    this.bind()
  }

  private body(): string {
    if (this.screen === 'main') return this.mainScreen()
    if (this.screen === 'character') return this.characterScreen()
    if (this.screen === 'titles') return `<section class="sheet"><button type="button" class="back" data-screen="main">${tx(UI.back.zh, UI.back.en)}</button><h2>${tx(UI.titles.zh, UI.titles.en)}</h2><div class="title-list" id="title-mount"></div></section>`
    if (this.screen === 'settings') return this.settingsScreen()
    if (this.screen === 'controls') return this.controlsScreen()
    return `
      <section class="sheet">
        <h2>${tx(UI.newGame.zh, UI.newGame.en)}</h2>
        <p>${tx(UI.confirmNew.zh, UI.confirmNew.en)}</p>
        <button type="button" class="btn-primary" data-act="confirm-new">${tx(UI.confirm.zh, UI.confirm.en)}</button>
        <button type="button" class="btn-ghost" data-screen="main">${tx(UI.cancel.zh, UI.cancel.en)}</button>
      </section>`
  }

  private mainScreen(): string {
    const has = this.api.hasRun()
    const summary = has ? `<p class="summary">${this.api.summary()}</p>` : ''
    const primary = has
      ? `<button type="button" class="btn-primary" data-act="continue"><span>▶</span> ${tx(UI.continue.zh, UI.continue.en)}<small>CONTINUE</small></button>`
      : `<button type="button" class="btn-primary" data-act="start"><span>▶</span> ${tx(UI.start.zh, UI.start.en)}<small>START GAME</small></button>`
    const extra = has ? `<button type="button" class="btn-ghost" data-screen="confirm"><i></i>${tx(UI.newGame.zh, UI.newGame.en)}<small>NEW GAME</small></button>` : ''
    return `
      <div class="brand">
        <div class="brand-mark"><span>香</span><span>港</span></div>
        <div>
          <div class="gta">GTA</div>
          <div class="sub"><b>${tx('去香港狂飆', 'Hong Kong Drift')}</b><em>HONG KONG</em></div>
        </div>
      </div>
      <nav class="menu-nav">
        ${primary}
        ${summary}
        ${extra}
        <button type="button" class="btn-ghost" data-screen="character">${tx(UI.character.zh, UI.character.en)}<small>CHARACTER</small></button>
        <button type="button" class="btn-ghost" data-screen="titles">${tx(UI.titles.zh, UI.titles.en)}<small>TITLES</small></button>
        <button type="button" class="btn-ghost" data-screen="settings">${tx(UI.settings.zh, UI.settings.en)}<small>SETTINGS</small></button>
        <button type="button" class="btn-ghost" data-screen="controls">${tx(UI.controls.zh, UI.controls.en)}<small>CONTROLS</small></button>
      </nav>`
  }

  private characterScreen(): string {
    const current = this.api.profile().characterId
    const cards = CHARACTERS.map((c) => {
      const on = c.id === current
      return `<button type="button" class="char ${on ? 'on' : ''}" data-char="${c.id}">
        <span class="swatch" style="background:#${c.shirt.toString(16).padStart(6, '0')}"></span>
        <span><strong>${tx(c.zh, c.en)}</strong><em>${tx(c.zhBio, c.enBio)}</em></span>
        <b>${on ? tx(UI.selected.zh, UI.selected.en) : tx(UI.select.zh, UI.select.en)}</b>
      </button>`
    }).join('')
    return `<section class="sheet"><button type="button" class="back" data-screen="main">${tx(UI.back.zh, UI.back.en)}</button><h2>${tx(UI.character.zh, UI.character.en)}</h2><div class="char-list">${cards}</div></section>`
  }

  private settingsScreen(): string {
    const p = this.api.profile()
    return `<section class="sheet">
      <button type="button" class="back" data-screen="main">${tx(UI.back.zh, UI.back.en)}</button>
      <h2>${tx(UI.settings.zh, UI.settings.en)}</h2>
      <label class="slider">${tx(UI.sensitivity.zh, UI.sensitivity.en)}
        <input type="range" min="0.4" max="2" step="0.1" value="${p.sensitivity}" data-act="sens" />
      </label>
      <button type="button" class="btn-ghost" data-act="rain">${tx(UI.rain.zh, UI.rain.en)}：${p.rain ? tx(UI.on.zh, UI.on.en) : tx(UI.off.zh, UI.off.en)}</button>
      <button type="button" class="btn-ghost" data-act="hints">${tx(UI.hints.zh, UI.hints.en)}：${p.hints ? tx(UI.on.zh, UI.on.en) : tx(UI.off.zh, UI.off.en)}</button>
    </section>`
  }

  private controlsScreen(): string {
    const rows = [
      ['W A S D', tx('移動', 'Move')],
      ['Q / R', tx('轉向（滑鼠亦可）', 'Turn (or use the mouse)')],
      ['Shift', tx('衝刺', 'Sprint')],
      ['E', tx('互動', 'Interact')],
      ['F', tx('上落的士 / 叮叮', 'Enter or exit taxi / tram')],
      ['H', tx('喇叭', 'Horn')],
      ['Space', tx('的士手煞', 'Taxi handbrake')],
      ['M', tx('地圖', 'Map')],
      ['T', tx('手機', 'Phone')],
      ['Esc', tx('暫停', 'Pause')],
      [tx('滑鼠', 'Mouse'), tx('撳畫面鎖定視角', 'Click to lock the camera')],
      [tx('觸控', 'Touch'), tx('左搖桿移動，右拖視角', 'Left stick moves, drag the right side to look')]
    ]
    return `<section class="sheet">
      <button type="button" class="back" data-screen="main">${tx(UI.back.zh, UI.back.en)}</button>
      <h2>${tx(UI.controls.zh, UI.controls.en)}</h2>
      <ul class="keys">${rows.map(([k, v]) => `<li><kbd>${k}</kbd><span>${v}</span></li>`).join('')}</ul>
    </section>`
  }

  private bind(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-screen]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.screen = btn.dataset.screen as Screen
        this.render()
      })
    })
    this.root.querySelector('[data-act="start"]')?.addEventListener('click', () => this.api.startNew())
    this.root.querySelector('[data-act="continue"]')?.addEventListener('click', () => this.api.continueGame())
    this.root.querySelector('[data-act="confirm-new"]')?.addEventListener('click', () => this.api.startNew())
    this.root.querySelectorAll<HTMLButtonElement>('[data-char]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.api.setCharacter(btn.dataset.char ?? 'keung')
        this.render()
      })
    })
    const mount = this.root.querySelector('#title-mount')
    if (mount) {
      mountTitleList(mount as HTMLElement, this.api.profile(), (id) => {
        this.api.equip(id)
        this.render()
      })
    }
    const sens = this.root.querySelector<HTMLInputElement>('[data-act="sens"]')
    sens?.addEventListener('input', () => this.api.setSensitivity(Number(sens.value)))
    this.root.querySelector('[data-act="rain"]')?.addEventListener('click', () => {
      this.api.setRain(!this.api.profile().rain)
      this.render()
    })
    this.root.querySelector('[data-act="hints"]')?.addEventListener('click', () => {
      this.api.setHints(!this.api.profile().hints)
      this.render()
    })
  }
}
