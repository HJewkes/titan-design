import { describe, expect, it } from 'vitest'
import { clipDiff, type Box } from '../src/clip-oracle.ts'
import type { Rgba } from '../src/packet-png.ts'

const SIZE = 64
const BOX: Box = { x: 16, y: 16, w: 32, h: 32 }

function blank(): Rgba {
  const data = Buffer.alloc(SIZE * SIZE * 4, 100)
  return { width: SIZE, height: SIZE, data }
}

function paint(image: Rgba, x: number, y: number, delta: number): void {
  const i = (y * image.width + x) * 4
  image.data[i] = (image.data[i] ?? 0) + delta
}

/** `count` pixels in a row along y=4, well clear of the box and its guard band. */
function spill(count: number, delta: number): Rgba {
  const image = blank()
  for (let n = 0; n < count; n++) paint(image, 4 + n, 4, delta)
  return image
}

/** A 4-row band along the top edge, every pixel changed by `delta`: whole blocks at 0.25x. */
function faintBand(delta: number): Rgba {
  const image = blank()
  for (let y = 0; y < 4; y++) for (let x = 0; x < SIZE; x++) paint(image, x, y, delta)
  return image
}

describe('clipDiff', () => {
  it('fires when 12 pixels change outside the guard band', () => {
    expect(clipDiff(spill(12, 40), blank(), BOX, 1).clipped).toBe(true)
  })

  it('does not fire when only 7 pixels change outside the guard band', () => {
    expect(clipDiff(spill(7, 40), blank(), BOX, 1).clipped).toBe(false)
  })

  it('ignores changes inside the 2 px guard band around the box', () => {
    const image = blank()
    for (let x = 14; x < 50; x++) paint(image, x, 14, 80)
    for (let x = 14; x < 50; x++) paint(image, x, 49, 80)
    expect(clipDiff(image, blank(), BOX, 1).clipped).toBe(false)
  })

  it('does not fire on deltas of exactly 16', () => {
    expect(clipDiff(spill(20, 16), blank(), BOX, 1).clipped).toBe(false)
  })

  it('fires only at 0.25x on a faint spill spread over many pixels', () => {
    const result = clipDiff(faintBand(12), blank(), BOX, 1)

    expect(result.fullCount).toBe(0)
    expect(result.downscaledCount).toBeGreaterThanOrEqual(8)
    expect(result.clipped).toBe(true)
  })

  it('fires at neither resolution on an identical pair', () => {
    const result = clipDiff(blank(), blank(), BOX, 1)

    expect(result).toEqual({ clipped: false, fullCount: 0, downscaledCount: 0 })
  })

  it('scales the box by the device scale before comparing', () => {
    const wide: Rgba = { width: SIZE * 2, height: SIZE * 2, data: Buffer.alloc(SIZE * SIZE * 16, 100) }
    for (let x = 40; x < 90; x++) paint(wide, x, 40, 80)

    expect(clipDiff(wide, { ...wide, data: Buffer.alloc(wide.data.length, 100) }, BOX, 2).clipped).toBe(false)
  })

  it('throws when the two buffers differ in size', () => {
    const small: Rgba = { width: 8, height: 8, data: Buffer.alloc(256) }

    expect(() => clipDiff(small, blank(), BOX, 1)).toThrow(/size/)
  })
})
