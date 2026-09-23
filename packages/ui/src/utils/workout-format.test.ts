import { describe, it, expect } from 'vitest'
import {
  formatBodyweight,
  formatSignedRate,
  roundRpe,
  rpeColor,
  roundWeight,
  formatVelocity,
  roundTempo,
  formatSignedPct,
  formatPrescription,
  formatExpectedRange,
  formatRpe,
  formatChartDate,
  formatWorkoutStats,
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

describe('formatExpectedRange', () => {
  it('formats a bounded range with the ~ prefix and expected suffix', () => {
    expect(formatExpectedRange(5, 15)).toBe('~5–15 expected')
  })

  it('collapses an equal range to a single number', () => {
    expect(formatExpectedRange(8, 8)).toBe('~8 expected')
  })

  it('returns null when neither bound is set', () => {
    expect(formatExpectedRange()).toBeNull()
    expect(formatExpectedRange(undefined, undefined)).toBeNull()
  })
})

describe('formatRpe', () => {
  it('rounds and formats to 1 decimal', () => {
    expect(formatRpe(7.4)).toBe('7.5')
    expect(formatRpe(9)).toBe('9.0')
    expect(formatRpe(10)).toBe('10.0')
  })

  it('em-dashes a null/undefined RPE', () => {
    expect(formatRpe(null)).toBe('—')
    expect(formatRpe(undefined)).toBe('—')
  })
})

describe('formatChartDate', () => {
  it('formats an ISO date as M/D', () => {
    expect(formatChartDate('2026-06-06')).toBe('6/6')
    expect(formatChartDate('2026-01-15')).toBe('1/15')
  })

  it('returns the original string for an unparseable date', () => {
    expect(formatChartDate('invalid')).toBe('invalid')
  })
})

describe('formatWorkoutStats', () => {
  it('joins sets, volume, and duration with a middle dot', () => {
    expect(formatWorkoutStats(18, 12450, 'lbs', '45 min')).toBe('18 sets · 12450 lbs · 45 min')
  })

  it('omits volume and duration when not provided', () => {
    expect(formatWorkoutStats(18, undefined, 'lbs', undefined)).toBe('18 sets')
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

describe('formatBodyweight', () => {
  it('always shows one decimal', () => {
    expect(formatBodyweight(200)).toBe('200.0')
    expect(formatBodyweight(196.84)).toBe('196.8')
  })
})

describe('formatSignedRate', () => {
  it('signs a rate and keeps at least one decimal', () => {
    expect(formatSignedRate(-0.6)).toBe('-0.6')
    expect(formatSignedRate(0.25)).toBe('+0.25')
    expect(formatSignedRate(-1)).toBe('-1.0')
    expect(formatSignedRate(0)).toBe('0.0')
  })

  it('rounds float noise to two places', () => {
    expect(formatSignedRate(-0.7000001)).toBe('-0.7')
  })
})
