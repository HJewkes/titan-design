import { describe, expect, it } from 'vitest'
import {
  ZONE_SIZES,
  fraction,
  showsTickLabel,
  tickLabelStep,
  zoneBands,
  zoneTrackLayout,
} from './zoneTrackGeometry'

describe('fraction', () => {
  it('clamps values below min to 0 and above max to 1', () => {
    expect(fraction(-5, 0, 10)).toBe(0)
    expect(fraction(15, 0, 10)).toBe(1)
    expect(fraction(2.5, 0, 10)).toBe(0.25)
  })

  it('returns 0 for an empty or inverted domain', () => {
    expect(fraction(5, 10, 10)).toBe(0)
    expect(fraction(5, 10, 0)).toBe(0)
  })
})

describe('zoneBands', () => {
  it('weights each zone by its span clamped to the domain', () => {
    const bands = zoneBands(
      [
        { upTo: 60, color: 'a' },
        { upTo: 80, color: 'b' },
      ],
      50,
      100
    )
    expect(bands).toEqual([
      { color: 'a', weight: 10 },
      { color: 'b', weight: 20 },
    ])
  })

  it('gives a zone that starts past max no weight', () => {
    const bands = zoneBands(
      [
        { upTo: 40, color: 'a' },
        { upTo: 60, color: 'b' },
      ],
      0,
      30
    )
    expect(bands.map((b) => b.weight)).toEqual([30, 0])
  })
})

describe('tickLabelStep', () => {
  it('shows every label while the track is unmeasured', () => {
    expect(tickLabelStep(0, 10, 28)).toBe(1)
  })

  it('shows every label when spacing exactly fills a cell', () => {
    expect(tickLabelStep(280, 10, 28)).toBe(1)
  })

  it('keeps every second label when spacing is half a cell', () => {
    expect(tickLabelStep(140, 10, 28)).toBe(2)
  })
})

describe('showsTickLabel', () => {
  it('keeps the first, last, stepped and emphasized labels and drops the rest', () => {
    const shown = Array.from({ length: 7 }, (_, i) => showsTickLabel(i, i === 3, 2, 7))
    expect(shown).toEqual([true, false, true, true, true, false, true])
  })

  it('keeps every label at step 1', () => {
    expect(showsTickLabel(1, false, 1, 7)).toBe(true)
  })
})

describe('zoneTrackLayout', () => {
  it('makes a needle track overhang by twice the overhang', () => {
    const layout = zoneTrackLayout({
      min: 0,
      max: 40,
      marker: { type: 'needle', value: 10 },
      size: 'default',
    })
    expect(layout.isNeedle).toBe(true)
    expect(layout.markerHeight).toBe(14 + 6 * 2)
    expect(layout.markerFrac).toBe(0.25)
  })

  it('lets explicit heights beat the size defaults', () => {
    const layout = zoneTrackLayout({
      min: 0,
      max: 40,
      marker: { type: 'needle', value: 10 },
      size: 'wall',
      trackHeight: 30,
      needleOverhang: 2,
    })
    expect(layout.trackHeight).toBe(30)
    expect(layout.markerHeight).toBe(34)
    expect(layout.sizing).toBe(ZONE_SIZES.wall)
  })

  it('keeps a fill marker to the track height', () => {
    const layout = zoneTrackLayout({
      min: 0,
      max: 40,
      marker: { type: 'fill', value: 50 },
      size: 'default',
    })
    expect(layout.isNeedle).toBe(false)
    expect(layout.markerHeight).toBe(14)
    expect(layout.markerFrac).toBe(1)
  })
})
