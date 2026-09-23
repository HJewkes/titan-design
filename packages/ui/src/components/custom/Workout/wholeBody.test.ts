import { describe, it, expect } from 'vitest'

import {
  SESSION_SEGMENT_LIMIT,
  bandCaption,
  bandDomain,
  bandPosition,
  dueMarkerPosition,
  leadCaption,
  phaseLabel,
  rateBandCaption,
  rateCaption,
  sessionCaptions,
  sessionCells,
  trackFraction,
  weighInDate,
  weightCaptions,
  wholeBodyScale,
} from './wholeBody'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

describe('sessionCells', () => {
  it('draws one cell per committed day, trained days first', () => {
    const cells = sessionCells(S.underPace)
    expect(cells).toHaveLength(12)
    expect(cells?.filter((cell) => cell === 'done')).toHaveLength(9)
    expect(cells?.slice(9)).toEqual(['open', 'open', 'open'])
  })

  it('appends a darker cell per day past the commitment (owner, round 2)', () => {
    expect(sessionCells(S.overCommitment)?.slice(10)).toEqual(['done', 'done', 'extra', 'extra'])
  })

  it('keeps cells up to the segment limit', () => {
    const atLimit = { ...S.underPace, committed: SESSION_SEGMENT_LIMIT }
    expect(sessionCells(atLimit)).toHaveLength(SESSION_SEGMENT_LIMIT)
  })

  it('falls back to a plain bar past the segment limit (F5)', () => {
    expect(sessionCells(S.largeCommitment)).toBeNull()
  })

  it('falls back when appended days carry it past the limit', () => {
    expect(sessionCells({ ...S.overCommitment, committed: 18, counted: 22 })).toBeNull()
  })
})

