import { describe, expect, it } from 'vitest'
import {
  FAMILY_HUES,
  neutralSolidPair,
  readOnPlanes,
  solidPair,
  shippedLine,
  subtlePair,
  worst,
} from './surface-family'
import { D2_OPTIONS, readD1, readD5 } from './surface-family-decisions'

const at2 = (n: number) => Number(n.toFixed(2))

describe('surface family (plan §2)', () => {
  it('gives every light solid a white label at AA, red lowest at 4.57', () => {
    const labels = FAMILY_HUES.map((hue) =>
      worst(readOnPlanes(solidPair(hue, 'light'), 'light'), 'label')
    )

    expect(Math.min(...labels)).toBeGreaterThanOrEqual(4.5)
    expect(at2(labels[0])).toBe(4.57)
  })

  it('gives every dark solid a grey[950] label at AA, red lowest at 4.59', () => {
    const labels = FAMILY_HUES.map((hue) =>
      worst(readOnPlanes(solidPair(hue, 'dark'), 'dark'), 'label')
    )

    expect(Math.min(...labels)).toBeGreaterThanOrEqual(4.5)
    expect(at2(labels[0])).toBe(4.59)
  })

  it('keeps the neutral solid at AA in both modes', () => {
    expect(at2(worst(readOnPlanes(neutralSolidPair('light'), 'light'), 'label'))).toBe(6.99)
    expect(at2(worst(readOnPlanes(neutralSolidPair('dark'), 'dark'), 'label'))).toBe(11.51)
  })

  it('reads the dark subtle wash at AA on the overlay, magenta lowest at 4.65', () => {
    const labels = FAMILY_HUES.map((hue) =>
      worst(readOnPlanes(subtlePair(hue, 'dark'), 'dark'), 'label')
    )

    expect(Math.min(...labels)).toBeGreaterThanOrEqual(4.5)
    expect(at2(labels[FAMILY_HUES.indexOf('magenta')])).toBe(4.65)
  })

  it('reads every light subtle label at AA, green lowest at 5.63', () => {
    const labels = FAMILY_HUES.map((hue) =>
      worst(readOnPlanes(subtlePair(hue, 'light'), 'light'), 'label')
    )

    expect(at2(Math.min(...labels))).toBe(5.63)
  })
})

describe('shipped comparison', () => {
  it('names where today differs from the family, by ramp step', () => {
    expect(shippedLine('red', 'solid', 'light')).toBe('today: status-error-solid (same)')
    expect(shippedLine('orange', 'solid', 'light')).toBe(
      'today: brand-primary-solid is orange[400]'
    )
    expect(shippedLine('red', 'subtle', 'dark')).toBe(
      'today: status-error-subtle is red[400] at 8%'
    )
    expect(shippedLine('magenta', 'solid', 'dark')).toBe('today: no token')
  })
})

describe('surface family decisions', () => {
  it('D1: reading B misses on every family solid, and white in dark misses at any 3:1 step', () => {
    const { whiteInDark, grey950InLight } = readD1()

    expect([...whiteInDark, ...grey950InLight].every((r) => r.ratio < 4.5)).toBe(true)
    expect(whiteInDark.every((r) => r.best.ratio < 4.5)).toBe(true)
    expect(at2(Math.max(...whiteInDark.map((r) => r.best.ratio)))).toBe(3.91)
  })

  it('D1: grey[950] in light reaches AA only on red, orange and amber at their best step', () => {
    const { grey950InLight } = readD1()

    expect(grey950InLight.filter((r) => r.best.ratio >= 4.5).map((r) => r.hue)).toEqual([
      'red',
      'orange',
      'amber',
    ])
  })

  it('D2: keeps orange[500] and amber[500] at 3.74 and 3.63, moves to 5.19 and 5.02', () => {
    const ratios = D2_OPTIONS.flatMap((o) => o.pairs.map((p) => at2(p.ratio)))

    expect(ratios).toEqual([3.74, 3.63, 5.19, 5.02])
  })

  it('D5: every page option keeps the subtle label at AA', () => {
    const labels = readD5().flatMap((page) =>
      page.rows.flatMap((r) => [r.today.ratio, r.rule.ratio])
    )

    expect(Math.min(...labels)).toBeGreaterThanOrEqual(4.5)
  })
})
