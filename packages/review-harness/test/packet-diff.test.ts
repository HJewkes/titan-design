import { describe, expect, it } from 'vitest'
import { diffImages } from '../src/packet-diff.ts'
import { solidImage, type Rgba } from '../src/packet-png.ts'

const BLACK = [0, 0, 0, 255]
const W = 40
const H = 20

function withPixel(image: Rgba, x: number, y: number, rgba: number[]): Rgba {
  const data = Buffer.from(image.data)
  data.set(rgba, (y * image.width + x) * 4)
  return { ...image, data }
}

function pixelAt(image: Rgba, x: number, y: number): number[] {
  const i = (y * image.width + x) * 4
  return [...image.data.subarray(i, i + 4)]
}

describe('diffImages', () => {
  it('counts nothing for an identical pair', () => {
    const image = solidImage(W, H, BLACK)

    expect(diffImages(image, solidImage(W, H, BLACK))).toMatchObject({
      kind: 'pixel',
      diffPixels: 0,
      anyChannelPixels: 0,
    })
  })

  it('counts a one-level channel change exactly but not at the 0.02 threshold', () => {
    const before = solidImage(W, H, [100, 100, 100, 255])

    const diff = diffImages(before, withPixel(before, 3, 4, [101, 100, 100, 255]))

    expect(diff).toMatchObject({ kind: 'pixel', diffPixels: 0, anyChannelPixels: 1 })
  })

  it('paints a real change red over a faded copy of the before image', () => {
    const before = solidImage(W, H, BLACK)
    // (5,5,5) is under the threshold, so pixelmatch paints that pixel as faded `before`, not `after`.
    const after = withPixel(withPixel(before, 0, 0, [255, 255, 255, 255]), 9, 9, [5, 5, 5, 255])

    const diff = diffImages(before, after)

    expect(diff).toMatchObject({ kind: 'pixel', diffPixels: 1, anyChannelPixels: 2 })
    if (diff.kind !== 'pixel') throw new Error('expected a pixel diff')
    expect(pixelAt(diff.image, 0, 0)).toEqual([255, 0, 0, 255])
    expect(pixelAt(diff.image, 9, 9)).toEqual(pixelAt(diff.image, 1, 1))
  })

  it('records both sizes instead of diffing a pair that changed size', () => {
    const diff = diffImages(solidImage(W, H, BLACK), solidImage(W, 24, BLACK))

    expect(diff).toEqual({
      kind: 'aligned',
      size: { before: { w: W, h: H }, after: { w: W, h: 24 } },
    })
  })
})
