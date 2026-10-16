import { describe, expect, it } from 'vitest'
import {
  BODY_PARTS_BY_VIEW,
  anatomicalSides,
  sidePathsFor,
  type BodyView,
  type SidePaths,
} from './sideSplitPaths'
import { MuscleGroup } from './muscleTaxonomy'

// Midline x of each view's viewBox: front `0 0 724 1448`, back `724 0 724 1448`.
const MIDLINE: Record<BodyView, number> = { front: 362, back: 1086 }
const VIEWS: BodyView[] = ['front', 'back']
const UNSIDED_SLUGS = ['head', 'hair']

const startX = (path: string) => Number(/^M\s*(-?[\d.]+)/.exec(path)?.[1])

/** Where the lifter's left side lands on screen for a given view. */
function screenSideOfLifterLeft(paths: SidePaths, view: BodyView) {
  const leftX = paths.left.map(startX)
  const rightX = paths.right.map(startX)
  const midline = MIDLINE[view]
  if (leftX.every((x) => x > midline) && rightX.every((x) => x < midline)) return 'screen-right'
  if (leftX.every((x) => x < midline) && rightX.every((x) => x > midline)) return 'screen-left'
  return 'mixed'
}

describe('sidePathsFor', () => {
  it("paints the lifter's left biceps on the screen-right half of the front figure", () => {
    const biceps = sidePathsFor(MuscleGroup.BICEPS, 'front')

    expect(biceps.left.length).toBeGreaterThan(0)
    expect(screenSideOfLifterLeft(biceps, 'front')).toBe('screen-right')
  })

  it("paints the lifter's left hamstring on the screen-left half of the back figure", () => {
    const hamstrings = sidePathsFor(MuscleGroup.HAMSTRINGS, 'back')

    expect(hamstrings.left.length).toBeGreaterThan(0)
    expect(screenSideOfLifterLeft(hamstrings, 'back')).toBe('screen-left')
  })

  it.each(Object.values(MuscleGroup))(
    '%s mirrors on the front view and keeps screen sides on the back',
    (muscle) => {
      const expected: Record<BodyView, string> = { front: 'screen-right', back: 'screen-left' }

      for (const view of VIEWS) {
        const paths = sidePathsFor(muscle, view)
        if (paths.left.length + paths.right.length === 0) continue
        expect(screenSideOfLifterLeft(paths, view)).toBe(expected[view])
      }
    }
  )

  it.each(Object.values(MuscleGroup))('%s has paths for both sides on some view', (muscle) => {
    const drawn = VIEWS.map((view) => sidePathsFor(muscle, view)).filter(
      (paths) => paths.left.length + paths.right.length > 0
    )

    expect(drawn.length).toBeGreaterThan(0)
    for (const paths of drawn) {
      expect(paths.left.length).toBeGreaterThan(0)
      expect(paths.right.length).toBeGreaterThan(0)
    }
  })

  it('returns no paths for a muscle the view does not show', () => {
    expect(sidePathsFor(MuscleGroup.CHEST, 'back')).toEqual({ left: [], right: [] })
  })
})

describe('body-highlighter asset data', () => {
  it.each(VIEWS)('every limb slug on the %s view carries a left and a right array', (view) => {
    const sided = BODY_PARTS_BY_VIEW[view].filter(
      (part) => !UNSIDED_SLUGS.includes(part.slug ?? '')
    )
    const missing = sided
      .filter((part) => !part.path?.left?.length || !part.path?.right?.length)
      .map((part) => part.slug)

    expect(sided.length).toBeGreaterThan(10)
    expect(missing).toEqual([])
  })
})

describe('anatomicalSides', () => {
  const part = { slug: 'biceps' as const, path: { left: ['screen-left'], right: ['screen-right'] } }

  it('swaps the arrays on the front view', () => {
    expect(anatomicalSides(part, 'front')).toEqual({
      left: ['screen-right'],
      right: ['screen-left'],
    })
  })

  it('keeps the arrays on the back view', () => {
    expect(anatomicalSides(part, 'back')).toEqual({
      left: ['screen-left'],
      right: ['screen-right'],
    })
  })
})
