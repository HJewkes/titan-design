import zlib from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PNG_LIMITS, readPng, solidImage, writePng } from '../src/packet-png.ts'
import { ReviewError } from '../src/review.ts'

/** A valid 4x4 PNG whose IHDR is rewritten to claim `width` x `height`, with a fresh CRC. */
function pngClaiming(width: number, height: number): Buffer {
  const png = Buffer.from(writePng(solidImage(4, 4, [10, 20, 30, 255])))
  png.writeUInt32BE(width, 16)
  png.writeUInt32BE(height, 20)
  png.writeUInt32BE(zlib.crc32(png.subarray(12, 29)), 29)
  return png
}

/** pngjs's sync parser inflates through `zlib.Inflate`, which Node's types do not declare. */
const zlibInflater = zlib as unknown as { Inflate: (...args: unknown[]) => unknown }

afterEach(() => vi.restoreAllMocks())

describe('readPng', () => {
  it('round-trips the pixels writePng encodes', () => {
    const image = solidImage(3, 2, [1, 2, 3, 4])

    const decoded = readPng(writePng(image))

    expect(decoded).toMatchObject({ width: 3, height: 2 })
    expect(decoded.data.equals(image.data)).toBe(true)
  })

  it('refuses a huge declared size before anything inflates', () => {
    const inflated = () => {
      throw new Error('inflated')
    }
    const inflate = vi.spyOn(zlibInflater, 'Inflate').mockImplementation(inflated)
    const inflateSync = vi.spyOn(zlib, 'inflateSync').mockImplementation(inflated)

    expect(() => readPng(pngClaiming(100_000, 100_000))).toThrow(/100000x100000/)
    expect(inflate).not.toHaveBeenCalled()
    expect(inflateSync).not.toHaveBeenCalled()
  })

  it('reaches the inflater for an in-bounds size, so the spy can see it', () => {
    const inflate = vi.spyOn(zlibInflater, 'Inflate')

    // The IDAT holds 4x4 rows, short for 8x8: Node 24 throws on it and Node 22 does not, and only
    // reaching the inflater matters here.
    try {
      readPng(pngClaiming(8, 8))
    } catch {
      /* either outcome is fine */
    }
    expect(inflate).toHaveBeenCalled()
  })

  it('refuses a buffer over the byte cap', () => {
    const limits = { ...PNG_LIMITS, maxBytes: 10 }

    expect(() => readPng(writePng(solidImage(1, 1, [0, 0, 0, 255])), limits)).toThrow(ReviewError)
  })

  it('refuses bytes that are not a PNG', () => {
    expect(() => readPng(Buffer.from('not a png, just some text'))).toThrow(/not a PNG/)
  })
})