describe('dueMarkerPosition', () => {
  it('places the due-by-now marker while the first window fills', () => {
    expect(dueMarkerPosition(S.underPace)).toBeCloseTo(10 / 12)
  })

  it('places the marker along appended cells too', () => {
    expect(dueMarkerPosition({ ...S.underPace, counted: 14 }, 14)).toBeCloseTo(10 / 14)
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

describe('sessionCaptions', () => {
  const texts = (row: typeof S.underPace) => sessionCaptions(row).map((line) => line.text)

  it('says the window started today instead of "0 due" (F3)', () => {
    expect(texts(S.windowStarted)).toEqual(['Window started today', 'None leave this week'])
  })

  it('names what is due and what leaves while under pace (F4)', () => {
    expect(texts(S.underPace)).toEqual(['10 due by now', '3 leave this week'])
  })

  it('says nothing is due once the window is full', () => {
    expect(texts(S.atCommitment)).toEqual(['3 leave this week'])
  })

  it('counts training days over the commitment', () => {
    expect(texts(S.overCommitment)).toContain('2 over your commitment')
  })

  it('uses the singular for one day leaving', () => {
    expect(texts({ ...S.atCommitment, agingOutNext7d: 1 })).toContain('1 leaves this week')
  })

  it('omits the leaving line when it is unknown', () => {
    expect(texts({ ...S.atCommitment, agingOutNext7d: null })).toEqual([])
  })
})

describe('leadCaption', () => {
  it('leads with the preferred line and tips the rest', () => {
    const { lead, rest } = leadCaption(sessionCaptions(S.underPace), 'leaving')
    expect(lead?.text).toBe('3 leave this week')
    expect(rest.map((line) => line.text)).toEqual(['10 due by now'])
  })

  it('falls back to the first line when the preferred one is absent', () => {
    const { lead, rest } = leadCaption(sessionCaptions(S.atCommitment), 'due')
    expect(lead?.text).toBe('3 leave this week')
    expect(rest).toEqual([])
  })

  it('has no lead with no lines', () => {
    expect(leadCaption([], 'due')).toEqual({ lead: null, rest: [] })
  })
})

describe('weightCaptions', () => {
  it('leads with the rate, then the band, then the phase band (F6)', () => {
    expect(weightCaptions(W.cut).map((line) => line.key)).toEqual(['rate', 'band', 'rateBand'])
  })

  it('leads a weigh-in with no rate with N/A and keeps the reason for the tip (F11)', () => {
    const lines = weightCaptions(W.oneReading)
    expect(lines[0]).toEqual({ key: 'rate', text: 'N/A', label: 'Rate', value: 'N/A' })
    expect(lines.map((line) => line.key)).toContain('rateWhy')
  })

  it('has no lines before the first weigh-in (F12)', () => {
    expect(weightCaptions(W.noReadings)).toEqual([])
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

  // Gate S2: a 1968-for-196.8 typo shrank the band to 0.6 px and stacked its two labels.
  it('keeps the band at least a seventh of the track however far out the weigh-in is', () => {
    for (const latest of [1968, 19.68, 166.8]) {
      const { min, max } = bandDomain(197, 194, latest)
      expect(trackFraction(197, min, max) - trackFraction(194, min, max)).toBeGreaterThanOrEqual(
        1 / 7
      )
    }
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

  it('names a slow-loss band like any other (F10)', () => {
    expect(bandCaption(W.slowLoss)).toBe('Week 4 of 8: 186.2 to 188.1 lb')
  })

  it('prints one number for the server’s zero-width slow-loss line', () => {
    expect(bandCaption(W.slowLossOneLine)).toBe('Week 4 of 8: 186.2 lb. 0.1 lb above the band')
  })
})

describe('phaseLabel', () => {
  it('names the phase in one word, without the week (owner, round 3)', () => {
    expect(phaseLabel(W.cut.phase)).toBe('Cut')
    expect(phaseLabel(W.hold.phase)).toBe('Hold')
  })

  it('names a recomposition by its declared mode', () => {
    expect(phaseLabel(W.slowLoss.phase)).toBe('Recomp, slow loss')
    expect(phaseLabel({ name: 'recomposition', weeksInPhase: 2 })).toBe('Recomp, hold')
  })

  it('says when no phase is declared', () => {
    expect(phaseLabel({ name: 'unknown', weeksInPhase: 0 })).toBe('No phase declared')
  })
})

describe('rateCaption', () => {
  it('is the percent this week alone (owner, round 3)', () => {
    expect(rateCaption(W.cut)).toBe('-0.6%/wk')
  })

  it('signs a gain rate', () => {
    expect(rateCaption(W.gain)).toBe('+0.3%/wk')
  })

  it('reads a hold, which has no rate band, the same way (F8)', () => {
    expect(rateCaption(W.hold)).toBe('+0.1%/wk')
  })

  it('reads a vetoed week the same way; its phase band leaves the tip (F13)', () => {
    expect(rateCaption(W.rateVetoed)).toBe('-0.9%/wk')
  })

  it('has none with one weigh-in, where the card says N/A (F11)', () => {
    expect(rateCaption(W.oneReading)).toBeNull()
  })

  it('has none before the first weigh-in (F12)', () => {
    expect(rateCaption(W.noReadings)).toBeNull()
  })

  it('rounds a noisy rate without float drift', () => {
    expect(rateCaption({ ...W.cut, rate: { ...W.cut.rate, observedPctPerWeek: -0.7000001 } })).toBe(
      '-0.7%/wk'
    )
  })
})

describe('rateBandCaption', () => {
  it('names the phase band for the tip (F6)', () => {
    expect(rateBandCaption(W.cut)).toBe('Cut band -0.5 to -1.0%/wk')
  })

  it('has none for a hold, which has no rate band (F8)', () => {
    expect(rateBandCaption(W.hold)).toBeNull()
  })

  it('has none in a vetoed week (F13)', () => {
    expect(rateBandCaption(W.rateVetoed)).toBeNull()
  })
})

describe('weighInDate', () => {
  // The server stamps readings in UTC; 11:30 pm Pacific on the 18th is 06:30Z on the 19th.
  it('names the day the lifter weighed in, not the UTC day', () => {
    const zone = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      expect(weighInDate('2026-09-19T06:30:00Z')).toBe('Sep 18')
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  })

  it('returns an empty string for a bad timestamp', () => {
    expect(weighInDate('not a date')).toBe('')
  })
})

describe('wholeBodyScale', () => {
  it('stacks until the box is measured, then lays out by width', () => {
    expect(wholeBodyScale(null)).toBe('phone')
    expect(wholeBodyScale(559)).toBe('phone')
    expect(wholeBodyScale(560)).toBe('wall')
  })

  it('honours a pinned scale', () => {
    expect(wholeBodyScale(1800, 'phone')).toBe('phone')
  })
})
