export interface MissionDef {
  id: 'home' | 'tart' | 'neon'
  zh: string
  en: string
  briefZh: string
  briefEn: string
  reward: number
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'home',
    zh: '返到香港',
    en: 'Back in Hong Kong',
    briefZh: '行去金華冰室，買個菠蘿包話過自己返咗嚟。',
    briefEn: 'Walk to Kam Wah Cafe and buy a pineapple bun.',
    reward: 200
  },
  {
    id: 'tart',
    zh: '蛋撻飛送',
    en: 'Tart Run',
    briefZh: '九十秒內把蛋撻由中環送到灣仔。',
    briefEn: 'Get the egg tarts from Central to Wan Chai in ninety seconds.',
    reward: 500
  },
  {
    id: 'neon',
    zh: '霓虹打卡',
    en: 'Neon Check-in',
    briefZh: '影低海傍五塊招牌。',
    briefEn: 'Photograph the five waterfront signs.',
    reward: 300
  }
]

export const SHOP = [
  { id: 'bun', zh: '菠蘿包', en: 'Pineapple bun', price: 18, heal: 40 },
  { id: 'tea', zh: '凍奶茶', en: 'Iced milk tea', price: 28, heal: 15 },
  { id: 'tart', zh: '蛋撻', en: 'Egg tart', price: 22, heal: 10 },
  { id: 'toast', zh: '西多士', en: 'French toast', price: 36, heal: 30 }
] as const

export const REPEAT_PAY = 250
export const MILK_PAY = 25
export const TIP_COST = 50
export const POSTCARD_COST = 60
