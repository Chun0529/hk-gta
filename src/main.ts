import { Game } from './game/Game'
import { MenuApp } from './menu/MenuApp'
import { UI, tx } from './i18n'
import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#view')
const menuRoot = document.querySelector<HTMLElement>('#menu')
const hudRoot = document.querySelector<HTMLElement>('#hud')

if (!canvas || !menuRoot || !hudRoot) {
  throw new Error('Missing app root')
}

try {
  const game = new Game(canvas, hudRoot)
  const menu = new MenuApp(menuRoot, {
    profile: () => game.profile,
    hasRun: () => game.hasRun(),
    summary: () => game.summary(),
    setCharacter: (id) => game.setCharacter(id),
    equip: (id) => game.equip(id),
    setRain: (on) => game.setRain(on),
    setHints: (on) => game.setHints(on),
    setSensitivity: (n) => game.setSensitivity(n),
    startNew: () => game.startNew(),
    continueGame: () => game.continueGame()
  })
  game.bindMenu({
    hide: () => menu.hide(),
    show: () => menu.show()
  })
} catch (error) {
  console.error(error)
  menuRoot.hidden = false
  menuRoot.innerHTML = `<p class="summary" style="padding:24px">${tx(UI.webgl.zh, UI.webgl.en)}</p>`
}
