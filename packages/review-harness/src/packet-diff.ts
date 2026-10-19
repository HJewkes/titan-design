// Pixel diff of a baseline pair for CI packets. A pair that changed size gets no pixel diff, only
// its two sizes, so the montage can align the images instead of pixelmatch throwing.
import pixelmatch from 'pixelmatch'
import type { Rgba } from './packet-png.ts'

/** The same tolerance as `packages/ui/playwright.config.ts`, so the counts read alike. */
export const DIFF_THRESHOLD = 0.02

export interface Size {
  w: number
  h: number
}

export type ImageDiff =
  | { kind: 'pixel'; image: Rgba; diffPixels: number; anyChannelPixels: number }
  | { kind: 'aligned'; size: { before: Size; after: Size } }

export function diffImages(before: Rgba, after: Rgba): ImageDiff {
  const { width, height } = after
  if (before.width !== width || before.height !== height)
    return {
      kind: 'aligned',
      size: { before: { w: before.width, h: before.height }, after: { w: width, h: height } },
    }
  const image: Rgba = { width, height, data: Buffer.alloc(width * height * 4) }
  const diffPixels = pixelmatch(before.data, after.data, image.data, width, height, {
    threshold: DIFF_THRESHOLD,
  })
  return { kind: 'pixel', image, diffPixels, anyChannelPixels: channelDiffs(before, after) }
}

/** Pixels where any RGBA channel differs at all: the exact count, with no tolerance. */
function channelDiffs(before: Rgba, after: Rgba): number {
  let count = 0
  for (let i = 0; i < before.data.length; i += 4)
    if (before.data.readUInt32BE(i) !== after.data.readUInt32BE(i)) count++
  return count
}
