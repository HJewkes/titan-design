import { describe, expect, it } from 'vitest'
import { greyRamp } from '../../theme/tokens/primitives'
import {
  OPEN_DECISIONS,
  TEXT_ROLES,
  colorLine,
  measureColor,
  rampStepOf,
  rolesFor,
} from './typography-roles'

describe('typography roles (TD-781 lab data)', () => {
  it('names a grey hex by its ramp step, never by hex', () => {
    expect(rampStepOf(greyRamp[400])).toBe('grey 400')
    expect(rampStepOf(greyRamp[400].toLowerCase())).toBe('grey 400')
  })

  it('names the light text-primary pin rather than a ramp step', () => {
    expect(measureColor('text-primary', 'light').step).toBe('pin textPrimaryLight')
  })

  it('measures each text token on surface-base in both themes', () => {
    expect(measureColor('text-secondary', 'dark').ratio).toBeGreaterThan(4.5)
    expect(measureColor('text-tertiary', 'dark').ratio).toBeLessThan(4.5)
    expect(colorLine('text-secondary')).toMatch(
      /^grey \d+ \d+\.\d\d \(dark\) · grey \d+ \d+\.\d\d \(light\)$/
    )
  })

  it('gives every open role a proposed rule and a decision the page can route to', () => {
    for (const role of TEXT_ROLES) {
      if (role.proposed) expect(role.decision, role.id).toBeDefined()
    }
    for (const decision of OPEN_DECISIONS) {
      expect(rolesFor(decision).length, decision).toBeGreaterThan(0)
    }
  })

  it('has unique role ids', () => {
    const ids = TEXT_ROLES.map((role) => role.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
