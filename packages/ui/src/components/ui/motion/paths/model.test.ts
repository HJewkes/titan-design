import { describe, expect, it } from 'vitest'
import { cutPath, drawOn, pathLength, pathModel, pointAtLength, tangentAtLength } from './model'

type Curve = (t: number) => readonly [number, number]

/** Length of `curve` by dense chords: an independent check on the quadrature. */
function sampledLength(curve: Curve, samples = 20_000): number {
  let total = 0
  let [px, py] = curve(0)
  for (let i = 1; i <= samples; i++) {
    const [x, y] = curve(i / samples)
    total += Math.hypot(x - px, y - py)
    ;[px, py] = [x, y]
  }
  return total
}

const cubic =
  (...p: number[]): Curve =>
  (t) => {
    const u = 1 - t
    const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    return [
      a * p[0]! + b * p[2]! + c * p[4]! + d * p[6]!,
      a * p[1]! + b * p[3]! + c * p[5]! + d * p[7]!,
    ]
  }

const QUARTER_ARC = 'M10 0 A10 10 0 0 1 0 10'
const QUARTER_CUBIC = 'M10 0 C10 5.5228 5.5228 10 0 10'
const WAVE = 'M0 0 C20 40 40 -40 60 0'

// d3-shape output, generated once and pinned: line().curve(curveMonotoneX) over five points, an annulus
// sector from arc() (outer 50, inner 30, 0 to 2 rad), and a full disc from arc().
const D3_MONOTONE =
  'M0,40C6.667,25,13.333,10,20,10C26.667,10,33.333,30,40,30C46.667,30,53.333,5,60,5C66.667,5,73.333,15,80,25'
const D3_SECTOR = 'M0,-50A50,50,0,0,1,45.465,20.807L27.279,12.484A30,30,0,0,0,0,-30Z'
const D3_DISC = 'M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z'

describe('pathLength', () => {
  it.each([
    ['M0 0 L3 4', 5],
    ['M0 0 H10 V10 H0 Z', 40],
    ['M10 10 l3 4', 5],
    ['M0 0 h10 v10 h-10 z', 40],
    ['', 0],
    ['M5 5', 0],
  ])('measures %j as %d', (d, expected) => {
    expect(pathLength(d)).toBeCloseTo(expected, 10)
  })

  it('measures a quarter-circle arc as its true length, and the cubic that approximates it within 1e-2', () => {
    expect(pathLength(QUARTER_ARC)).toBeCloseTo(5 * Math.PI, 3)
    expect(Math.abs(pathLength(QUARTER_CUBIC) - 5 * Math.PI)).toBeLessThan(1e-2)
  })

  it('measures a quadratic and a cubic as their dense-sampled length', () => {
    expect(pathLength('M0 0 Q5 10 10 0')).toBeCloseTo(
      sampledLength(cubic(0, 0, 10 / 3, 20 / 3, 20 / 3, 20 / 3, 10, 0)),
      4
    )
    expect(pathLength(WAVE)).toBeCloseTo(sampledLength(cubic(0, 0, 20, 40, 40, -40, 60, 0)), 4)
  })

  it('measures an arc with compact flags (a half circle of radius 5)', () => {
    expect(pathLength('M0 0A5 5 0 0110 0')).toBeCloseTo(5 * Math.PI, 3)
  })

  it.each([
    ['takes the large arc when the flag is set', 'M10 0 A10 10 0 1 1 0 10', 15 * Math.PI],
    [
      'takes the large arc counter-clockwise when sweep is 0',
      'M10 0 A10 10 0 1 0 0 10',
      15 * Math.PI,
    ],
    ['scales radii too small to reach the end point', 'M0 0 A1 1 0 0 1 10 0', 5 * Math.PI],
    ['draws a zero-radius arc as a line', 'M0 0 A0 5 0 0 1 3 4', 5],
    // Half an ellipse with semi-axes 20 and 10, by Ramanujan's perimeter; unrotated it would need scaling.
    [
      'rotates the ellipse axes',
      'M0 0 A20 10 90 0 1 0 40',
      (Math.PI * (90 - Math.sqrt(70 * 50))) / 2,
    ],
  ])('%s', (_, d, expected) => {
    expect(pathLength(d)).toBeCloseTo(expected, 1)
  })

  it('takes the arc on the side the sweep flag names', () => {
    const clockwise = pointAtLength('M10 0 A10 10 0 0 1 0 10', (5 * Math.PI) / 2)
    const counter = pointAtLength('M10 0 A10 10 0 0 0 0 10', (5 * Math.PI) / 2)
    expect(clockwise.x).toBeCloseTo(10 * Math.SQRT1_2, 3)
    expect(counter.x).toBeCloseTo(10 - 10 * Math.SQRT1_2, 3)
    expect(counter.y).toBeCloseTo(10 - 10 * Math.SQRT1_2, 3)
  })

  it('measures d3-shape output within 0.5 % of its geometric length', () => {
    const monotone = [
      cubic(0, 40, 6.667, 25, 13.333, 10, 20, 10),
      cubic(20, 10, 26.667, 10, 33.333, 30, 40, 30),
      cubic(40, 30, 46.667, 30, 53.333, 5, 60, 5),
      cubic(60, 5, 66.667, 5, 73.333, 15, 80, 25),
    ].reduce((sum, curve) => sum + sampledLength(curve), 0)
    const sector = 50 * 2 + 30 * 2 + 2 * 20
    expect(Math.abs(pathLength(D3_MONOTONE) / monotone - 1)).toBeLessThan(0.005)
    expect(Math.abs(pathLength(D3_SECTOR) / sector - 1)).toBeLessThan(0.005)
    expect(Math.abs(pathLength(D3_DISC) / (100 * Math.PI) - 1)).toBeLessThan(0.005)
  })
})

