// Elliptical arc to cubic Béziers. Ported from @remotion/paths (MIT, (c) 2023 JonnyBurger) at commit
// 4d9ff70e1f, helpers/remove-a-s-t-curves.ts, which follows fontello/svgpath's a2c. The maths is the
// endpoint-to-centre conversion of SVG 1.1 appendix F.6.5; see ./LICENSE.
import type { PathPoint } from './parse'

/** A cubic's two control points and end point; the start is the previous end. */
export type CubicTail = readonly [PathPoint, PathPoint, PathPoint]

interface ArcInput {
  from: PathPoint
  to: PathPoint
  rx: number
  ry: number
  rotation: number
  largeArc: boolean
  sweep: boolean
}

interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
  cos: number
  sin: number
  theta: number
  delta: number
}

function angleBetween(ux: number, uy: number, vx: number, vy: number): number {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1
  const dot = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))
  return sign * Math.acos(Math.min(1, Math.max(-1, dot)))
}

function centre(arc: ArcInput, cos: number, sin: number): Ellipse {
  const dx = (arc.from.x - arc.to.x) / 2
  const dy = (arc.from.y - arc.to.y) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  let rx = Math.abs(arc.rx)
  let ry = Math.abs(arc.ry)
  // Radii too small to reach the end point scale up uniformly (F.6.6).
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
  if (lambda > 1) [rx, ry] = [rx * Math.sqrt(lambda), ry * Math.sqrt(lambda)]
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1
  const root = Math.sqrt(Math.max(0, num) / den) * (arc.largeArc === arc.sweep ? -1 : 1)
  const cx1 = (root * rx * y1) / ry
  const cy1 = (-root * ry * x1) / rx
  const theta = angleBetween(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
  let delta = angleBetween((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
  if (!arc.sweep && delta > 0) delta -= 2 * Math.PI
  if (arc.sweep && delta < 0) delta += 2 * Math.PI
  const cx = cos * cx1 - sin * cy1 + (arc.from.x + arc.to.x) / 2
  const cy = sin * cx1 + cos * cy1 + (arc.from.y + arc.to.y) / 2
  return { cx, cy, rx, ry, cos, sin, theta, delta }
}

function onEllipse(e: Ellipse, ux: number, uy: number): PathPoint {
  const x = ux * e.rx
  const y = uy * e.ry
  return { x: e.cos * x - e.sin * y + e.cx, y: e.sin * x + e.cos * y + e.cy }
}

function unitArcCubic(e: Ellipse, theta: number, delta: number): CubicTail {
  const k = (4 / 3) * Math.tan(delta / 4)
  const [c1, s1] = [Math.cos(theta), Math.sin(theta)]
  const [c2, s2] = [Math.cos(theta + delta), Math.sin(theta + delta)]
  return [
    onEllipse(e, c1 - s1 * k, s1 + c1 * k),
    onEllipse(e, c2 + s2 * k, s2 - c2 * k),
    onEllipse(e, c2, s2),
  ]
}

/**
 * Converts an SVG arc to cubics of at most 45° each (radial error under 5e-6 of the radius). A zero radius gives a straight
 * line (`null`), and an arc to its own start point gives no segments, as SVG renders them.
 */
export function arcToCubics(arc: ArcInput): CubicTail[] | null {
  if (arc.from.x === arc.to.x && arc.from.y === arc.to.y) return []
  if (arc.rx === 0 || arc.ry === 0) return null
  const phi = (arc.rotation * Math.PI) / 180
  const e = centre(arc, Math.cos(phi), Math.sin(phi))
  const count = Math.max(1, Math.ceil(Math.abs(e.delta) / (Math.PI / 4) - 1e-9))
  const step = e.delta / count
  const cubics = Array.from({ length: count }, (_, i) => unitArcCubic(e, e.theta + i * step, step))
  // Land exactly on the authored end point, not on its round-tripped twin.
  const last = cubics[count - 1]!
  cubics[count - 1] = [last[0], last[1], arc.to]
  return cubics
}
