import { CHARACTERS, characterById } from '../data/characters'
import { SPAWN, TAXI_SPAWN } from '../data/district'

export interface Run {
  v: 1
  characterId: string
  money: number
  health: number
  x: number
  z: number
  yaw: number
  mode: 'foot' | 'taxi' | 'tram'
  taxiX: number
  taxiZ: number
  taxiYaw: number
  taxiSpeed: number
  tramX: number
  walkM: number
  rainWalkM: number
  driveM: number
  honks: number
  nearMiss: number
  redLights: number
  mtrRides: number
  chaVisits: number
  buns: number
  spent: number
  milk: string[]
  neons: string[]
  missionsDone: string[]
  lkfSeconds: number
  ferrySeconds: number
  tramTravelM: number
  gameMinutes: number
  wanted: number
  wantedLeft: number
  activeMission: 'home' | 'tart' | 'neon' | null
  carrying: boolean
  deliveryLeft: number
  repeatJob: boolean
}

export interface Profile {
  v: 1
  characterId: string
  unlocked: string[]
  equipped: string
  sensitivity: number
  rain: boolean
  hints: boolean
  played: string[]
}

const PROFILE_KEY = 'hk-gta-profile-v1'
const RUN_KEY = 'hk-gta-run-v1'

export function defaultProfile(): Profile {
  return {
    v: 1,
    characterId: 'keung',
    unlocked: [],
    equipped: '',
    sensitivity: 1,
    rain: false,
    hints: true,
    played: []
  }
}

export function freshRun(characterId: string): Run {
  const id = characterById(characterId).id
  return {
    v: 1,
    characterId: id,
    money: 180,
    health: 100,
    x: SPAWN.x,
    z: SPAWN.z,
    yaw: SPAWN.yaw,
    mode: 'foot',
    taxiX: TAXI_SPAWN.x,
    taxiZ: TAXI_SPAWN.z,
    taxiYaw: TAXI_SPAWN.yaw,
    taxiSpeed: 0,
    tramX: -40,
    walkM: 0,
    rainWalkM: 0,
    driveM: 0,
    honks: 0,
    nearMiss: 0,
    redLights: 0,
    mtrRides: 0,
    chaVisits: 0,
    buns: 0,
    spent: 0,
    milk: [],
    neons: [],
    missionsDone: [],
    lkfSeconds: 0,
    ferrySeconds: 0,
    tramTravelM: 0,
    gameMinutes: 0,
    wanted: 0,
    wantedLeft: 0,
    activeMission: 'home',
    carrying: false,
    deliveryLeft: 0,
    repeatJob: false
  }
}

function mergeProfile(raw: Partial<Profile> | null): Profile {
  const base = defaultProfile()
  if (!raw || raw.v !== 1) return base
  const characterId = CHARACTERS.some((c) => c.id === raw.characterId) ? raw.characterId! : base.characterId
  return {
    ...base,
    ...raw,
    characterId,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((id) => typeof id === 'string') : [],
    played: Array.isArray(raw.played) ? raw.played.filter((id) => typeof id === 'string') : [],
    equipped: typeof raw.equipped === 'string' ? raw.equipped : ''
  }
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return mergeProfile(raw ? (JSON.parse(raw) as Partial<Profile>) : null)
  } catch {
    return defaultProfile()
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function loadRun(): Run | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    const run = JSON.parse(raw) as Run
    if (run.v !== 1 || !CHARACTERS.some((c) => c.id === run.characterId)) return null
    return run
  } catch {
    return null
  }
}

export function saveRun(run: Run): void {
  localStorage.setItem(RUN_KEY, JSON.stringify(run))
}

export function clearRun(): void {
  localStorage.removeItem(RUN_KEY)
}
