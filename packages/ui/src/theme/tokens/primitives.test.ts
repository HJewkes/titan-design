import { describe, it, expect } from 'vitest'
import {
  primitiveRamps,
  categoricalPalette,
  getCategoricalColor,
  CATEGORICAL_CVD_SAFE_MAX,
  divergingScale,
  sequentialEffort,
  bestTextColor,
} from './primitives'

// --- Minimal OKLab + Machado-2009 dichromacy math (ported from the color-system
// derivation tools) so the categorical CVD floor is a real, checked property. ---
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}
const lin = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)
const toOklab = ([r, g, b]: number[]): [number, number, number] => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
const mul = (M: number[], v: number[]) => [
  M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
  M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
  M[6] * v[0] + M[7] * v[1] + M[8] * v[2],
]
// Machado-2009 dichromacy simulation matrices, severity 1.0. The palette solver
// optimizes worst-case deuteranopia/protanopia (red-green is the binding case) —
// match that 2-way metric here, not a stricter 3-way including tritan.
const DEUT = [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881]
const PROT = [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998]
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100
// worst-case perceived ΔE across deuteranopia and protanopia
const cvdDelta = (x: string, y: string) => {
  const sim = (M: number[], hex: string) => toOklab(mul(M, hexToRgb(hex).map(lin)))
  return Math.min(
    ...[DEUT, PROT].map((M) => dist(sim(M, x), sim(M, y))),
  )
}

const HEX6 = /^#[0-9A-F]{6}$/
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const HUES = ['red', 'orange', 'amber', 'green', 'cyan', 'blue', 'magenta'] as const

describe('primitiveRamps', () => {
  it('has all seven consolidated hues', () => {
    expect(Object.keys(primitiveRamps).sort()).toEqual([...HUES].sort())
  })

  it('gives every hue all eleven perceptual steps as uppercase 6-digit hex', () => {
    for (const hue of HUES) {
      const ramp = primitiveRamps[hue] as Record<number, string>
      for (const step of STEPS) {
        expect(ramp[step], `${hue}-${step}`).toMatch(HEX6)
      }
    }
  })

  it('flows through each pinned anchor color at its step', () => {
    // The step each ramp is pinned to its brand/semantic anchor hex.
    const anchors: Record<string, string> = {
      'red-600': '#D14343', // status-error
      'orange-400': '#FF7900', // brand-primary
      'amber-300': '#F9B415', // status-warning
      'green-300': '#2ED573', // status-success
      'cyan-300': '#22D3EE', // vivid cyan identity
      'blue-500': '#2196F3', // status-info
      'magenta-700': '#9C0D7A',
    }
    for (const [key, hex] of Object.entries(anchors)) {
      const [hue, step] = key.split('-')
      expect((primitiveRamps as never)[hue][Number(step)]).toBe(hex)
    }
  })

  it('increases in darkness monotonically (OKLab L descends 50 -> 950)', () => {
    for (const hue of HUES) {
      const ramp = primitiveRamps[hue] as Record<number, string>
      const lightness = STEPS.map((s) => toOklab(hexToRgb(ramp[s]).map(lin))[0])
      for (let i = 1; i < lightness.length; i++) {
        expect(lightness[i], `${hue} ${STEPS[i - 1]}->${STEPS[i]}`).toBeLessThan(lightness[i - 1])
      }
    }
  })
})

describe('categoricalPalette', () => {
  it('has two ordered variants of seven colors', () => {
    expect(categoricalPalette.default).toHaveLength(7)
    expect(categoricalPalette.dark).toHaveLength(7)
  })

  it('is all uppercase 6-digit hex', () => {
    for (const variant of ['default', 'dark'] as const) {
      for (const hex of categoricalPalette[variant]) {
        expect(hex).toMatch(HEX6)
      }
    }
  })

  it('holds the deut/protanopia dichromacy floor (deltaE >= 8) through the CVD-safe max', () => {
    // The first CATEGORICAL_CVD_SAFE_MAX colors are legend-free CVD-safe; the 7th is extended.
    for (const variant of ['default', 'dark'] as const) {
      const colors = categoricalPalette[variant].slice(0, CATEGORICAL_CVD_SAFE_MAX)
      let worst = Infinity
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          worst = Math.min(worst, cvdDelta(colors[i], colors[j]))
        }
      }
      expect(worst, `${variant} min CVD deltaE (first ${CATEGORICAL_CVD_SAFE_MAX})`).toBeGreaterThanOrEqual(8)
    }
  })

  it('is nested-stable: no color repeats within a variant', () => {
    for (const variant of ['default', 'dark'] as const) {
      expect(new Set(categoricalPalette[variant]).size).toBe(categoricalPalette[variant].length)
    }
  })

  it('carries readable in-place text: default on black (>=4.5), dark on white (>=3.5)', () => {
    const relLum = (hex: string) => {
      const [r, g, b] = hexToRgb(hex).map(lin)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const onBlack = (hex: string) => (relLum(hex) + 0.05) / 0.05
    const onWhite = (hex: string) => 1.05 / (relLum(hex) + 0.05)
    // The in-place text guarantee covers the CVD-safe range; the 7th extended
    // color trades contrast for separation and is meant to be legend-paired.
    for (const hex of categoricalPalette.default.slice(0, CATEGORICAL_CVD_SAFE_MAX)) {
      expect(onBlack(hex), `default ${hex} black-text contrast`).toBeGreaterThanOrEqual(4.5)
    }
    for (const hex of categoricalPalette.dark.slice(0, CATEGORICAL_CVD_SAFE_MAX)) {
      expect(onWhite(hex), `dark ${hex} white-text contrast`).toBeGreaterThanOrEqual(3.5)
    }
  })
})

