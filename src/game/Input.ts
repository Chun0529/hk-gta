export class Input {
  sensitivity = 1
  enabled = true
  lookX = 0
  lookY = 0
  stickX = 0
  stickY = 0
  private keys = new Set<string>()
  private just = new Set<string>()
  private stickPointer = -1
  private lookPointer = -1
  private stickOrigin = { x: 0, y: 0 }
  private lastLook = new Map<number, { x: number; y: number }>()

  constructor(private el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return
      if (!this.keys.has(e.code)) this.just.add(e.code)
      this.keys.add(e.code)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))
    window.addEventListener('blur', () => {
      this.keys.clear()
      this.stickX = 0
      this.stickY = 0
    })
    el.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === el) {
        this.lookX += e.movementX
        this.lookY += e.movementY
      }
    })
    el.addEventListener('click', () => {
      if (this.enabled && document.pointerLockElement !== el) void el.requestPointerLock?.()
    })
    el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false })
    el.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false })
    el.addEventListener('touchend', (e) => this.onTouchEnd(e))
    el.addEventListener('touchcancel', (e) => this.onTouchEnd(e))
  }

  press(code: string): void {
    if (!this.keys.has(code)) this.just.add(code)
    this.keys.add(code)
    window.setTimeout(() => this.keys.delete(code), 80)
  }

  consume(code: string): boolean {
    if (!this.just.has(code)) return false
    this.just.delete(code)
    return true
  }

  held(code: string): boolean {
    return this.keys.has(code)
  }

  endFrame(): void {
    this.just.clear()
    this.lookX = 0
    this.lookY = 0
  }

  private onTouchStart(e: TouchEvent): void {
    if (!this.enabled) return
    for (const t of Array.from(e.changedTouches)) {
      if (t.clientX < window.innerWidth * 0.42 && this.stickPointer < 0) {
        this.stickPointer = t.identifier
        this.stickOrigin = { x: t.clientX, y: t.clientY }
        e.preventDefault()
      } else if (this.lookPointer < 0) {
        this.lookPointer = t.identifier
        this.lastLook.set(t.identifier, { x: t.clientX, y: t.clientY })
        e.preventDefault()
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickPointer) {
        const max = 70
        this.stickX = Math.max(-1, Math.min(1, (t.clientX - this.stickOrigin.x) / max))
        this.stickY = Math.max(-1, Math.min(1, (t.clientY - this.stickOrigin.y) / max))
        e.preventDefault()
      } else if (t.identifier === this.lookPointer) {
        const prev = this.lastLook.get(t.identifier)
        if (prev) {
          this.lookX += t.clientX - prev.x
          this.lookY += t.clientY - prev.y
        }
        this.lastLook.set(t.identifier, { x: t.clientX, y: t.clientY })
        e.preventDefault()
      }
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickPointer) {
        this.stickPointer = -1
        this.stickX = 0
        this.stickY = 0
      }
      if (t.identifier === this.lookPointer) {
        this.lookPointer = -1
        this.lastLook.delete(t.identifier)
      }
    }
  }
}
