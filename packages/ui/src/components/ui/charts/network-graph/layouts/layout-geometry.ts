import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphPoint } from '../types'

/** Pixel geometry shared by the free-form layouts; these are px numbers, not tokens. */
export const LAYOUT_DEFAULTS = {
  LINK_DISTANCE: 80,
  /** Keeps two node marks and their padding apart. */
  COLLIDE_RADIUS: 14,
  /** Reading order groups nodes whose y falls in the same band of this height. */
  ROW_BAND: 30,
  /** Distance between two ego rings. */
  RING_GAP: 120,
  /** Arc length each node of a crowded ego ring keeps. */
  MIN_ARC: 40,
  /** Space between a cluster's outermost member and its region's edge. */
  REGION_PADDING: 24,
  REGION_GAP: 32,
  /** Height kept above each region for its label. */
  REGION_LABEL_BAND: 24,
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

export const round2 = (value: number) => Math.round(value * 100) / 100 + 0

/** A finite number becomes an unsigned 32-bit integer; anything else becomes 1. */
export function toSeed(seed: number | undefined): number {
  return typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : 1
}

/** Floors `value` into `min..max`; NaN or a missing value takes `fallback`, and ±Infinity clamps. */
export function clampInt(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, Math.floor(value)))
}

const viewportExtent = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

interface Extent {
  minX: number
  minY: number
  spanX: number
  spanY: number
}

function extentOf(points: readonly GraphPoint[]): Extent {
  if (points.length === 0) return { minX: 0, minY: 0, spanX: 0, spanY: 0 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return { minX, minY, spanX: Math.max(...xs) - minX, spanY: Math.max(...ys) - minY }
}

/**
 * Translates so every position and every `bounds` point sits at least `PADDING` from the top and left,
 * adds label room on the right, and centres the padded box when it is smaller than the viewport.
 * Rounds to 0.01; `offset` is the unrounded translation, for drawing shapes in the same frame.
 */
export function frameLayout(
  positions: Readonly<Record<string, GraphPoint>>,
  viewport: LayoutSize,
  bounds: readonly GraphPoint[] = []
): { positions: Record<string, GraphPoint>; offset: GraphPoint } & LayoutSize {
  const { PADDING, LABEL_ROOM } = LAYOUT_DEFAULTS
  const ids = Object.keys(positions).sort(compareText)
  const { minX, minY, spanX, spanY } = extentOf([
    ...ids.map((id) => positions[id] as GraphPoint),
    ...bounds,
  ])
  const naturalWidth = spanX + PADDING * 2 + LABEL_ROOM
  const naturalHeight = spanY + PADDING * 2
  const width = Math.max(naturalWidth, viewportExtent(viewport.width))
  const height = Math.max(naturalHeight, viewportExtent(viewport.height))
  const offset = {
    x: PADDING - minX + (width - naturalWidth) / 2,
    y: PADDING - minY + (height - naturalHeight) / 2,
  }
  return {
    positions: Object.fromEntries(
      ids.map((id) => {
        const { x, y } = positions[id] as GraphPoint
        return [id, { x: round2(x + offset.x), y: round2(y + offset.y) }]
      })
    ),
    offset,
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
 * pass `width`; a circle wider than `width` takes a row alone. `gap` separates neighbours and rows,
 * and `headroom` is kept empty above every row.
 */
export function packCircles(
  circles: readonly PackCircle[],
  { width, gap, headroom = 0 }: { width: number; gap: number; headroom?: number }
): { circles: PackedCircle[] } & LayoutSize {
  const placed: PackedCircle[] = []
  let rowTop = headroom
  let rowHeight = 0
  let cursor = 0
  let usedWidth = 0
  for (const circle of circles) {
    const diameter = circle.radius * 2
    if (cursor > 0 && cursor + diameter > width) {
      rowTop += rowHeight + gap + headroom
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
