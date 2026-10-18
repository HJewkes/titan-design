// PNG decode and encode for CI packets. Artifacts can come from fork PRs, so `readPng` treats every
// buffer as untrusted: it caps the byte count and checks the IHDR dimensions before anything inflates.
import { PNG } from 'pngjs'
import { ReviewError } from './review.ts'

/** A decoded image: `data` is `width * height` RGBA pixels, row-major. */
export interface Rgba {
  width: number
  height: number
  data: Buffer
}

export interface PngLimits {
  maxWidth: number
  maxHeight: number
  maxBytes: number
}

export const PNG_LIMITS: PngLimits = {
  maxWidth: 8192,
  maxHeight: 16384,
  maxBytes: 64 * 1024 * 1024,
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
/** Signature, IHDR length and type, then width and height: the bytes the guard reads. */
const HEADER_BYTES = 24

/** Width and height as the IHDR chunk declares them, read without inflating anything. */
export function declaredSize(buf: Buffer): { width: number; height: number } {
  const isPng =
    buf.length >= HEADER_BYTES &&
    buf.subarray(0, 8).equals(SIGNATURE) &&
    buf.toString('latin1', 12, 16) === 'IHDR'
  if (!isPng) throw new ReviewError('not a PNG: the signature or IHDR chunk is missing')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

export function readPng(buf: Buffer, limits: PngLimits = PNG_LIMITS): Rgba {
  if (buf.length > limits.maxBytes)
    throw new ReviewError(`PNG of ${buf.length} bytes exceeds the ${limits.maxBytes}-byte cap`)
  const { width, height } = declaredSize(buf)
  const fits = width >= 1 && height >= 1 && width <= limits.maxWidth && height <= limits.maxHeight
  if (!fits)
    throw new ReviewError(
      `PNG declares ${width}x${height}, outside 1x1 to ${limits.maxWidth}x${limits.maxHeight}`
    )
  const png = PNG.sync.read(buf)
  return { width: png.width, height: png.height, data: png.data }
}

export function writePng(image: Rgba): Buffer {
  const png = new PNG({ width: image.width, height: image.height })
  image.data.copy(png.data)
  return PNG.sync.write(png)
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Paints `rect`, clipped to the image, with `rgba`. */
export function fillRect(image: Rgba, rect: Rect, rgba: readonly number[]): void {
  const right = Math.min(rect.x + rect.w, image.width)
  const bottom = Math.min(rect.y + rect.h, image.height)
  for (let y = Math.max(0, rect.y); y < bottom; y++)
    for (let x = Math.max(0, rect.x); x < right; x++)
      image.data.set(rgba, (y * image.width + x) * 4)
}

/** A blank image of the given size, every pixel `rgba`. */
export function solidImage(width: number, height: number, rgba: readonly number[]): Rgba {
  const data = Buffer.alloc(width * height * 4)
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i)
  return { width, height, data }
}
