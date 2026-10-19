// Where a map card sits beside its anchor, as a pure function of the anchor and the viewport.
// Nothing is measured at render: the card's size is a prop, so every frame places it the same way.
import type { Point, Viewport } from '../motion/camera'

/** Which side of its anchor a card sits on. */
export type MapCardSide = 'left' | 'right'

/** A card's size in screen px. */
export interface MapCardSize {
  /** Width in px. */
  width: number
  /** Height in px. */
  height: number
}

/** Inputs of {@link mapCardPlacement}. */
export interface MapCardPlacementInput {
  /** The anchor's screen point, as `project()` returns it. */
  anchor: Point
  /** The screen the map renders into, in px. */
  viewport: Viewport
  /** The card's box size. */
  size: MapCardSize
  /** `auto` prefers the right and flips left when the card would cross the right margin. */
  side?: 'auto' | MapCardSide
  /** The card stays above this fraction of the viewport height, clear of the captions. Default 0.83. */
  keepOutFraction?: number
}

/** A card's box and its leader line, in screen px. */
export interface MapCardPlacement {
  /** The side the card ended up on. */
  side: MapCardSide
  /** The card's box: inside the viewport margins and above the keep-out. */
  box: { x: number; y: number; width: number; height: number }
  /** From the anchor to the card's near edge. */
  leader: { from: Point; to: Point }
  /** The viewport y below which captions sit. */
  keepOutY: number
}

/** The default caption keep-out: the card stays above 83% of the viewport height. */
export const MAP_CARD_KEEP_OUT = 0.83
/** Horizontal run of the leader line from the anchor to the card. */
export const MAP_CARD_LEADER_PX = 48
/** The card keeps this far inside the viewport and above the keep-out. */
export const MAP_CARD_MARGIN_PX = 24
/** The leader meets the card no nearer than this to a corner, clear of the rounded radius. */
const CORNER_PX = 16

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

function resolveSide(input: MapCardPlacementInput): MapCardSide {
  const { side = 'auto', anchor, viewport, size } = input
  if (side !== 'auto') return side
  const rightEdge = anchor.x + MAP_CARD_LEADER_PX + size.width
  return rightEdge > viewport.width - MAP_CARD_MARGIN_PX ? 'left' : 'right'
}

/**
 * Places a card beside `anchor`: on its side, vertically centred on it, kept inside the viewport
 * margins and above the caption keep-out. The keep-out wins over the top margin when both cannot hold.
 */
export function mapCardPlacement(input: MapCardPlacementInput): MapCardPlacement {
  const { anchor, viewport, size, keepOutFraction = MAP_CARD_KEEP_OUT } = input
  const side = resolveSide(input)
  const keepOutY = keepOutFraction * viewport.height
  const preferredX =
    side === 'right' ? anchor.x + MAP_CARD_LEADER_PX : anchor.x - MAP_CARD_LEADER_PX - size.width
  const x = clamp(preferredX, MAP_CARD_MARGIN_PX, viewport.width - MAP_CARD_MARGIN_PX - size.width)
  const y = Math.min(
    Math.max(anchor.y - size.height / 2, MAP_CARD_MARGIN_PX),
    keepOutY - MAP_CARD_MARGIN_PX - size.height
  )
  const edgeX = side === 'right' ? x : x + size.width
  const corner = Math.min(CORNER_PX, size.height / 2)
  const edgeY = clamp(anchor.y, y + corner, y + size.height - corner)
  return {
    side,
    box: { x, y, width: size.width, height: size.height },
    leader: { from: anchor, to: { x: edgeX, y: edgeY } },
    keepOutY,
  }
}
