import { describe, it, expect } from 'vitest'
import { chipEntry, layoutChipBand, videoFontPx, type BandChip } from './chipBandLayout'
import { EVIDENCE_BEATS, beatFixture } from './__fixtures__/evidence-chips'

const BAND_WIDTH = 1800
const chip = (text: string): BandChip => ({ kind: 'docs-claim', text })

describe('layoutChipBand', () => {
  it('caps the band at max chips and counts the rest', () => {
    const chips = ['a.md:1', 'b.md:2', 'c.md:3', 'd.md:4', 'e.md:5'].map(chip)
    const layout = layoutChipBand(chips, { width: BAND_WIDTH, max: 3 })
    expect(layout.lead.text).toBe('a.md:1')
    expect(layout.tabs).toHaveLength(2)
    expect(layout.dropped.map((c) => c.text)).toEqual(['d.md:4', 'e.md:5'])
  })

  it('folds a tab into the count when the lead citation cannot fit beside two tabs', () => {
    const layout = layoutChipBand(beatFixture('b5-4-tick').chips, { width: BAND_WIDTH })
    expect(layout.tabs).toHaveLength(1)
    expect(layout.dropped).toHaveLength(1)
    expect(layout.leadElision).toMatchObject({
      text: 'cd@7b2e04a1:…/heartbeat.ts:120-148 +1',
      fits: true,
    })
  })

  it('fits every fixture beat on one line inside the band width', () => {
    for (const { beat, chips } of EVIDENCE_BEATS) {
      const layout = layoutChipBand(chips, { width: BAND_WIDTH })
      expect(layout.fits, beat).toBe(true)
      expect(layout.usedWidth, beat).toBeLessThanOrEqual(BAND_WIDTH)
    }
  })

  it('scales the font with frame height, not width', () => {
    expect(videoFontPx(1080)).toBe(40)
    expect(videoFontPx(1440)).toBeCloseTo(53.33, 2)
    expect(layoutChipBand([chip('a.md:1')], { width: 900, frameHeight: 1440 }).fontPx).toBeCloseTo(
      53.33,
      2
    )
  })

  it('refuses a font under the 40 px per 1080 floor', () => {
    expect(() => layoutChipBand([chip('a.md:1')], { width: BAND_WIDTH, fontPx: 28 })).toThrow(
      RangeError
    )
    expect(() =>
      layoutChipBand([chip('a.md:1')], { width: BAND_WIDTH, frameHeight: 1440, fontPx: 40 })
    ).toThrow(RangeError)
  })
})

describe('chipEntry', () => {
  it('starts each chip one 60 ms stagger after the last', () => {
    expect(chipEntry(0, 3, 0).opacity).toBe(0)
    expect(chipEntry(1, 3, 0.06).opacity).toBe(0)
    expect(chipEntry(1, 3, 0.061).opacity).toBeGreaterThan(0)
    expect(chipEntry(2, 3, 0.12).opacity).toBe(0)
  })

  it('compresses the stagger so a long cascade starts within half a second', () => {
    expect(chipEntry(11, 12, 0.5).opacity).toBe(0)
    expect(chipEntry(11, 12, 0.501).opacity).toBeGreaterThan(0)
  })

  it('rises by the video rise, scaled to the frame, and settles at rest', () => {
    expect(chipEntry(0, 1, 0).translateY).toBe(40)
    expect(chipEntry(0, 1, 0, { frameHeight: 2160 }).translateY).toBe(80)
    expect(chipEntry(0, 1, 0, { entry: 'fade' }).translateY).toBe(0)
    expect(chipEntry(0, 1, 0.5)).toEqual({ opacity: 1, translateY: 0 })
  })

  it('shows the end state at once under reduced motion', () => {
    expect(chipEntry(2, 3, 0, { reducedMotion: true })).toEqual({ opacity: 1, translateY: 0 })
  })
})
