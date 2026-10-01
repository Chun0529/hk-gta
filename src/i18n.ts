export type Lang = 'zh' | 'en'

const LANG_KEY = 'hk-gta-lang'
const listeners = new Set<() => void>()

function readLang(): Lang {
  return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh'
}

let lang: Lang = readLang()

export function getLang(): Lang {
  return lang
}

export function setLang(next: Lang): void {
  lang = next
  localStorage.setItem(LANG_KEY, next)
  document.documentElement.lang = next === 'zh' ? 'zh-Hant' : 'en'
  listeners.forEach((fn) => fn())
}

export function onLang(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function tx(zh: string, en: string): string {
  return lang === 'zh' ? zh : en
}

export const TIPS: { zh: string; en: string }[] = [
  { zh: '落雨路滑，的士要早啲煞。', en: 'Rain makes the road slick. Brake the taxi early.' },
  { zh: '金華冰室菠蘿包可以補血，十八蚊。', en: 'A pineapple bun at Kam Wah Cafe heals you. Eighteen dollars.' },
  { zh: '港鐵口可以秒去中環、金鐘、灣仔。', en: 'MTR entrances jump you between Central, Admiralty and Wan Chai.' },
  { zh: '闖紅燈會有一粒星，駛入蘭桂坊橫街先甩到。', en: 'A red light earns a star. Lose it in the Lan Kwai Fong alley.' },
  { zh: '按 M 開地圖，按 T 開手機接任務。', en: 'Press M for the map. Press T to open your phone and take jobs.' },
  { zh: '絲襪奶茶藏喺街角，搵得愈多稱號愈勁。', en: 'Milk tea is tucked in corners. Find more, unlock more titles.' },
  { zh: '天星碼頭企一陣，就當打咗卡。', en: 'Stand at the Star Ferry pier and you have checked in.' },
  { zh: '叮叮喺海傍慢慢行，跳上去兜個圈。', en: 'The tram crawls the waterfront. Hop on and ride a loop.' }
]

export const UI = {
  disclaimer: {
    zh: '本作所有品牌皆為虛構諧仿，與 Rockstar Games 無關',
    en: 'All brands are fictional parody and are not affiliated with Rockstar Games'
  },
  devices: { zh: '鍵盤滑鼠 · 觸控 皆可遊玩', en: 'Keyboard, mouse and touch' },
  start: { zh: '開始遊戲', en: 'Start Game' },
  continue: { zh: '繼續遊戲', en: 'Continue' },
  newGame: { zh: '新遊戲', en: 'New Game' },
  character: { zh: '選擇角色', en: 'Character' },
  titles: { zh: '稱號', en: 'Titles' },
  settings: { zh: '設定', en: 'Settings' },
  controls: { zh: '操作說明', en: 'Controls' },
  back: { zh: '返回', en: 'Back' },
  selected: { zh: '已選擇', en: 'Selected' },
  select: { zh: '選擇', en: 'Select' },
  equipped: { zh: '裝備中', en: 'Equipped' },
  equip: { zh: '裝備', en: 'Equip' },
  locked: { zh: '未解鎖', en: 'Locked' },
  sensitivity: { zh: '滑鼠靈敏度', en: 'Mouse sensitivity' },
  rain: { zh: '落雨', en: 'Rain' },
  hints: { zh: '新手提示', en: 'Hints' },
  on: { zh: '開', en: 'On' },
  off: { zh: '關', en: 'Off' },
  confirmNew: { zh: '新遊戲會重置街道進度。已解鎖稱號會保留。', en: 'A new game resets the streets. Unlocked titles stay.' },
  confirm: { zh: '確定重置', en: 'Reset' },
  cancel: { zh: '取消', en: 'Cancel' },
  resume: { zh: '繼續玩', en: 'Resume' },
  quit: { zh: '回主選單', en: 'Main menu' },
  phone: { zh: '手機', en: 'Phone' },
  map: { zh: '地圖', en: 'Map' },
  missions: { zh: '任務', en: 'Missions' },
  stats: { zh: '紀錄', en: 'Stats' },
  accept: { zh: '接取', en: 'Accept' },
  active: { zh: '進行中', en: 'Active' },
  done: { zh: '完成', en: 'Done' },
  reward: { zh: '報酬', en: 'Reward' },
  shop: { zh: '金華冰室', en: 'Kam Wah Cafe' },
  buy: { zh: '買', en: 'Buy' },
  heal: { zh: '回血', en: 'heals' },
  pickup: { zh: '拎起蛋撻出發', en: 'Pick up tarts and go' },
  mtr: { zh: '港鐵', en: 'MTR' },
  ride: { zh: '搭去', en: 'Ride to' },
  here: { zh: '而家呢度', en: 'You are here' },
  repeat: { zh: '再接蛋撻速遞', en: 'Another tart run' },
  money: { zh: '錢', en: 'Cash' },
  health: { zh: '血', en: 'Health' },
  milk: { zh: '奶茶', en: 'Milk tea' },
  walk: { zh: '行路', en: 'Walked' },
  drive: { zh: '揸車', en: 'Driven' },
  close: { zh: '關閉', en: 'Close' },
  fullscreen: { zh: '全螢幕', en: 'Fullscreen' },
  tip: { zh: '小提示', en: 'Tip' },
  place: { zh: '太平山 · 維港夜景', en: 'THE PEAK · VICTORIA HARBOUR' },
  webgl: { zh: '呢個瀏覽器開唔到 3D。請換 Chrome 或 Edge。', en: 'WebGL is unavailable. Try Chrome or Edge.' },
  poor: { zh: '錢唔夠。', en: 'Not enough cash.' },
  hospital: { zh: '你俾車撞到，送咗去急症。', en: 'A car hit you. You woke up at A&E.' },
  titleGet: { zh: '解鎖稱號', en: 'Title unlocked' },
  missionGet: { zh: '任務完成', en: 'Mission complete' },
  missionFail: { zh: '蛋撻遲咗，返冰室再拎過。', en: 'The tarts are late. Pick up another box.' },
  photo: { zh: '影低咗', en: 'Shot saved' },
  alreadyPhoto: { zh: '呢塊招牌影過啦。', en: 'You already shot this sign.' },
  milkGet: { zh: '搵到一杯絲襪奶茶', en: 'Found a milk tea' },
  welcome: { zh: 'WASD 行，Q/E 轉，E 互動，F 上車。', en: 'WASD move, Q/E turn, E interact, F enter.' },
  star: { zh: '差人盯住你。駛入蘭桂坊橫街。', en: 'The police clocked you. Duck into Lan Kwai Fong.' },
  clearStar: { zh: '甩到咗。', en: 'You lost them.' }
} as const
