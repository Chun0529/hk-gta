import type { Profile, Run } from '../game/Save'
import { tx } from '../i18n'

export interface TitleDef {
  id: string
  zh: string
  en: string
  hintZh: string
  hintEn: string
}

export const TITLES: TitleDef[] = [
  { id: 'taxi_king', zh: '的士之王', en: 'Taxi King', hintZh: '用阿強開始遊戲', hintEn: 'Start as Keung' },
  { id: 'van_god', zh: '綠van車神', en: 'Minibus Ace', hintZh: '用阿May開始遊戲', hintEn: 'Start as May' },
  { id: 'temple_boss', zh: '廟街話事人', en: 'Temple Street Boss', hintZh: '用家明開始遊戲', hintEn: 'Start as Ka Ming' },
  { id: 'ferry_mate', zh: '天星大副', en: 'Ferry Mate', hintZh: '用阿Ling開始遊戲', hintEn: 'Start as Ling' },
  { id: 'newcomer', zh: '初來報到', en: 'Just Arrived', hintZh: '踏入香港街道', hintEn: 'Step onto the street' },
  { id: 'harbour_walk', zh: '海傍散步', en: 'Harbour Walker', hintZh: '行路 300 米', hintEn: 'Walk 300 metres' },
  { id: 'pineapple', zh: '菠蘿包續命', en: 'Bun Revival', hintZh: '買一個菠蘿包', hintEn: 'Buy a pineapple bun' },
  { id: 'cha_regular', zh: '茶記熟客', en: 'Cafe Regular', hintZh: '入金華冰室 3 次', hintEn: 'Visit the cafe 3 times' },
  { id: 'milk_fan', zh: '絲襪奶茶迷', en: 'Milk Tea Fan', hintZh: '搵到 3 杯絲襪奶茶', hintEn: 'Find 3 milk teas' },
  { id: 'milk_master', zh: '奶茶品鑑師', en: 'Tea Critic', hintZh: '搵齊 8 杯絲襪奶茶', hintEn: 'Find all 8 milk teas' },
  { id: 'tart_runner', zh: '蛋撻飛人', en: 'Tart Runner', hintZh: '完成蛋撻飛送', hintEn: 'Finish the tart delivery' },
  { id: 'neon_collector', zh: '霓虹收藏家', en: 'Neon Collector', hintZh: '影低 5 塊招牌', hintEn: 'Photograph 5 signs' },
  { id: 'tram_regular', zh: '叮叮常客', en: 'Tram Regular', hintZh: '搭叮叮行一段', hintEn: 'Ride the tram a while' },
  { id: 'mtr_commuter', zh: '港鐵通勤族', en: 'MTR Commuter', hintZh: '搭港鐵 3 次', hintEn: 'Take the MTR 3 times' },
  { id: 'lkf_regular', zh: '蘭桂坊熟客', en: 'LKF Regular', hintZh: '夜晚喺蘭桂坊企 30 秒', hintEn: 'Stay in Lan Kwai Fong 30 seconds at night' },
  { id: 'harbour_photo', zh: '維港打卡', en: 'Harbour Check-in', hintZh: '喺天星碼頭企一陣', hintEn: 'Stand at the Star Ferry pier' },
  { id: 'all_nighter', zh: '通宵達人', en: 'All-nighter', hintZh: '玩到凌晨四點', hintEn: 'Stay out until 4:00' },
  { id: 'rain_walker', zh: '落雨都要出街', en: 'Out in the Rain', hintZh: '落雨行 100 米', hintEn: 'Walk 100 metres in the rain' },
  { id: 'horn_symphony', zh: '喇叭交響曲', en: 'Horn Symphony', hintZh: '按 15 次喇叭', hintEn: 'Honk 15 times' },
  { id: 'near_miss_god', zh: '避車之神', en: 'Near-miss Saint', hintZh: '驚險避車 5 次', hintEn: 'Survive 5 near misses' },
  { id: 'red_philosopher', zh: '紅燈哲學家', en: 'Red-light Philosopher', hintZh: '闖 3 次紅燈', hintEn: 'Run 3 red lights' },
  { id: 'night_shift', zh: '的士夜更', en: 'Night Shift', hintZh: '揸的士 1 公里', hintEn: 'Drive the taxi 1 km' },
  { id: 'saver', zh: '慳家', en: 'Saver', hintZh: '身上有 $800', hintEn: 'Hold $800' },
  { id: 'big_spender', zh: '豪客', en: 'Big Spender', hintZh: '消費滿 $400', hintEn: 'Spend $400' },
  { id: 'worker', zh: '打工仔', en: 'Shift Worker', hintZh: '完成序章同蛋撻飛送', hintEn: 'Finish the prologue and the tart run' },
  { id: 'legend', zh: '街頭傳說', en: 'Street Legend', hintZh: '完成全部任務同搵齊奶茶', hintEn: 'Finish every mission and find every milk tea' }
]

