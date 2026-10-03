import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphPoint } from '../types'

/** Pixel geometry shared by the free-form layouts; these are px numbers, not tokens. */
export const LAYOUT_DEFAULTS = {
  LINK_DISTANCE: 80,
  /** Keeps two node marks and their padding apart. */
  COLLIDE_RADIUS: 14,
  /** Reading order groups nodes whose y falls in the same band of this height. */
  ROW_BAND: 30,
  PADDING: GRAPH_NODE_PADDING,
  LABEL_ROOM: GRAPH_LABEL_ROOM,
} as const

export interface LayoutSize {
  width: number
  height: number
}

export interface PackCircle {
  id: string
  radius: number
}

export interface PackedCircle extends PackCircle {
  cx: number
  cy: number
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const round2 = (value: number) => Math.round(value * 100) / 100 + 0

/** A finite number becomes an unsigned 32-bit integer; anything else becomes 1. */
export function toSeed(seed: number | undefined): number {
  return typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : 1
}

/** Floors `value` into `min..max`; a non-finite value takes `fallback`. */
export function clampInt(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, Math.floor(value)))
}

const viewportExtent = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

/**
 * Translates so every position sits at least `PADDING` from the top and left, adds label room on the
 * right, and centres the padded box when it is smaller than the viewport. Rounds to 0.01.
 */
export function frameLayout(
  positions: Readonly<Record<string, GraphPoint>>,
  viewport: LayoutSize
): { positions: Record<string, GraphPoint> } & LayoutSize {
  const { PADDING, LABEL_ROOM } = LAYOUT_DEFAULTS
  const ids = Object.keys(positions).sort(compareText)
  const xs = ids.map((id) => (positions[id] as GraphPoint).x)
  const ys = ids.map((id) => (positions[id] as GraphPoint).y)
  const minX = xs.length > 0 ? Math.min(...xs) : 0
  const minY = ys.length > 0 ? Math.min(...ys) : 0
  const spanX = xs.length > 0 ? Math.max(...xs) - minX : 0
  const spanY = ys.length > 0 ? Math.max(...ys) - minY : 0
  const naturalWidth = spanX + PADDING * 2 + LABEL_ROOM
  const naturalHeight = spanY + PADDING * 2
  const width = Math.max(naturalWidth, viewportExtent(viewport.width))
  const height = Math.max(naturalHeight, viewportExtent(viewport.height))
  const offsetX = PADDING - minX + (width - naturalWidth) / 2
  const offsetY = PADDING - minY + (height - naturalHeight) / 2
  return {
    positions: Object.fromEntries(
      ids.map((id) => {
        const { x, y } = positions[id] as GraphPoint
        return [id, { x: round2(x + offsetX), y: round2(y + offsetY) }]
      })
    ),
    width: round2(width),
    height: round2(height),
  }
}

/** Bands of `ROW_BAND` px by y, then x, then id. */
export function readingOrder(positions: Readonly<Record<string, GraphPoint>>): string[] {
  const { ROW_BAND } = LAYOUT_DEFAULTS
  const at = (id: string) => positions[id] as GraphPoint
  const band = (id: string) => Math.floor(at(id).y / ROW_BAND)
  return Object.keys(positions).sort(
    (a, b) => band(a) - band(b) || at(a).x - at(b).x || compareText(a, b)
  )
}

/**
 * Packs circles in rows, left to right in the order given. A row wraps when the next circle would
 * pass `width`; a circle wider than `width` takes a row alone. `gap` separates neighbours and rows.
 */
export function packCircles(
  circles: readonly PackCircle[],
  { width, gap }: { width: number; gap: number }
): { circles: PackedCircle[] } & LayoutSize {
  const placed: PackedCircle[] = []
  let rowTop = 0
  let rowHeight = 0
  let cursor = 0
  let usedWidth = 0
  for (const circle of circles) {
    const diameter = circle.radius * 2
    if (cursor > 0 && cursor + diameter > width) {
      rowTop += rowHeight + gap
      rowHeight = 0
      cursor = 0
    }
    placed.push({ ...circle, cx: cursor + circle.radius, cy: rowTop + circle.radius })
    cursor += diameter + gap
    usedWidth = Math.max(usedWidth, cursor - gap)
    rowHeight = Math.max(rowHeight, diameter)
  }
  return { circles: placed, width: usedWidth, height: rowTop + rowHeight }
}
