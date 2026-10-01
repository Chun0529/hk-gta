import * as THREE from 'three'
import type { Aabb } from './collision'
import { moveWithCollision } from './collision'

export interface MoveInput {
  forward: number
  strafe: number
  turn: number
  lookX: number
  lookY: number
  sprint: boolean
  handbrake: boolean
  sensitivity: number
}

export class Player {
  readonly group = new THREE.Group()
  x = 0
  z = 0
  yaw = 0
  pitch = 0.15
  mode: 'foot' | 'taxi' | 'tram' = 'foot'
  taxiSpeed = 0
  private body: THREE.Mesh
  private head: THREE.Mesh

  constructor(scene: THREE.Scene) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), new THREE.MeshStandardMaterial({ color: 0x22262e }))
    const legR = legL.clone()
    legL.position.set(-0.14, 0.35, 0)
    legR.position.set(0.14, 0.35, 0)
    this.body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.7, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.55, emissive: 0x888888, emissiveIntensity: 0.35 })
    )
    this.body.position.y = 1.05
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe7c2a4 }))
    this.head.position.y = 1.58
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), new THREE.MeshStandardMaterial({ color: 0xc1121f }))
    cap.position.y = 1.74
    cap.name = 'cap'
    this.group.add(legL, legR, this.body, this.head, cap)
    scene.add(this.group)
  }

  setOutfit(shirt: number, accent: number): void {
    const bodyMat = this.body.material as THREE.MeshStandardMaterial
    bodyMat.color.setHex(shirt)
    bodyMat.emissive.setHex(shirt)
    const cap = this.group.getObjectByName('cap') as THREE.Mesh | undefined
    if (cap) (cap.material as THREE.MeshStandardMaterial).color.setHex(accent)
  }

  addLook(input: MoveInput, dt: number): void {
    this.yaw += input.turn * dt * 1.8
    this.yaw -= input.lookX * 0.0022 * input.sensitivity
    this.pitch = Math.max(-0.35, Math.min(0.55, this.pitch - input.lookY * 0.0016 * input.sensitivity))
  }

  updateFoot(dt: number, input: MoveInput, boxes: Aabb[]): number {
    this.addLook(input, dt)
    const mag = Math.hypot(input.forward, input.strafe)
    if (mag < 0.08) {
      this.sync()
      return 0
    }
    const speed = (input.sprint || mag > 0.92 ? 11 : 6.2)
    const f = input.forward / mag
    const s = input.strafe / mag
    const dx = (Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * speed * dt
    const dz = (Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * speed * dt
    const next = moveWithCollision(this.x, this.z, 0.45, dx, dz, boxes)
    this.x = next.x
    this.z = next.z
    this.sync()
    return next.moved
  }

  updateTaxi(dt: number, input: MoveInput, taxi: THREE.Group, boxes: Aabb[]): number {
    this.addLook(input, dt * 0.15)
    const steer = input.strafe + input.turn
    const rate = (input.handbrake ? 2.3 : 1.15) * (0.35 + Math.min(1, Math.abs(this.taxiSpeed) / 12))
    this.yaw += steer * dt * rate
    if (input.forward > 0.1) this.taxiSpeed += dt * 16
    else if (input.forward < -0.1) this.taxiSpeed -= dt * 20
    else this.taxiSpeed *= Math.exp(-dt * 1.15)
    if (input.handbrake) this.taxiSpeed *= Math.exp(-dt * 2.6)
    this.taxiSpeed = Math.max(-8, Math.min(26, this.taxiSpeed))
    const dx = Math.sin(this.yaw) * this.taxiSpeed * dt
    const dz = Math.cos(this.yaw) * this.taxiSpeed * dt
    const next = moveWithCollision(this.x, this.z, 1.15, dx, dz, boxes)
    if (next.moved < Math.hypot(dx, dz) * 0.45) this.taxiSpeed *= 0.2
    this.x = next.x
    this.z = next.z
    taxi.position.set(this.x, 0.35, this.z)
    taxi.rotation.y = this.yaw
    this.group.visible = false
    return next.moved
  }

  sync(): void {
    this.group.visible = this.mode === 'foot'
    this.group.position.set(this.x, 0, this.z)
    this.group.rotation.y = this.yaw
  }
}
