import { describe, it, expect } from 'vitest'

import {
  SESSION_SEGMENT_LIMIT,
  bandCaption,
  bandDomain,
  bandPosition,
  dueMarkerPosition,
  phaseLabel,
  rateCaption,
  sessionsCaption,
  sessionsVisualFor,
  weighInDate,
  wholeBodyScale,
} from './wholeBody'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

describe('sessionsVisualFor', () => {
  it('keeps segments up to the segment limit', () => {
    expect(sessionsVisualFor('segments', SESSION_SEGMENT_LIMIT)).toBe('segments')
  })

  it('falls back to a plain bar past the segment limit (F5)', () => {
    expect(sessionsVisualFor('segments', S.largeCommitment.committed)).toBe('progress')
  })

  it('leaves the other renders alone at any size', () => {
    expect(sessionsVisualFor('number', 40)).toBe('number')
    expect(sessionsVisualFor('progress', 3)).toBe('progress')
  })
})

describe('dueMarkerPosition', () => {
  it('places the due-by-now marker while the first window fills', () => {
    expect(dueMarkerPosition(S.underPace)).toBeCloseTo(10 / 12)
  })

  it('draws no marker once the window is full', () => {
    expect(dueMarkerPosition(S.atCommitment)).toBeNull()
  })

  it('pins the marker to the start on the day the goal is made (F3)', () => {
    expect(dueMarkerPosition(S.windowStarted)).toBe(0)
  })

  it('draws no marker for a zero commitment', () => {
    expect(dueMarkerPosition({ ...S.underPace, committed: 0 })).toBeNull()
  })
})

describe('sessionsCaption', () => {
  it('says the window started today instead of "0 due" (F3)', () => {
    expect(sessionsCaption(S.windowStarted)).toEqual([
      'Window started today',
      'None leave the window this week',
    ])
  })

  it('names what is due and what leaves while under pace (F4)', () => {
    expect(sessionsCaption(S.underPace)).toEqual([
      '10 due by now',
      '3 days leave the window this week',
    ])
  })

  it('says nothing is due once the window is full', () => {
    expect(sessionsCaption(S.atCommitment)).toEqual(['3 days leave the window this week'])
  })

  it('counts training days over the commitment', () => {
    expect(sessionsCaption({ ...S.atCommitment, counted: 14 })).toContain('2 over your commitment')
  })

  it('uses the singular for one day leaving', () => {
    expect(sessionsCaption({ ...S.atCommitment, agingOutNext7d: 1 })).toContain(
      '1 day leaves the window this week'
    )
  })

  it('omits the leaving line when it is unknown', () => {
    expect(sessionsCaption({ ...S.atCommitment, agingOutNext7d: null })).toEqual([])
  })
})

describe('bandDomain', () => {
  it('puts the band in the middle third of the track', () => {
    expect(bandDomain(197, 194, 196.8)).toEqual({ min: 191, max: 200 })
  })

  it('widens to keep an outlying weigh-in on the track (F9)', () => {
    const { max } = bandDomain(176.4, 183.6, 195)
    expect(max).toBeGreaterThan(195)
  })

  it('gives a zero-width band a track to sit on (F10)', () => {
    const { min, max } = bandDomain(186.2, 186.2, 186.3)
    expect(max - min).toBeGreaterThan(3)
  })
})

describe('bandPosition', () => {
  it('reads a cut band whichever edge is numerically higher', () => {
    expect(bandPosition(196.8, 197, 194)).toBe('inside')
    expect(bandPosition(197.5, 197, 194)).toBe('above')
    expect(bandPosition(193, 197, 194)).toBe('below')
  })
})

describe('bandCaption', () => {
  it('names the block week and the band, low number first (F6)', () => {
    expect(bandCaption(W.cut)).toBe('Week 3 of 8: 194.0 to 197.0 lb')
  })

  it('names a hold as a corridor (F8)', () => {
    expect(bandCaption(W.hold)).toBe('Hold 176.4 to 183.6 lb')
  })

  it('says how far out of the corridor a weigh-in is (F9)', () => {
    expect(bandCaption(W.outsideHold)).toBe('Hold 176.4 to 183.6 lb. 0.5 lb above the corridor')
  })

  it('prints one number for a zero-width band (F10)', () => {
    expect(bandCaption(W.slowLoss)).toBe('Week 4 of 8: 186.2 lb. 0.1 lb above the band')
  })
})

describe('phaseLabel', () => {
  it('names the phase and how long it has run', () => {
    expect(phaseLabel(W.cut.phase)).toBe('Cut · week 3')
    expect(phaseLabel(W.hold.phase)).toBe('Hold · week 5')
  })

  it('names a recomposition by its declared mode', () => {
    expect(phaseLabel(W.slowLoss.phase)).toBe('Recomp, slow loss · week 4')
    expect(phaseLabel({ name: 'recomposition', weeksInPhase: 2 })).toBe('Recomp, hold · week 2')
  })

  it('says when no phase is declared', () => {
    expect(phaseLabel({ name: 'unknown', weeksInPhase: 0 })).toBe('No phase declared')
  })
})

describe('rateCaption', () => {
  it('reads the observed rate against the phase rate (F6)', () => {
    expect(rateCaption(W.cut)).toBe('-0.6 %/wk against -0.5 to -1.0 for a cut')
  })

  it('signs a gain rate', () => {
    expect(rateCaption(W.gain)).toBe('+0.3 %/wk against +0.25 to +0.5 for a gain')
  })

  it('says a hold has no target rate (F8)', () => {
    expect(rateCaption(W.hold)).toBe('+0.1 %/wk, no target rate for a hold')
  })

  it('prints one rate for slow loss (F10)', () => {
    expect(rateCaption(W.slowLoss)).toBe('-0.5 %/wk against -0.5 for this recomp')
  })

  it('waits for a second week with one weigh-in (F11)', () => {
    expect(rateCaption(W.oneReading)).toBe('Rate shows after a second week of weigh-ins')
  })

  it('says a vetoed week is not judged (F13)', () => {
    expect(rateCaption(W.rateVetoed)).toBe('-0.9 %/wk, not judged this week')
  })

  it('says nothing before the first weigh-in (F12)', () => {
    expect(rateCaption(W.noReadings)).toBeNull()
  })

  it('rounds a noisy rate without float drift', () => {
    expect(
      rateCaption({ ...W.cut, rate: { ...W.cut.rate, observedPctPerWeek: -0.7000001 } })
    ).toMatch(/^-0\.7 %\/wk/)
  })
})

describe('weighInDate', () => {
  it('formats in UTC so the date does not move with the machine', () => {
    expect(weighInDate('2026-09-18T23:30:00Z')).toBe('Sep 18')
  })

  it('returns an empty string for a bad timestamp', () => {
    expect(weighInDate('not a date')).toBe('')
  })
})

describe('wholeBodyScale', () => {
  it('stacks until the box is measured, then lays out by width', () => {
    expect(wholeBodyScale(null)).toBe('phone')
    expect(wholeBodyScale(719)).toBe('phone')
    expect(wholeBodyScale(720)).toBe('wall')
  })

  it('honours a pinned scale', () => {
    expect(wholeBodyScale(1800, 'phone')).toBe('phone')
  })
})
