export interface Building {
  x: number
  z: number
  w: number
  d: number
  h: number
  color: string
}

export type MarkerKind = 'cha' | 'mtr' | 'neon' | 'milk' | 'ferry' | 'drop' | 'busker' | 'souvenir'

export interface Marker {
  id: string
  kind: MarkerKind
  x: number
  z: number
  labelZh: string
  labelEn: string
  stationId?: 'central' | 'admiralty' | 'wanchai'
}

export const SPAWN = { x: -88, z: -14, yaw: 0 }
export const TAXI_SPAWN = { x: -70, z: -26, yaw: Math.PI / 2 }

export const BOUNDS = { minX: -115, maxX: 115, minZ: -60, maxZ: 78 }
export const WATER_Z = -44
export const PIER = { minX: -104, maxX: -66, minZ: -60, maxZ: -36 }
export const LKF = { minX: -42, maxX: -26, minZ: 8, maxZ: 58 }
export const FERRY_ZONE = { minX: -104, maxX: -66, minZ: -60, maxZ: -40 }
export const ROAD = { minZ: -36, maxZ: -16 }

export const BUILDINGS: Building[] = [
  { x: -104, z: 6, w: 16, d: 16, h: 14, color: '#2c3340' },
  { x: -58, z: 8, w: 12, d: 14, h: 16, color: '#3a414c' },
  { x: -4, z: 6, w: 14, d: 16, h: 28, color: '#2e3644' },
  { x: 16, z: 8, w: 12, d: 14, h: 36, color: '#34304a' },
  { x: 28, z: 5, w: 10, d: 14, h: 18, color: '#3d4450' },
  { x: 68, z: 6, w: 16, d: 16, h: 15, color: '#323846' },
  { x: 96, z: 7, w: 18, d: 16, h: 32, color: '#2a3142' },
  { x: -102, z: 48, w: 16, d: 14, h: 11, color: '#35312c' },
  { x: -74, z: 48, w: 16, d: 12, h: 8, color: '#4a3428' },
  { x: -8, z: 50, w: 16, d: 14, h: 22, color: '#303844' },
  { x: 22, z: 48, w: 16, d: 14, h: 14, color: '#3a342e' },
  { x: 72, z: 50, w: 20, d: 12, h: 16, color: '#2e343c' },
  { x: 102, z: 48, w: 14, d: 14, h: 24, color: '#262b36' }
]

export const MARKERS: Marker[] = [
  { id: 'cha', kind: 'cha', x: -74, z: 40, labelZh: '金華冰室', labelEn: 'Kam Wah Cafe' },
  { id: 'drop', kind: 'drop', x: 78, z: 18, labelZh: '灣仔交收', labelEn: 'Wan Chai drop' },
  { id: 'ferry', kind: 'ferry', x: -84, z: -50, labelZh: '天星碼頭', labelEn: 'Star Ferry' },
  { id: 'souvenir', kind: 'souvenir', x: -92, z: -48, labelZh: '碼頭明信片', labelEn: 'Pier postcards' },
  { id: 'busker', kind: 'busker', x: -24, z: -40, labelZh: '海傍藝人', labelEn: 'Promenade busker' },
  { id: 'mtr-central', kind: 'mtr', x: -80, z: -12, stationId: 'central', labelZh: '中環站', labelEn: 'Central' },
  { id: 'mtr-admiralty', kind: 'mtr', x: 2, z: -12, stationId: 'admiralty', labelZh: '金鐘站', labelEn: 'Admiralty' },
  { id: 'mtr-wanchai', kind: 'mtr', x: 70, z: -12, stationId: 'wanchai', labelZh: '灣仔站', labelEn: 'Wan Chai' },
  { id: 'neon-cafe', kind: 'neon', x: -74, z: 41.2, labelZh: '金華冰室', labelEn: 'Kam Wah Cafe' },
  { id: 'neon-tart', kind: 'neon', x: -66, z: 41.2, labelZh: '蛋撻王', labelEn: 'Tart King' },
  { id: 'neon-lkf', kind: 'neon', x: -34, z: 30, labelZh: '蘭桂霓虹', labelEn: 'LKF Neon' },
  { id: 'neon-pawn', kind: 'neon', x: 84, z: 4, labelZh: '維港當鋪', labelEn: 'Harbour Pawn' },
  { id: 'neon-ice', kind: 'neon', x: -104, z: -4, labelZh: '海傍冰廳', labelEn: 'Promenade Cafe' },
  { id: 'milk-1', kind: 'milk', x: -96, z: -40, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-2', kind: 'milk', x: -34, z: 18, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-3', kind: 'milk', x: 8, z: -8, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-4', kind: 'milk', x: 108, z: 16, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-5', kind: 'milk', x: -48, z: 20, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-6', kind: 'milk', x: -90, z: 22, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-7', kind: 'milk', x: 40, z: 40, labelZh: '絲襪奶茶', labelEn: 'Milk tea' },
  { id: 'milk-8', kind: 'milk', x: 54, z: -30, labelZh: '絲襪奶茶', labelEn: 'Milk tea' }
]

export const RED_LIGHTS = [
  { id: 'west', x: -20, z: -26, phase: 0 },
  { id: 'east', x: 45, z: -26, phase: 4.2 }
]

export const GLASS_TOWER = { x: -90, z: 8 }
export const BOC_TOWER = { x: -56, z: 8 }

export function inRect(x: number, z: number, r: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean {
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ
}

export function districtName(x: number, z: number): { zh: string; en: string } {
  if (z < -40 && x < -50) return { zh: '中環 · 天星碼頭', en: 'Central · Star Ferry' }
  if (inRect(x, z, LKF)) return { zh: '中環 · 蘭桂坊', en: 'Central · Lan Kwai Fong' }
  if (x < -30) return { zh: '中環', en: 'Central' }
  if (x < 36) return { zh: '金鐘', en: 'Admiralty' }
  return { zh: '灣仔', en: 'Wan Chai' }
}