describe('pathModel', () => {
  it('reuses one model for one path string', () => {
    expect(pathModel(WAVE)).toBe(pathModel(WAVE))
  })

  it('is accepted wherever a path string is', () => {
    const model = pathModel('M0 0 L3 4')
    expect(pathLength(model)).toBe(5)
    expect(pointAtLength(model, 5)).toEqual({ x: 3, y: 4 })
  })
})

describe('pointAtLength', () => {
  const square = 'M0 0 L10 0 L10 10 L0 10'

  it.each([
    [0, { x: 0, y: 0 }],
    [10, { x: 10, y: 0 }],
    [10.5, { x: 10, y: 0.5 }],
    [25, { x: 5, y: 10 }],
    [30, { x: 0, y: 10 }],
    [-4, { x: 0, y: 0 }],
    [99, { x: 0, y: 10 }],
  ])('walks a polyline: at %d it is %j', (at, expected) => {
    const point = pointAtLength(square, at)
    expect(point.x).toBeCloseTo(expected.x, 10)
    expect(point.y).toBeCloseTo(expected.y, 10)
  })

  it('starts and ends on the end points of a curve and an arc', () => {
    for (const [d, start, end] of [
      [WAVE, { x: 0, y: 0 }, { x: 60, y: 0 }],
      [QUARTER_ARC, { x: 10, y: 0 }, { x: 0, y: 10 }],
    ] as const) {
      expect(pointAtLength(d, 0)).toEqual(start)
      const last = pointAtLength(d, pathLength(d))
      expect(last.x).toBeCloseTo(end.x, 9)
      expect(last.y).toBeCloseTo(end.y, 9)
    }
  })

  it('spaces points by arc length, not by curve parameter, on a cubic', () => {
    const total = pathLength(WAVE)
    const points = Array.from({ length: 11 }, (_, i) => pointAtLength(WAVE, (total * i) / 10))
    const chords = points.slice(1).map((p, i) => Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y))
    for (const chord of chords) expect(chord).toBeCloseTo(total / 10, 0)
  })

  it('places the arc midpoint on the circle at 45°', () => {
    const mid = pointAtLength(QUARTER_ARC, (5 * Math.PI) / 2)
    expect(mid.x).toBeCloseTo(10 * Math.SQRT1_2, 2)
    expect(mid.y).toBeCloseTo(10 * Math.SQRT1_2, 2)
  })

  it('gives the moveto point of a path with no length', () => {
    expect(pointAtLength('M5 6', 3)).toEqual({ x: 5, y: 6 })
    expect(pointAtLength('', 3)).toEqual({ x: 0, y: 0 })
  })
})

