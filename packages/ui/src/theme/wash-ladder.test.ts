import { describe, expect, it } from 'vitest'
import { semanticColorsDark, semanticColorsLight } from './tokens/semantic'

/**
 * Status and brand roles publish three wash rungs. They exist so a component can
 * express a weight ramp without hand-mixing alpha: MesoProgressBar's segment
 * track collapsed to one weight in three hues when only `-subtle` was available.
 *
 * A rung that drifts out of order silently flattens every consumer, and the
 * consumer's own test cannot catch it — under the RNW vitest alias the rendered
 * value is a `var(...)` reference, not an rgba triplet.
 */
const WASH_ROLES = [
  'brand-primary',
  'brand-secondary',
  'status-success',
  'status-error',
  'status-error-vivid',
  'status-warning',
  'status-info',
] as const

const RUNGS = ['subtle', 'muted', 'strong'] as const

function alphaOf(value: string): number {
  const parts = value.match(/rgba?\(([^)]+)\)/)?.[1].split(',')
  if (!parts) return 1 // a solid ramp pin is fully opaque
  return parts.length === 4 ? Number(parts[3].trim()) : 1
}

describe('wash ladder', () => {
  for (const [mode, palette] of [
    ['dark', semanticColorsDark],
    ['light', semanticColorsLight],
  ] as const) {
    describe(mode, () => {
      for (const role of WASH_ROLES) {
        it(`${role} publishes all three rungs`, () => {
          for (const rung of RUNGS) {
            expect(palette, `${role}-${rung} is missing`).toHaveProperty(`${role}-${rung}`)
          }
        })
      }
    })
  }

  // Light mode's `-subtle` is still a solid ramp tint rather than a wash, so its
  // ladder is not comparable yet. AW-121 owns bringing light onto this model.
  for (const role of WASH_ROLES) {
    it(`${role} rungs ascend in weight (dark)`, () => {
      const [subtle, muted, strong] = RUNGS.map((r) =>
        alphaOf(semanticColorsDark[`${role}-${r}` as keyof typeof semanticColorsDark] as string)
      )
      expect(muted, `${role}-muted must outweigh -subtle`).toBeGreaterThan(subtle)
      expect(strong, `${role}-strong must outweigh -muted`).toBeGreaterThan(muted)
    })
  }
})
