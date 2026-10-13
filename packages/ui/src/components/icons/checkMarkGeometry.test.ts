import { describe, expect, it } from 'vitest'
import {
  SAME_SHAPE_MIN_IOU,
  compareSvgPaths,
  flattenPath,
  selfCrossings,
} from '../../test/svg-overlap'
import {
  CHECK_MARK_APEX,
  CHECK_MARK_MASK_WIDTH,
  CHECK_MARK_SPINE,
  checkMarkOutline,
  checkMarkPath,
  type CheckMarkPoint,
} from './checkMarkGeometry'

/** Round 4's candidate B (Brush taper with a vertical start cut), as the owner approved it. */
const APPROVED_WEIGHT_3 =
  'M5.37 15.97 L5.60 16.23 L6.19 16.90 L6.79 17.56 L7.38 18.23 L9.06 19.44 L11.19 17.98 L11.44 ' +
  '17.48 L11.71 16.97 L11.99 16.45 L12.28 15.93 L12.59 15.39 L12.91 14.85 L13.25 14.29 L13.60 13.74 ' +
  'L13.97 13.17 L14.36 12.60 L14.76 12.02 L15.19 11.43 L15.62 10.84 L16.08 10.24 L16.55 9.64 L17.04 ' +
  '9.02 L17.55 8.41 L18.07 7.78 L18.61 7.15 L19.17 6.52 L19.75 5.88 L20.34 5.23 L20.96 4.58 L20.64 ' +
  '4.22 L19.91 4.73 L19.18 5.24 L18.48 5.76 L17.79 6.27 L17.12 6.78 L16.46 7.29 L15.83 7.81 L15.20 ' +
  '8.32 L14.60 8.83 L14.01 9.35 L13.44 9.86 L12.89 10.38 L12.35 10.90 L11.83 11.42 L11.33 11.94 ' +
  'L10.84 12.46 L10.38 12.98 L9.93 13.51 L9.50 14.04 L9.09 14.57 L8.70 15.10 L8.33 15.64 L7.98 ' +
  '16.18 L9.54 15.76 L9.97 15.69 L9.31 15.09 L8.66 14.48 L8.00 13.87 L7.34 13.27 L6.69 12.66 L6.03 ' +
  '12.06 L5.37 11.45 Z'

const APPROVED_WEIGHT_2 =
  'M5.01 14.76 L5.40 15.18 L6.00 15.83 L6.60 16.49 L7.21 17.15 L7.81 17.81 L9.14 18.83 L10.65 17.68 ' +
  'L10.92 17.18 L11.21 16.66 L11.50 16.14 L11.81 15.61 L12.14 15.08 L12.49 14.54 L12.85 13.99 ' +
  'L13.22 13.44 L13.62 12.88 L14.02 12.31 L14.45 11.75 L14.89 11.17 L15.36 10.59 L15.83 10.01 ' +
  'L16.33 9.42 L16.84 8.82 L17.37 8.22 L17.91 7.62 L18.48 7.01 L19.06 6.39 L19.66 5.77 L20.27 5.15 ' +
  'L20.90 4.52 L20.70 4.28 L19.98 4.81 L19.28 5.35 L18.60 5.88 L17.93 6.42 L17.28 6.95 L16.64 7.48 ' +
  'L16.03 8.01 L15.43 8.54 L14.85 9.07 L14.28 9.60 L13.73 10.13 L13.20 10.65 L12.68 11.18 L12.19 ' +
  '11.71 L11.71 12.24 L11.24 12.77 L10.80 13.29 L10.37 13.82 L9.96 14.35 L9.57 14.88 L9.20 15.41 ' +
  'L8.85 15.95 L8.51 16.48 L9.46 16.37 L9.54 16.12 L8.89 15.50 L8.25 14.88 L7.60 14.27 L6.95 13.65 ' +
  'L6.31 13.03 L5.66 12.42 L5.01 11.80 Z'

function pointsOf(path: string): CheckMarkPoint[] {
  return (path.match(/[ML][^MLZ]*/g) ?? []).map((command) => {
    const [x, y] = command.slice(1).trim().split(' ').map(Number)
    return [x, y]
  })
}

