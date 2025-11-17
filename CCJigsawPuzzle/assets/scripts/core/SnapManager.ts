import { SnapConfig, Vec2 } from './types'

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

export function angleDiff(aDeg: number, bDeg: number): number {
  let d = Math.abs(aDeg - bDeg) % 360
  if (d > 180) d = 360 - d
  return d
}

export function canSnap(pos: Vec2, targetPos: Vec2, rotDeg: number, targetRotDeg: number, cfg: SnapConfig): boolean {
  return distance(pos, targetPos) <= cfg.distanceThreshold && angleDiff(rotDeg, targetRotDeg) <= cfg.angleThreshold
}