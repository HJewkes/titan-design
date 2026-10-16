import { describe, expect, it } from 'vitest'
import { primitiveRamps as ramp } from './primitives'
import { getSemanticColors } from './semantic'

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

const LIGHT: Record<string, string> = {
  'text-brand': ramp.orange[700],
  'text-brand-secondary': ramp.cyan[800], // TD-789 3b
  'text-success': ramp.green[800], // TD-789 3b
  'text-warning': ramp.amber[700],
  'text-info': ramp.blue[700],
}
const DARK: Record<string, string> = {
  'text-brand': ramp.orange[400],
  'text-brand-secondary': ramp.cyan[300],
  'text-success': ramp.green[400],
  'text-warning': ramp.amber[300],
  'text-info': ramp.blue[300],
}
// The 3b planes: grey 200 / 100 / 50 / white in light, the dark ramp in dark (TD-483).
const PLANES = [
  'background-base',
  'surface-base',
  'surface-elevated',
  'surface-raised',
  'surface-overlay',
] as const

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('tone text tokens, %s', (mode, expected) => {
  const colors: Record<string, string> = getSemanticColors(mode)

  it.each(Object.entries(expected))('%s takes its chosen ramp step', (key, hex) => {
    expect(colors[key]).toBe(hex)
  })

  it.each(Object.keys(expected))('%s clears 4.5:1 on every plane', (key) => {
    for (const plane of PLANES) {
      const ratio = contrastRatio(colors[key], colors[plane])
      console.info(`${mode} ${key} on ${plane}: ${ratio.toFixed(2)}`)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})
