import { describe, expect, it } from 'vitest'
import { pointAtLength, type PathPoint } from '../paths'
import {
  ANNOTATION_DEFAULTS,
  annotationStrokes,
  strokeProgress,
  type AnnotationKind,
} from './annotation-geometry'

const KINDS = Object.keys(ANNOTATION_DEFAULTS) as AnnotationKind[]
const box = { x: 0, y: 0, w: 120, h: 30 }

function options(kind: AnnotationKind, overrides: { roughness?: number; seed?: number } = {}) {
  return { seed: 1, roughness: 1, strokeWidth: 2, ...ANNOTATION_DEFAULTS[kind], ...overrides }
}

interface StrokeEnds {
  start: PathPoint
  end: PathPoint
}

/** Where each clean (roughness 0) stroke of `kind` starts and ends. */
function ends(kind: AnnotationKind): StrokeEnds[] {
  return annotationStrokes(kind, box, options(kind, { roughness: 0 })).map(({ model }) => ({
    start: pointAtLength(model, 0),
    end: pointAtLength(model, model.length),
  }))
}

function nth(strokes: readonly StrokeEnds[], i: number): StrokeEnds {
  const stroke = strokes[i]
  if (!stroke) throw new Error(`no stroke ${String(i)}`)
  return stroke
}

describe('annotationStrokes', () => {
  // Mutation caught: any unseeded randomness in a kind's geometry.
  it.each(KINDS)('draws %s identically for equal arguments', (kind) => {
    const first = annotationStrokes(kind, box, options(kind)).map((s) => s.model.d)
    expect(annotationStrokes(kind, box, options(kind)).map((s) => s.model.d)).toEqual(first)
  })

  // Mutation caught: a kind that ignores the seed it is given.
  it.each(KINDS)('draws %s differently under another seed', (kind) => {
    const first = annotationStrokes(kind, box, options(kind)).map((s) => s.model.d)
    const other = annotationStrokes(kind, box, options(kind, { seed: 2 })).map((s) => s.model.d)
    expect(other).not.toEqual(first)
  })

  // Mutation caught: dropping the per-kind pass count (one pass for every kind).
  it('draws one stroke per pass, four per pass for a box, two lines per pass for a cross', () => {
    const count = (kind: AnnotationKind) => annotationStrokes(kind, box, options(kind)).length
    expect(count('underline')).toBe(2)
    expect(count('box')).toBe(8)
    expect(count('circle')).toBe(2)
    expect(count('crossed-off')).toBe(2)
  })

  // Mutation caught: an underline drawn at the box top or without its clearance.
  it('puts the underline the padding below the box, across its width', () => {
    const { start, end } = nth(ends('underline'), 0)
    expect(start.y).toBeCloseTo(box.h + ANNOTATION_DEFAULTS.underline.padding, 6)
    expect([start.x, end.x]).toEqual([0, box.w])
  })

  // Mutation caught: a second pass that repeats the first direction instead of coming back.
  it('runs each repeat pass back over the last', () => {
    const strokes = ends('underline')
    expect(nth(strokes, 1).start.x).toBeCloseTo(nth(strokes, 0).end.x, 6)
  })

  // Mutation caught: a strike-through at the baseline instead of mid-height.
  it('strikes through at mid-height', () => {
    expect(nth(ends('strike-through'), 0).start.y).toBeCloseTo(box.h / 2, 6)
  })

  // Mutation caught: a highlight stroke as thin as a pen line.
  it('makes a highlight as thick as the padded box is tall', () => {
    const [stroke] = annotationStrokes('highlight', box, options('highlight'))
    expect(stroke?.width).toBe(box.h + 2 * ANNOTATION_DEFAULTS.highlight.padding)
  })

  // Mutation caught: crossing only one diagonal, or both the same way.
  it('crosses off corner to corner both ways', () => {
    const p = ANNOTATION_DEFAULTS['crossed-off'].padding
    const strokes = ends('crossed-off')
    expect(nth(strokes, 0).start).toEqual({ x: -p, y: -p })
    expect(nth(strokes, 1).start).toEqual({ x: box.w + p, y: -p })
  })

  // Mutation caught: a box whose sides do not join corner to corner.
  it('draws a box as four sides joined at the padded corners', () => {
    const p = ANNOTATION_DEFAULTS.box.padding
    const sides = ends('box')
    for (let i = 0; i < 4; i++) {
      const next = nth(sides, (i + 1) % 4).start
      expect(nth(sides, i).end.x).toBeCloseTo(next.x, 6)
      expect(nth(sides, i).end.y).toBeCloseTo(next.y, 6)
    }
    expect(nth(sides, 0).start).toEqual({ x: -p, y: -p })
  })
})

describe('strokeProgress', () => {
  // Mutation caught: splitting time by stroke count instead of by length (rough-notation's split).
  it('gives each stroke a share of time equal to its share of length', () => {
    expect(strokeProgress([100, 300], 0.25)).toEqual([1, 0])
    expect(strokeProgress([100, 300], 0.625)).toEqual([1, 0.5])
  })

  // Mutation caught: no clamp on each share, so a progress past 1 overdraws and below 0 draws backwards.
  it('clamps progress to 0..1', () => {
    expect(strokeProgress([10, 10], -1)).toEqual([0, 0])
    expect(strokeProgress([10, 10], 2)).toEqual([1, 1])
  })

  // Mutation caught: dropping the exact finish, which leaves the last stroke 1e-14 short at progress 1.
  it('finishes every stroke exactly at progress 1', () => {
    expect(strokeProgress([0.1, 0.2, 0.3], 1)).toEqual([1, 1, 1])
  })
})
