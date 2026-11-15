// Pixel clip oracle: render a text box clipped and again released (overflow lifted), then count the
// pixels that differ outside the box. Content the clip hid shows up there once released.
// The release-and-diff idea comes from cathrynlavery/diagram-design (MIT); no code is copied.
import type { Rgba } from './packet-png.ts'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface ClipResult {
  clipped: boolean
  fullCount: number
  downscaledCount: number
}

/** Pixels around the box that are never counted, so anti-aliasing at the edge is not a spill. */
export const GUARD_PX = 2
/** Changed pixels needed before a pair reads as clipped. */
export const MIN_CHANGED_PIXELS = 8
/** A channel delta must exceed this at full size to count. */
export const FULL_DELTA = 16
/** A channel delta must exceed this on an averaged block to count. */
export const DOWNSCALED_DELTA = 8
export const DOWNSCALE_FACTOR = 4

// Averaging can't raise a delta, so a faint spill spread across many pixels only shows at a lower
// threshold than the full-size pass uses.

function maxChannelDelta(a: Rgba, b: Rgba, i: number): number {
  let max = 0
  for (let c = 0; c < 4; c++) max = Math.max(max, Math.abs((a.data[i + c] ?? 0) - (b.data[i + c] ?? 0)))
  return max
}

function countOutside(a: Rgba, b: Rgba, box: Box, minDelta: number): number {
  const x0 = box.x - GUARD_PX
  const y0 = box.y - GUARD_PX
  const x1 = box.x + box.w + GUARD_PX
  const y1 = box.y + box.h + GUARD_PX
  let count = 0
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1
      if (!inside && maxChannelDelta(a, b, (y * a.width + x) * 4) > minDelta) count++
    }
  }
  return count
}

function downscale(image: Rgba): Rgba {
  const width = Math.ceil(image.width / DOWNSCALE_FACTOR)
  const height = Math.ceil(image.height / DOWNSCALE_FACTOR)
  const data = Buffer.alloc(width * height * 4)
  for (let by = 0; by < height; by++) {
    for (let bx = 0; bx < width; bx++) {
      for (let c = 0; c < 4; c++) data[(by * width + bx) * 4 + c] = blockMean(image, bx, by, c)
    }
  }
  return { width, height, data }
}

function blockMean(image: Rgba, bx: number, by: number, channel: number): number {
  let sum = 0
  let n = 0
  for (let y = by * DOWNSCALE_FACTOR; y < Math.min((by + 1) * DOWNSCALE_FACTOR, image.height); y++) {
    for (let x = bx * DOWNSCALE_FACTOR; x < Math.min((bx + 1) * DOWNSCALE_FACTOR, image.width); x++) {
      sum += image.data[(y * image.width + x) * 4 + channel] ?? 0
      n++
    }
  }
  return Math.round(sum / n)
}

function downscaleBox(box: Box): Box {
  const x0 = Math.floor(box.x / DOWNSCALE_FACTOR)
  const y0 = Math.floor(box.y / DOWNSCALE_FACTOR)
  const x1 = Math.ceil((box.x + box.w) / DOWNSCALE_FACTOR)
  const y1 = Math.ceil((box.y + box.h) / DOWNSCALE_FACTOR)
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/**
 * Compares the clipped and released renders of one text box. `box` is in layout units and `scale`
 * is the device scale of both buffers, so the box is multiplied by it before comparing.
 */
export function clipDiff(clipped: Rgba, released: Rgba, box: Box, scale: number): ClipResult {
  if (clipped.width !== released.width || clipped.height !== released.height)
    throw new Error('clipDiff needs two renders of the same size')
  const px: Box = { x: box.x * scale, y: box.y * scale, w: box.w * scale, h: box.h * scale }
  const fullCount = countOutside(clipped, released, px, FULL_DELTA)
  const downscaledCount = countOutside(
    downscale(clipped),
    downscale(released),
    downscaleBox(px),
    DOWNSCALED_DELTA
  )
  return {
    clipped: fullCount >= MIN_CHANGED_PIXELS || downscaledCount >= MIN_CHANGED_PIXELS,
    fullCount,
    downscaledCount,
  }
}
