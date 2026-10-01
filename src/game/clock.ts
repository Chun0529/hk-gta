export function clockLabel(gameMinutes: number): string {
  const total = Math.floor(21 * 60 + gameMinutes) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function clockHour(gameMinutes: number): number {
  return Math.floor(((21 * 60 + gameMinutes) % (24 * 60)) / 60)
}

let audio: AudioContext | null = null

function context(): AudioContext | null {
  const Ctx = window.AudioContext
  if (!Ctx) return null
  if (!audio) audio = new Ctx()
  return audio
}

function beep(freq: number, dur: number, type: OscillatorType, gain: number): void {
  const ctx = context()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  amp.gain.value = gain
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start()
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  osc.stop(ctx.currentTime + dur + 0.02)
}

export function hornSound(): void {
  beep(196, 0.22, 'square', 0.03)
}

export function blip(): void {
  beep(660, 0.08, 'sine', 0.04)
}
