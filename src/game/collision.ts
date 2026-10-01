import { BOUNDS, PIER, WATER_Z } from '../data/district'

export interface Aabb {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export function overlaps(x: number, z: number, r: number, b: Aabb): boolean {
  const cx = Math.max(b.minX, Math.min(x, b.maxX))
  const cz = Math.max(b.minZ, Math.min(z, b.maxZ))
  const dx = x - cx
  const dz = z - cz
  return dx * dx + dz * dz < r * r
}

export function blocked(x: number, z: number, r: number, boxes: Aabb[]): boolean {
  if (x - r < BOUNDS.minX || x + r > BOUNDS.maxX || z + r > BOUNDS.maxZ) return true
  if (z - r < WATER_Z) {
    const onPier = x > PIER.minX && x < PIER.maxX && z > PIER.minZ
    if (!onPier) return true
  }
  return boxes.some((b) => overlaps(x, z, r, b))
}

export function moveWithCollision(
  x: number,
  z: number,
  r: number,
  dx: number,
  dz: number,
  boxes: Aabb[]
): { x: number; z: number; moved: number } {
  let nx = x + dx
  if (blocked(nx, z, r, boxes)) nx = x
  let nz = z + dz
  if (blocked(nx, nz, r, boxes)) nz = z
  return { x: nx, z: nz, moved: Math.hypot(nx - x, nz - z) }
}

export function normalizeAngle(a: number): number {
  let v = a
  while (v > Math.PI) v -= Math.PI * 2
  while (v < -Math.PI) v += Math.PI * 2
  return v
}
