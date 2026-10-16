import { describe, expect, it } from 'vitest'
import { diffImages } from '../src/packet-diff.ts'
import { BAR_COLORS, BAR_H, GUTTER, checkerAt, montage } from '../src/packet-montage.ts'
import { readPng, solidImage, type Rgba } from '../src/packet-png.ts'

const BEFORE = [0, 0, 255, 255]
const AFTER = [0, 255, 0, 255]

function pixelAt(image: Rgba, x: number, y: number): number[] {
  const i = (y * image.width + x) * 4
  return [...image.data.subarray(i, i + 4)]
}

function changed(before: Rgba, after: Rgba): Rgba {
  const diff = diffImages(before, after)
  return readPng(
    montage({ change: 'changed', before, after, diff: diff.kind === 'pixel' ? diff.image : null })
  )
}

describe('montage', () => {
  it('lays a small change out BEFORE | AFTER | DIFF at 4x', () => {
    const result = changed(solidImage(40, 20, BEFORE), solidImage(40, 20, AFTER))

    expect(result.width).toBe(3 * 160 + 2 * GUTTER)
    expect(result.height).toBe(BAR_H + 20 * 4)
    expect(pixelAt(result, 0, BAR_H)).toEqual(BEFORE)
    expect(pixelAt(result, 160 + GUTTER, BAR_H)).toEqual(AFTER)
    expect(pixelAt(result, 160 + GUTTER - 1, BAR_H)).not.toEqual(AFTER)
  })

  it('stacks a wide shot top to bottom at 1x', () => {
    // 600 wide is past 1080/2, so 1x, and 3 x 600 overflows 1600 across; short keeps the PNG cheap.
    const result = changed(solidImage(600, 10, BEFORE), solidImage(600, 10, AFTER))

    expect(result.width).toBe(600)
    expect(result.height).toBeGreaterThan(3 * 10)
    expect(pixelAt(result, 0, 10 + BAR_H + GUTTER + BAR_H)).toEqual(AFTER)
  })

  it('draws a new baseline alone under a magenta bar', () => {
    const result = readPng(montage({ change: 'new', after: solidImage(40, 20, AFTER) }))

    expect(pixelAt(result, 0, 0)).toEqual([...BAR_COLORS.new])
    expect(result.width).toBe(160)
    expect(pixelAt(result, 159, BAR_H)).toEqual(AFTER)
  })

  it('aligns a pair that changed size on one checker-padded canvas', () => {
    const result = changed(solidImage(40, 20, BEFORE), solidImage(40, 24, AFTER))
    const afterX = 160 + GUTTER
    const row22 = BAR_H + 22 * 4

    expect(result.width).toBe(2 * 160 + GUTTER)
    expect(result.height).toBe(BAR_H + 24 * 4)
    expect(pixelAt(result, 0, row22)).toEqual([...checkerAt(0, 22)])
    expect(pixelAt(result, 4 * 9, row22)).toEqual([...checkerAt(9, 22)])
    expect(pixelAt(result, afterX, row22)).toEqual(AFTER)
  })
})
