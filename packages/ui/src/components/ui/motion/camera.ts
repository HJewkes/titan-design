// A 2D camera as a pure function of stations: the frame at t never depends on the previous frame.
import type { Easing } from './easing'
import { MOTION } from './tokens'

/** A point in world or screen space. */
export interface Point {
  x: number
  y: number
}

/** A world-space rectangle: top-left corner plus a positive size. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The screen size the camera renders into, in px. */
export interface Viewport {
  width: number
  height: number
}

/** What the camera shows: `box` fitted into the viewport, with `screen = world * scale + offset`. */
export interface CameraFrame {
  /** The world box the camera is framing. */
  box: Box
  /** Screen px per world unit. */
  scale: number
  /** Screen position of the world origin. */
  offset: Point
}

/**
 * The camera rests on `box` from `atS`, and its move there ends at `atS`. A `null` box marks a span
 * with no map: the camera holds its last box and moves on from it to the next station.
 */
export interface CameraStation {
  atS: number
  box: Box | null
}

/** Options for `camera`. */
export interface CameraOptions {
  viewport: Viewport
  /** Seconds a move lasts, cut short so it never starts before the previous station. Default 1.5. */
  moveS?: number
  /** Applied to move progress. Default `MOTION.ease.inOut`. */
  ease?: Easing
  /** Screen px kept clear around the framed box. Default 0. */
  padding?: number
}

const DEFAULT_MOVE_S = 1.5

function assertPositiveSize({ width, height }: Box): void {
  if (!(width > 0 && height > 0)) {
    throw new RangeError(`camera: box size must be positive, got ${width} x ${height}`)
  }
}

/** The frame that shows all of `box`, centred, as large as fits inside `padding`. */
export function fitBox(box: Box, viewport: Viewport, padding = 0): CameraFrame {
  assertPositiveSize(box)
  const scale = Math.min(
    (viewport.width - 2 * padding) / box.width,
    (viewport.height - 2 * padding) / box.height
  )
  return {
    box,
    scale,
    offset: {
      x: viewport.width / 2 - (box.x + box.width / 2) * scale,
      y: viewport.height / 2 - (box.y + box.height / 2) * scale,
    },
  }
}

/** The screen point of world point `p`. */
export function project({ scale, offset }: CameraFrame, p: Point): Point {
  return { x: p.x * scale + offset.x, y: p.y * scale + offset.y }
}

/** The world point under screen point `p`: the inverse of `project`. */
export function unproject({ scale, offset }: CameraFrame, p: Point): Point {
  return { x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale }
}

const geometric = (a: number, b: number, p: number) => a * (b / a) ** p

/**
 * The box at progress `p` from `from` to `to`. Size moves in log space, so every doubling of zoom
 * takes the same time and mid-move is the geometric mean. The centre follows the size, which makes
 * the move a zoom about the one point that keeps its screen position: a nested target stays in view.
 */
function zoomBox(from: Box, to: Box, p: number): Box {
  if (from === to) return from
  const width = geometric(from.width, to.width, p)
  const height = geometric(from.height, to.height, p)
  const size0 = Math.sqrt(from.width * from.height)
  const size1 = Math.sqrt(to.width * to.height)
  const sizeDelta = size0 - size1
  const k =
    Math.abs(sizeDelta) <= 1e-9 * size0 ? p : (size0 - Math.sqrt(width * height)) / sizeDelta
  const cx = from.x + from.width / 2 + (to.x + to.width / 2 - from.x - from.width / 2) * k
  const cy = from.y + from.height / 2 + (to.y + to.height / 2 - from.y - from.height / 2) * k
  return { x: cx - width / 2, y: cy - height / 2, width, height }
}

function cameraBox(
  t: number,
  stations: readonly CameraStation[],
  moveS: number,
  ease: Easing
): Box | null {
  let held = stations.find((station) => station.box)?.box ?? null
  if (!held) return null
  let previousAtS = -Infinity
  for (const { atS, box } of stations) {
    if (t < atS) {
      if (!box) return held
      const start = Math.max(previousAtS, atS - moveS)
      return t <= start ? held : zoomBox(held, box, ease((t - start) / (atS - start)))
    }
    if (box) held = box
    previousAtS = atS
  }
  return held
}

/**
 * The camera frame at `t` for stations sorted by `atS`. Before the first box it holds that box;
 * across a `null` span it holds the last one. Returns `null` only when no station has a box.
 */
export function camera(
  t: number,
  stations: readonly CameraStation[],
  { viewport, moveS = DEFAULT_MOVE_S, ease = MOTION.ease.inOut, padding = 0 }: CameraOptions
): CameraFrame | null {
  stations.forEach(({ box }) => box && assertPositiveSize(box))
  const box = cameraBox(t, stations, moveS, ease)
  return box && fitBox(box, viewport, padding)
}