describe('tangentAtLength', () => {
  it('is the unit direction of a line', () => {
    const tangent = tangentAtLength('M0 0 L3 4', 2)
    expect(tangent.x).toBeCloseTo(0.6, 10)
    expect(tangent.y).toBeCloseTo(0.8, 10)
  })

  it('takes the incoming segment’s direction at a joint, as a cut there arrives', () => {
    expect(tangentAtLength('M0 0 L10 0 L10 10', 10)).toEqual({ x: 1, y: 0 })
    expect(tangentAtLength('M0 0 L10 0 L10 10', 10.001)).toEqual({ x: 0, y: 1 })
  })

  it('stays unit length and turns continuously along a cubic', () => {
    const total = pathLength(WAVE)
    const tangents = Array.from({ length: 201 }, (_, i) => tangentAtLength(WAVE, (total * i) / 200))
    tangents.forEach((t, i) => {
      expect(Math.hypot(t.x, t.y)).toBeCloseTo(1, 10)
      if (i > 0)
        expect(Math.hypot(t.x - tangents[i - 1]!.x, t.y - tangents[i - 1]!.y)).toBeLessThan(0.1)
    })
  })

  it('is tangent to the circle on an arc', () => {
    const tangent = tangentAtLength(QUARTER_ARC, 0)
    expect(tangent.x).toBeCloseTo(0, 3)
    expect(tangent.y).toBeCloseTo(1, 3)
  })

  it('reads the direction at a collapsed control point instead of returning zero', () => {
    const tangent = tangentAtLength('M0 0 S12 12 24 0', 0)
    expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 6)
    expect(tangent.x).toBeGreaterThan(0)
  })

  it('is zero on a path with no length', () => {
    expect(tangentAtLength('M5 6', 0)).toEqual({ x: 0, y: 0 })
  })
})

describe('cutPath', () => {
  it.each([
    ['line', 'M0 0 L30 40'],
    ['cubic', WAVE],
    ['arc', QUARTER_ARC],
    ['polyline across a joint', 'M0 0 L10 0 L10 10 L0 10'],
    ['d3 sector', D3_SECTOR],
  ])('keeps half the length of a %s', (_, d) => {
    const half = pathLength(d) / 2
    expect(pathLength(cutPath(d, half))).toBeCloseTo(half, 3)
  })

  it('ends the cut on the point at that length', () => {
    const cut = cutPath(WAVE, 20)
    const end = pointAtLength(WAVE, 20)
    const cutEnd = pointAtLength(cut, pathLength(cut))
    expect(cutEnd.x).toBeCloseTo(end.x, 4)
    expect(cutEnd.y).toBeCloseTo(end.y, 4)
  })

  it('keeps only the moveto at 0 and the whole path past its length', () => {
    expect(cutPath('M1 2 L3 4', 0)).toBe('M1 2')
    expect(cutPath('M0 0 L3 4 Z', 100)).toBe('M0 0L3 4Z')
  })

  it('cuts inside a closing Z with a line toward the subpath start', () => {
    expect(cutPath('M0 0 H10 V10 H0 Z', 35)).toBe('M0 0L10 0L10 10L0 10L0 5')
  })

  it('keeps later subpaths only up to the cut', () => {
    expect(cutPath('M0 0 L10 0 M0 5 L10 5', 15)).toBe('M0 0L10 0M0 5L5 5')
    expect(cutPath('M0 0 L10 0 M0 5 L10 5', 10)).toBe('M0 0L10 0')
  })
})

describe('drawOn', () => {
  it.each([
    [0.25, 75],
    [0, 100],
    [1, 0],
    [-1, 100],
    [2, 0],
  ])('at progress %d hides %d of a 100-long stroke', (progress, offset) => {
    expect(drawOn(100, progress)).toEqual({ strokeDasharray: 100, strokeDashoffset: offset })
  })
})
