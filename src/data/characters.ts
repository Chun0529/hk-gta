export interface CharacterDef {
  id: string
  zh: string
  en: string
  titleId: string
  zhBio: string
  enBio: string
  shirt: number
  accent: number
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'keung',
    zh: '阿強',
    en: 'Keung',
    titleId: 'taxi_king',
    zhBio: '紅磡長大，開開夜更的士，條街冇彎位佢未甩過。',
    enBio: 'Raised in Hung Hom. Night-shift taxi driver who has drifted every bend on this road.',
    shirt: 0xf2f2f2,
    accent: 0xc1121f
  },
  {
    id: 'may',
    zh: '阿May',
    en: 'May',
    titleId: 'van_god',
    zhBio: '北角綠van世家，話事靠鐘同油門。',
    enBio: 'North Point minibus family. She keeps time with the throttle.',
    shirt: 0x1f8a4c,
    accent: 0xf4e04d
  },
  {
    id: 'kaming',
    zh: '家明',
    en: 'Ka Ming',
    titleId: 'temple_boss',
    zhBio: '油麻地街坊，廟街邊檔收檔都識人。',
    enBio: 'Yau Ma Tei local. Knows every stall on Temple Street from open to close.',
    shirt: 0x1b1b1b,
    accent: 0xd4a017
  },
  {
    id: 'ling',
    zh: '阿Ling',
    en: 'Ling',
    titleId: 'ferry_mate',
    zhBio: '天星小輪大副，維港霧再大都睇到碼頭。',
    enBio: 'Star Ferry mate. She can find the pier through any harbour fog.',
    shirt: 0x1d3557,
    accent: 0xe8e4d8
  }
]

export function characterById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]
}
