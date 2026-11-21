import { describe, expect, it } from 'vitest'
import { contrast, relativeLuminance } from '../../theme/color-checks'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { LIFT_RIM_ALPHA } from '../../theme/lift-shadow'
import { surfaceBackground } from '../../theme/surface-planes'
import { CANDIDATE_KEYS, LIGHT_CANDIDATES, candidateShadow } from './lightCandidates'

const PROPOSED = CANDIDATE_KEYS.filter((key) => key !== 'shipped').map(
  (key) => LIGHT_CANDIDATES[key]
)
const LADDER = ['frame', 'background', 'base', 'elevated', 'raised', 'overlay'] as const
const TEXT_TOKENS = [
  'text-primary',
  'text-secondary',
  'text-tertiary',
  'text-error',
  'text-brand',
  'text-brand-secondary',
  'text-success',
  'text-warning',
  'text-info',
  'text-link',
] as const
// Adjacent content planes must be told apart by tone alone, not only by shadow.
const MIN_ADJACENT_RATIO = 1.05

describe('TD-4 light candidates', () => {
  it.each(PROPOSED)('$name climbs strictly from frame to overlay', (candidate) => {
    const luminances = LADDER.map((level) => relativeLuminance(candidate.planes[level]))

    luminances.slice(1).forEach((value, i) => expect(value).toBeGreaterThan(luminances[i]))
  })

  it.each(PROPOSED)('$name separates each content plane from the one below', (candidate) => {
    const content = LADDER.slice(2).map((level) => candidate.planes[level])

    content.slice(1).forEach((hex, i) => {
      expect(contrast(hex, content[i])).toBeGreaterThanOrEqual(MIN_ADJACENT_RATIO)
    })
  })

  it.each(PROPOSED)('$name keeps every light text token at AA on every plane', (candidate) => {
    const text = getSemanticColors('light')

    for (const level of LADDER)
      for (const token of TEXT_TOKENS)
        expect(
          contrast(text[token], candidate.planes[level]),
          `${token} on ${level}`
        ).toBeGreaterThanOrEqual(4.5)
  })

  it('leaves the shipped light values alone until the owner picks', () => {
    expect(LIGHT_CANDIDATES.shipped.planes.raised).toBe(surfaceBackground('raised', 'light'))
    expect(LIGHT_CANDIDATES.shipped.rim).toBe(LIFT_RIM_ALPHA.light)
  })

  it('draws the rim and ring only for a candidate that has them', () => {
    const crisp = candidateShadow(2, LIGHT_CANDIDATES.C)
    const tone = candidateShadow(2, LIGHT_CANDIDATES.A)

    expect(crisp).toMatch(/^inset 0 1px 0 rgba\(255,255,255,0\.90\), 0 0 0 1px rgba\(0,0,0,0\.08\)/)
    expect(tone).not.toContain('inset')
    expect(tone).not.toContain('0 0 0 1px')
  })
})