describe('getCategoricalColor', () => {
  it('returns default-variant colors by index', () => {
    expect(getCategoricalColor(0)).toBe(categoricalPalette.default[0])
    expect(getCategoricalColor(4)).toBe(categoricalPalette.default[4])
  })

  it('selects the requested variant', () => {
    expect(getCategoricalColor(2, 'dark')).toBe(categoricalPalette.dark[2])
    expect(getCategoricalColor(1, 'dark')).toBe(categoricalPalette.dark[1])
  })

  it('wraps past the end of the palette', () => {
    expect(getCategoricalColor(7)).toBe(categoricalPalette.default[0])
    expect(getCategoricalColor(9)).toBe(categoricalPalette.default[2])
  })

  it('clamps negative and fractional indices', () => {
    expect(getCategoricalColor(-3)).toBe(categoricalPalette.default[0])
    expect(getCategoricalColor(2.9)).toBe(categoricalPalette.default[2])
  })
})

const relLum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const bestContrast = (hex: string) => {
  const l = relLum(hex)
  return Math.max((l + 0.05) / 0.05, 1.05 / (l + 0.05))
}

describe('divergingScale', () => {
  it('is a five-stop diverging scale of uppercase hex', () => {
    expect(divergingScale).toHaveLength(5)
    for (const hex of divergingScale) expect(hex).toMatch(HEX6)
  })

  it('has a light center and dark extremes (diverging shape)', () => {
    const L = divergingScale.map((h) => toOklab(hexToRgb(h).map(lin))[0])
    expect(L[2], 'optimal is the lightest').toBeGreaterThan(Math.max(L[0], L[4]))
    expect(L[0], 'under is dark').toBeLessThan(L[1])
    expect(L[4], 'over is dark').toBeLessThan(L[3])
  })

  it('holds a strong CVD floor (deltaE >= 10)', () => {
    let worst = Infinity
    for (let i = 0; i < divergingScale.length; i++) {
      for (let j = i + 1; j < divergingScale.length; j++) {
        worst = Math.min(worst, cvdDelta(divergingScale[i], divergingScale[j]))
      }
    }
    expect(worst).toBeGreaterThanOrEqual(10)
  })

  it('every cell carries a legible label via best-contrast text (>=4.5)', () => {
    for (const hex of divergingScale) {
      expect(bestContrast(hex), `${hex}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('sequentialEffort', () => {
  it('is a six-stop ordinal scale of uppercase hex', () => {
    expect(sequentialEffort).toHaveLength(6)
    for (const hex of sequentialEffort) expect(hex).toMatch(HEX6)
  })

  it('keeps adjacent stops distinguishable', () => {
    for (let i = 0; i < sequentialEffort.length - 1; i++) {
      expect(cvdDelta(sequentialEffort[i], sequentialEffort[i + 1]), `stop ${i}->${i + 1}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('every stop carries a legible label via best-contrast text (>=4.5)', () => {
    for (const hex of sequentialEffort) {
      expect(bestContrast(hex), `${hex}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('bestTextColor', () => {
  it('picks black on light fills and white on dark fills', () => {
    expect(bestTextColor(primitiveRamps.green[300])).toBe('#000000')
    expect(bestTextColor(primitiveRamps.red[700])).toBe('#FFFFFF')
    expect(bestTextColor(primitiveRamps.blue[700])).toBe('#FFFFFF')
  })
})
