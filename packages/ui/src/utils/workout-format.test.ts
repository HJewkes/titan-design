import { describe, it, expect } from 'vitest'
import {
  roundRpe,
  rpeColor,
  roundWeight,
  formatVelocity,
  roundTempo,
  formatSignedPct,
  formatPrescription,
} from './workout-format'
import { WORKOUT_TOKENS } from '../theme/workout-tokens'

describe('roundRpe', () => {
  it('rounds an exact RPE to the nearest 0.5', () => {
    expect(roundRpe(8.3)).toBe(8.5)
    expect(roundRpe(8.24)).toBe(8)
    expect(roundRpe(9)).toBe(9)
    expect(roundRpe(7.75)).toBe(8)
  })
})

describe('rpeColor', () => {
  it('bands onto the canonical scale, red for hardest', () => {
    expect(rpeColor(9.5)).toBe(WORKOUT_TOKENS.scale.red)
    expect(rpeColor(8.5)).toBe(WORKOUT_TOKENS.scale.orange)
    expect(rpeColor(7)).toBe(WORKOUT_TOKENS.scale.yellow)
    expect(rpeColor(6.9)).toBe(WORKOUT_TOKENS.scale.green)
  })
})

describe('roundWeight', () => {
  it('rounds to a whole unit', () => {
    expect(roundWeight(62.4)).toBe(62)
    expect(roundWeight(62.5)).toBe(63)
    expect(roundWeight(60)).toBe(60)
  })
})

describe('formatVelocity', () => {
  it('formats m/s to 2 decimal places', () => {
    expect(formatVelocity(0.6)).toBe('0.60')
    expect(formatVelocity(1.234)).toBe('1.23')
  })
})

describe('roundTempo', () => {
  it('rounds each phase to 1 dp', () => {
    expect(roundTempo([2.34, 0, 1.06, 0.5])).toEqual([2.3, 0, 1.1, 0.5])
  })
})

describe('formatSignedPct', () => {
  it('renders a signed percentage from a ratio', () => {
    expect(formatSignedPct(0.09)).toBe('+9%')
    expect(formatSignedPct(-0.05)).toBe('-5%')
    expect(formatSignedPct(0)).toBe('0%')
  })
})

describe('formatPrescription', () => {
  it('builds a full prescription string', () => {
    expect(formatPrescription({ repsLow: 8, repsHigh: 10, weightLbs: 62, rpe: 8 })).toBe(
      '8–10 @ 62 lb · RPE 8'
    )
  })

  it('collapses an equal rep range to a single number', () => {
    expect(formatPrescription({ repsLow: 5, repsHigh: 5, weightLbs: 100 })).toBe('5 @ 100 lb')
  })

  it('omits missing parts', () => {
    expect(formatPrescription({ rpe: 7 })).toBe('RPE 7')
    expect(formatPrescription({ weightLbs: 50 })).toBe('50 lb')
  })

  it('returns null when there is nothing to show', () => {
    expect(formatPrescription(null)).toBeNull()
    expect(formatPrescription(undefined)).toBeNull()
    expect(formatPrescription({})).toBeNull()
  })
})
