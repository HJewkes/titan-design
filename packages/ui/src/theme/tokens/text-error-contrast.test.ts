import { describe, expect, it } from 'vitest'
import { primitiveRamps } from './primitives'
import { getSemanticColors } from './semantic'

/** WCAG 2.1 relative luminance / contrast ratio. */
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const h = hex.replace('#', '')
    const chan = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2]
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const PLANES = ['surface-base', 'surface-raised', 'surface-elevated', 'surface-overlay'] as const

describe('text-error contrast', () => {
  describe('light theme', () => {
    const colors = getSemanticColors('light')

    it.each(PLANES)('clears 4.5:1 on %s', (plane) => {
      const ratio = contrastRatio(colors['text-error'], colors[plane])
      console.info(`light text-error on ${plane}: ${ratio.toFixed(2)}`)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  // Dark sits below 4.5:1 by owner decision (q4b-red-conflict r1 (a)); contrast-baseline.json records it.
  describe('dark theme', () => {
    it('uses red 500, as chosen at Gate 2', () => {
      expect(getSemanticColors('dark')['text-error']).toBe(primitiveRamps.red[500])
    })
  })
})
