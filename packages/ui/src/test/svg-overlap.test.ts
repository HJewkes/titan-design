import { describe, expect, it } from 'vitest'
import { checkMarkOutline } from '../components/icons/checkMarkGeometry'
import {
  SAME_SHAPE_MIN_IOU,
  compareSvgPaths,
  flattenPath,
  rasterize,
  type Point,
} from './svg-overlap'

const filled = (d: string, size: number) =>
  rasterize(d, size).bits.reduce((sum, bit) => sum + bit, 0)

/** One node of the check mark moved `distance` units outward, square to the chord of its neighbours. */
function nudged(polygon: readonly Point[], index: number, distance: number): Point[] {
  const [prev, next] = [polygon[index - 1], polygon[index + 1]]
  const length = Math.hypot(next[0] - prev[0], next[1] - prev[1])
  const [nx, ny] = [-(next[1] - prev[1]) / length, (next[0] - prev[0]) / length]
  return polygon.map((q, k) => (k === index ? [q[0] + nx * distance, q[1] + ny * distance] : q))
}

describe('compareSvgPaths', () => {
  it('scores identical paths 1 with no pixels on either side', () => {
    const mark = [checkMarkOutline(3)]
    expect(compareSvgPaths(mark, mark)).toEqual({
      iou: 1,
      both: expect.any(Number) as number,
      onlyA: 0,
      onlyB: 0,
    })
  })

  it('measures two half-overlapping squares exactly', () => {
    const overlap = compareSvgPaths('M0 0 H12 V12 H0 Z', 'M6 0 H18 V12 H6 Z')
    expect(overlap.iou).toBe(1 / 3)
    expect(overlap.onlyA).toBe(overlap.onlyB)
  })

  it('reads relative commands as their absolute equivalents', () => {
    expect(compareSvgPaths('M2 2 L20 2 L20 20 Z', 'M2 2 l18 0 v18 z').iou).toBe(1)
  })

  it('fills a cubic circle to its area', () => {
    const k = 0.5523 * 8
    const circle =
      `M12 4 C${String(12 + k)} 4 20 ${String(12 - k)} 20 12 C20 ${String(12 + k)} ` +
      `${String(12 + k)} 20 12 20 C${String(12 - k)} 20 4 ${String(12 + k)} 4 12 ` +
      `C4 ${String(12 - k)} ${String(12 - k)} 4 12 4 Z`
    const pxPerUnit = 2048 / 24
    expect(filled(circle, 2048) / (Math.PI * 64 * pxPerUnit ** 2)).toBeCloseTo(1, 3)
  })

  it('keeps the inside of a polygon that winds around twice', () => {
    expect(flattenPath('M0 0 L4 0 L4 4 Z M0 0 L4 0 L4 4 Z')).toHaveLength(2)
    expect(filled('M2 2 H22 V22 H2 Z M6 6 H18 V18 H6 Z', 240)).toBe(200 * 200)
  })

  it('passes the check mark moved by half a hundredth, the rounding of its points', () => {
    const mark = checkMarkOutline(3)
    const rounded = mark.map(([x, y]): Point => [x + 0.005, y - 0.005])
    expect(compareSvgPaths([mark], [rounded]).iou).toBeGreaterThanOrEqual(SAME_SHAPE_MIN_IOU)
  })

  it('fails the check mark with one apex node pushed a unit out', () => {
    const mark = checkMarkOutline(3)
    const apex = mark.reduce((best, q, k) => (q[1] > mark[best][1] ? k : best), 0)
    const overlap = compareSvgPaths([mark], [nudged(mark, apex, 1)])
    expect(overlap.iou).toBeLessThan(SAME_SHAPE_MIN_IOU)
    expect(overlap).toMatchObject({ onlyA: 0, onlyB: expect.any(Number) as number })
    expect(overlap.onlyB).toBeGreaterThan(0)
  })
})