/** The spine's line and quadratic, sampled finely enough to stand in for the curve. */
function spineSamples(): CheckMarkPoint[] {
  const n = (CHECK_MARK_SPINE.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
  const [start, apex, bend, end]: CheckMarkPoint[] = [0, 2, 4, 6].map((i) => [n[i], n[i + 1]])
  const samples: CheckMarkPoint[] = []
  for (let i = 0; i <= 200; i++) {
    const t = i / 200
    samples.push([start[0] + (apex[0] - start[0]) * t, start[1] + (apex[1] - start[1]) * t])
  }
  for (let i = 1; i <= 400; i++) {
    const t = i / 400
    const u = 1 - t
    samples.push([
      u * u * apex[0] + 2 * u * t * bend[0] + t * t * end[0],
      u * u * apex[1] + 2 * u * t * bend[1] + t * t * end[1],
    ])
  }
  return samples
}

/** Same pixels at 2048 px, give or take the rounding of the one point that replaces the loop. */
const SAME_PIXELS_MIN_IOU = 0.9999

describe('checkMarkOutline', () => {
  it.each([
    [3, APPROVED_WEIGHT_3],
    [2, APPROVED_WEIGHT_2],
  ])("at weight %i fills the approved outline's pixels", (weight, approved) => {
    expect(compareSvgPaths([checkMarkOutline(weight)], approved).iou).toBeGreaterThanOrEqual(
      SAME_PIXELS_MIN_IOU
    )
  })

  it.each([
    [3, APPROVED_WEIGHT_3],
    [2, APPROVED_WEIGHT_2],
  ])('at weight %i drops the loop the approved outline wound at the apex', (weight, approved) => {
    const [loop] = selfCrossings(pointsOf(approved))
    expect(
      Math.hypot(loop.at[0] - CHECK_MARK_APEX[0], loop.at[1] - CHECK_MARK_APEX[1])
    ).toBeLessThan(3)
    expect(selfCrossings(checkMarkOutline(weight))).toEqual([])
  })

  it.each([1, 4])('at weight %i crosses itself nowhere', (weight) => {
    expect(selfCrossings(checkMarkOutline(weight))).toEqual([])
  })

  it('starts with a vertical cut and has no round cap', () => {
    const outline = checkMarkOutline(3)
    const [cutBottom, last] = [outline[0], outline[outline.length - 1]]
    expect(cutBottom[0]).toBe(last[0])
    expect(cutBottom[1]).toBeGreaterThan(last[1])
  })

  it('thickens with the weight around the same skeleton', () => {
    const thin = checkMarkOutline(2)
    const thick = checkMarkOutline(3)
    const span = (o: CheckMarkPoint[]) =>
      Math.max(...o.map((q) => q[1])) - Math.min(...o.map((q) => q[1]))
    expect(span(thick)).toBeGreaterThan(span(thin))
  })

  it.each([1, 2, 3, 4])(
    'at weight %i lies inside the draw-on mask, clear of its butt caps',
    (weight) => {
      const spine = spineSamples()
      const reach = (weight * CHECK_MARK_MASK_WIDTH) / 2
      for (const q of checkMarkOutline(weight)) {
        const distances = spine.map((s) => Math.hypot(s[0] - q[0], s[1] - q[1]))
        const nearest = distances.indexOf(Math.min(...distances))
        expect(distances[nearest]).toBeLessThan(reach)
        expect(nearest).toBeGreaterThan(0)
        expect(nearest).toBeLessThan(spine.length - 1)
      }
    }
  )
})

describe('checkMarkPath', () => {
  it.each([
    [3, APPROVED_WEIGHT_3],
    [2, APPROVED_WEIGHT_2],
  ])('at weight %i is the same shape as the approved outline', (weight, approved) => {
    expect(compareSvgPaths(checkMarkPath(weight), approved).iou).toBeGreaterThanOrEqual(
      SAME_SHAPE_MIN_IOU
    )
  })

  it.each([1, 1.5, 2.5, 4])('at weight %i is the same shape as the sampled outline', (weight) => {
    expect(
      compareSvgPaths(checkMarkPath(weight), [checkMarkOutline(weight)]).iou
    ).toBeGreaterThanOrEqual(SAME_SHAPE_MIN_IOU)
  })

  it('is a fifth of the size of the approved outline, in two cubics', () => {
    const path = checkMarkPath(3)
    expect(path.match(/C/g)).toHaveLength(2)
    expect(path.length * 5).toBeLessThan(APPROVED_WEIGHT_3.length)
  })

  it.each([1, 2, 3, 4])('at weight %i crosses itself nowhere', (weight) => {
    expect(selfCrossings(flattenPath(checkMarkPath(weight))[0])).toEqual([])
  })
})