export function titleById(id: string): TitleDef | undefined {
  return TITLES.find((t) => t.id === id)
}

export function titleName(id: string): string {
  const t = titleById(id)
  if (!t) return ''
  return tx(t.zh, t.en)
}

export function mountTitleList(root: HTMLElement, profile: Profile, onEquip: (id: string) => void): void {
  root.replaceChildren()
  for (const title of TITLES) {
    const unlocked = profile.unlocked.includes(title.id)
    const equipped = profile.equipped === title.id
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `title-row${unlocked ? '' : ' is-locked'}${equipped ? ' is-on' : ''}`
    const name = document.createElement('strong')
    name.textContent = tx(title.zh, title.en)
    const hint = document.createElement('span')
    hint.textContent = unlocked ? (equipped ? tx('裝備中', 'Equipped') : tx(title.hintZh, title.hintEn)) : tx(title.hintZh, title.hintEn)
    btn.append(name, hint)
    btn.disabled = !unlocked
    btn.addEventListener('click', () => onEquip(title.id))
    root.append(btn)
  }
}

function earned(id: string, profile: Profile, run: Run | null): boolean {
  const played = profile.played.includes(
    id === 'taxi_king' ? 'keung' : id === 'van_god' ? 'may' : id === 'temple_boss' ? 'kaming' : id === 'ferry_mate' ? 'ling' : ''
  )
  if (id === 'taxi_king') return played
  if (id === 'van_god') return played
  if (id === 'temple_boss') return played
  if (id === 'ferry_mate') return played
  if (!run) return false
  switch (id) {
    case 'newcomer':
      return true
    case 'harbour_walk':
      return run.walkM >= 300
    case 'pineapple':
      return run.buns >= 1
    case 'cha_regular':
      return run.chaVisits >= 3
    case 'milk_fan':
      return run.milk.length >= 3
    case 'milk_master':
      return run.milk.length >= 8
    case 'tart_runner':
      return run.missionsDone.includes('tart')
    case 'neon_collector':
      return run.neons.length >= 5
    case 'tram_regular':
      return run.tramTravelM >= 60
    case 'mtr_commuter':
      return run.mtrRides >= 3
    case 'lkf_regular':
      return run.lkfSeconds >= 30
    case 'harbour_photo':
      return run.ferrySeconds >= 2
    case 'all_nighter':
      return run.gameMinutes >= 7 * 60
    case 'rain_walker':
      return run.rainWalkM >= 100
    case 'horn_symphony':
      return run.honks >= 15
    case 'near_miss_god':
      return run.nearMiss >= 5
    case 'red_philosopher':
      return run.redLights >= 3
    case 'night_shift':
      return run.driveM >= 1000
    case 'saver':
      return run.money >= 800
    case 'big_spender':
      return run.spent >= 400
    case 'worker':
      return run.missionsDone.includes('home') && run.missionsDone.includes('tart')
    case 'legend':
      return (
        run.missionsDone.includes('home') &&
        run.missionsDone.includes('tart') &&
        run.missionsDone.includes('neon') &&
        run.milk.length >= 8
      )
    default:
      return false
  }
}

export function newlyEarned(profile: Profile, run: Run | null): string[] {
  const fresh: string[] = []
  for (const title of TITLES) {
    if (profile.unlocked.includes(title.id)) continue
    if (earned(title.id, profile, run)) fresh.push(title.id)
  }
  return fresh
}
