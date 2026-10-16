import { describe, expect, it } from 'vitest'
import { stageBox, STAGE_METRICS_S96, type StageChrome } from './stage-box'

const HD = { width: 1920, height: 1080 }
const QHD = { width: 2560, height: 1440 }
const SHIPPED: StageChrome = { header: { headline: 'body' }, chipRows: 2 }
const LOCKUP: StageChrome = {
  header: { kicker: true, headline: 'title', rule: true, sub: true },
  chipRows: 1,
}

describe('stageBox', () => {
  it('reproduces the shipped explainer chrome at 1080, with the stage ending at the keep-out', () => {
    const box = stageBox(HD, SHIPPED)

    expect(box.scale).toBe(1)
    expect(box.header).toEqual({ x: 60, y: 0, width: 1800, height: 122 })
    expect(box.chipBand).toEqual({ x: 60, y: 915, width: 1800, height: 165 })
    expect(box.keepOut).toEqual({ x: 0, y: 896, width: 1920, height: 184 })
    expect(box.stage).toEqual({ x: 0, y: 122, width: 1920, height: 774 })
  })

  it('scales every band by frame height at 1440', () => {
    const box = stageBox(QHD, SHIPPED)

    expect(box.scale).toBeCloseTo(4 / 3)
    expect(box.header.height).toBe(163)
    expect(box.chipBand).toEqual({ x: 80, y: 1220, width: 2400, height: 220 })
    expect(box.keepOut.y).toBe(1195)
    expect(box.stage).toEqual({ x: 0, y: 163, width: 2560, height: 1032 })
  })

  it('sums a full lockup without a float pixel at 1080', () => {
    const box = stageBox(HD, LOCKUP)

    expect(box.header.height).toBe(319)
    expect(box.chipBand.y).toBe(981)
    expect(box.chipBand.height).toBe(99)
    expect(box.stage).toEqual({ x: 0, y: 319, width: 1920, height: 577 })
  })

  it('scales the full lockup before rounding at 1440', () => {
    const box = stageBox(QHD, LOCKUP)

    expect(box.header.height).toBe(426)
    expect(box.chipBand.y).toBe(1308)
    expect(box.chipBand.height).toBe(132)
    expect(box.stage).toEqual({ x: 0, y: 426, width: 2560, height: 769 })
    expect(Number.isInteger(box.stage.height)).toBe(true)
  })

  it('seats a bottom header on the caption keep-out, not the chip band', () => {
    const box = stageBox(HD, {
      header: { headline: 'title', sub: true },
      headerAt: 'bottom',
      chipRows: 2,
    })

    expect(box.header).toEqual({ x: 60, y: 660, width: 1800, height: 236 })
    expect(box.stage).toEqual({ x: 0, y: 26, width: 1920, height: 634 })
  })

  it('ends the stage at the chip band when the keep-out is off', () => {
    const box = stageBox(HD, { ...SHIPPED, keepOutFraction: 1 })

    expect(box.keepOut.height).toBe(0)
    expect(box.stage.y + box.stage.height).toBe(915)
  })

  it('gives a headerless stage the top of the frame and an empty chip band at the foot', () => {
    const box = stageBox(HD, { header: 'none', chipRows: 0 })

    expect(box.header.height).toBe(0)
    expect(box.chipBand).toEqual({ x: 60, y: 1080, width: 1800, height: 0 })
    expect(box.stage).toEqual({ x: 0, y: 0, width: 1920, height: 896 })
  })

  it('still fits the shipped row and code-line budgets in the shipped chrome', () => {
    const { stage } = stageBox(HD, SHIPPED)
    const codeLinesEndAt = 892
    const listRows = 5 * 129 + 96

    expect(stage.y + stage.height).toBeGreaterThanOrEqual(codeLinesEndAt)
    expect(listRows).toBeLessThanOrEqual(stage.height)
  })

  it('takes metric overrides on top of the S96 defaults', () => {
    const box = stageBox(HD, { ...SHIPPED, metrics: { edgeX: 100 } })

    expect(box.chipBand.x).toBe(100)
    expect(STAGE_METRICS_S96.edgeX).toBe(60)
  })

  it.each([
    ['a zero width', { width: 0, height: 1080 }, {}],
    ['a NaN height', { width: 1920, height: NaN }, {}],
    ['an infinite width', { width: Infinity, height: 1080 }, {}],
    ['a keep-out above 1', HD, { keepOutFraction: 1.2 }],
    ['a keep-out of 0', HD, { keepOutFraction: 0 }],
    [
      'a header that meets the keep-out',
      HD,
      { header: { headline: 'title' }, metrics: { title: 800 } } as StageChrome,
    ],
  ])('throws a RangeError on %s', (_, frame, chrome) => {
    expect(() => stageBox(frame, chrome)).toThrow(RangeError)
  })
})
