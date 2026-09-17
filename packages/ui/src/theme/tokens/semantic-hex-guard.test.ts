import { describe, it, expect } from 'vitest'
import { semanticColorsLight, semanticColorsDark, getSemanticColors } from './semantic'
import {
  primitiveColors,
  primitiveRamps,
  greyRamp,
  discreteRainbow,
  alertRedVivid,
  resultPaletteColors,
  semanticPins,
} from './primitives'

/**
 * Guard (VW-83): every hex-looking semantic token value must be a `primitiveRamps`
 * step or a named primitive from `./primitives` — never a literal typed straight
 * into `semantic.ts`. Scoped to hex values only: the many `rgba(...)` alpha
 * overlays in this file are hand-composited, pre-existing, and out of scope for
 * this ticket (which is about raw HEX occurrences).
 *
 * Deep-equal against the primitives module (not a regex on shape) so a future
 * hex that happens to be well-formed but unbacked by any primitive still fails.
 */
const HEX = /^#[0-9A-Fa-f]{3,8}$/

const allowedHexValues = new Set(
  [
    ...Object.values(primitiveColors),
    ...Object.values(greyRamp),
    ...Object.values(primitiveRamps).flatMap((hue) => Object.values(hue)),
    ...discreteRainbow,
    alertRedVivid,
    ...Object.values(resultPaletteColors),
    ...Object.values(semanticPins),
  ]
    .filter((v): v is string => HEX.test(v))
    .map((v) => v.toLowerCase())
)

function hexEntries(colors: Record<string, string>): [string, string][] {
  return Object.entries(colors).filter(([, value]) => HEX.test(value))
}

describe('semantic token hex guard (VW-83)', () => {
  it('has hex tokens to check in both modes (sanity: the guard is not vacuous)', () => {
    expect(hexEntries(semanticColorsLight).length).toBeGreaterThan(0)
    expect(hexEntries(semanticColorsDark).length).toBeGreaterThan(0)
  })

  it('resolves every light-mode hex token to a ramp step or a named primitive', () => {
    for (const [token, value] of hexEntries(semanticColorsLight)) {
      expect(allowedHexValues.has(value.toLowerCase()), `light '${token}': ${value}`).toBe(true)
    }
  })

  it('resolves every dark-mode hex token to a ramp step or a named primitive', () => {
    for (const [token, value] of hexEntries(semanticColorsDark)) {
      expect(allowedHexValues.has(value.toLowerCase()), `dark '${token}': ${value}`).toBe(true)
    }
  })
})

/**
 * Resolved values captured from `main` (pre-VW-83), before any semantic.ts
 * literal was replaced by a ramp step or a named primitive. The migration must
 * not change what any token paints — only where its value comes from.
 *
 * AMENDED by AW-133, which is NOT a refactor and does change what some tokens
 * paint. Splitting text-on-subtle from the base tone token added the six
 * `on-*-subtle` entries, and rebased three dark `-subtle` fills onto the hue
 * their label now uses (`brand-secondary`, `status-error`, `status-info`). Those
 * deltas are deliberate and reviewed; everything else here is still the
 * pre-migration pin. Treat a diff against this fixture as a question to answer,
 * not a number to refresh — regenerating it wholesale defeats the guard.
 *
 * AMENDED AGAIN by AW-141: six `*-solid` entries added, and the six dark-mode
 * `on-*` labels flipped from white to `greyRamp[950]`. White cleared AA on none
 * of the four bright solid fills — warning measured 1.82. Light mode is
 * untouched and still aliases its base tone.
 *
 * AMENDED AGAIN by VW-371 phase 1, which is purely additive: the 18 `dataviz-*`
 * entries promote the three chart palettes to semantic roles. No pre-existing
 * entry moved — the new keys carry the primitives' current values verbatim, in
 * both modes. `dataviz-palettes.test.ts` pins them to the primitive arrays.
 */
const resolvedBeforeFixture = {
  light: {
    'brand-primary': '#FF7900',
    'brand-primary-light': '#FFA063',
    'brand-primary-dark': '#DA5F00',
    'brand-primary-subtle': 'rgba(255, 121, 0, 0.08)',
    'brand-primary-muted': 'rgba(255, 121, 0, 0.30)',
    'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
    'brand-primary-hover': '#DA5F00',
    'brand-primary-active': '#B94A00',
    'brand-secondary': '#307B9B',
    'brand-secondary-light': '#2697B7',
    'brand-secondary-dark': '#2A617F',
    'brand-secondary-subtle': 'rgba(48, 123, 155, 0.08)',
    'brand-secondary-muted': 'rgba(48, 123, 155, 0.30)',
    'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
    'brand-secondary-hover': '#2A617F',
    'brand-secondary-active': '#22465F',
    'on-brand-primary': '#FFFFFF',
    'on-brand-secondary': '#FFFFFF',
    'on-brand-primary-subtle': '#FF7900',
    'on-brand-secondary-subtle': '#307B9B',
    'status-success': '#2ED573',
    'status-success-light': '#58F69E',
    'status-success-dark': '#298732',
    'status-success-subtle': '#E3FFEE',
    'status-success-muted': 'rgba(46, 213, 115, 0.30)',
    'status-success-strong': 'rgba(46, 213, 115, 0.50)',
    'status-live': '#2ED573',
    'status-live-muted': '#22A444',
    'status-error': '#D14343',
    'status-error-light': '#E05254',
    'status-error-dark': '#A4221C',
    'status-error-subtle': '#FFF4F4',
    'status-error-muted': 'rgba(209, 67, 67, 0.30)',
    'status-error-strong': 'rgba(209, 67, 67, 0.50)',
    'status-error-vivid': '#FF4757',
    'status-error-vivid-light': '#E05254',
    'status-error-vivid-dark': '#A4221C',
    'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',
    'status-error-vivid-muted': 'rgba(255, 71, 87, 0.30)',
    'status-error-vivid-strong': 'rgba(255, 71, 87, 0.50)',
    'status-warning': '#F9B415',
    'status-warning-light': '#FFD352',
    'status-warning-dark': '#C27400',
    'status-warning-subtle': '#FFF7DD',
    'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
    'status-warning-strong': 'rgba(249, 180, 21, 0.50)',
    'status-info': '#2196F3',
    'status-info-light': '#78C2FF',
    'status-info-dark': '#1072CB',
    'status-info-subtle': '#EFF8FF',
    'status-info-muted': 'rgba(33, 150, 243, 0.30)',
    'status-info-strong': 'rgba(33, 150, 243, 0.50)',
    'on-status-success': '#FFFFFF',
    'on-status-error': '#FFFFFF',
    'on-status-warning': '#FFFFFF',
    'on-status-info': '#FFFFFF',
    'on-status-success-subtle': '#2ED573',
    'on-status-error-subtle': '#D14343',
    'on-status-warning-subtle': '#F9B415',
    'on-status-info-subtle': '#2196F3',
    'result-improve': '#4caf50',
    'result-improve-light': 'rgba(76, 175, 80, 0.12)',
    'result-improve-dark': '#248a24',
    'result-degrade': '#ef5350',
    'result-degrade-light': 'rgba(239, 83, 80, 0.12)',
    'result-degrade-dark': '#b30000',
    'result-inconclusive': '#9E9A97',
    'result-inconclusive-light': 'rgba(158, 154, 151, 0.12)',
    'result-neutral': '#72716F',
    'on-result-improve': '#FFFFFF',
    'on-result-degrade': '#FFFFFF',
    'on-result-inconclusive': '#FFFFFF',
    'data-1': '#1965B0',
    'data-2': '#4EB265',
    'data-3': '#F7F056',
    'data-4': '#DC050C',
    'data-5': '#882E72',
    'data-6': '#F4A736',
    'data-7': '#7BAFDE',
    'data-8': '#90C987',
    'data-9': '#CAACCB',
    'data-10': '#EE8026',
    'dataviz-diverging-0': '#2196F3',
    'dataviz-diverging-1': '#01B5D1',
    'dataviz-diverging-2': '#2ED573',
    'dataviz-diverging-3': '#E08C00',
    'dataviz-diverging-4': '#D14343',
    'dataviz-sequential-0': '#2ED573',
    'dataviz-sequential-1': '#F9B415',
    'dataviz-sequential-2': '#FF7900',
    'dataviz-sequential-3': '#DA5F00',
    'dataviz-sequential-4': '#A4221C',
    'dataviz-sequential-5': '#7E1002',
    'dataviz-categorical-0': '#2196F3',
    'dataviz-categorical-1': '#BA2996',
    'dataviz-categorical-2': '#D14343',
    'dataviz-categorical-3': '#FF7900',
    'dataviz-categorical-4': '#298732',
    'dataviz-categorical-5': '#01B5D1',
    'dataviz-categorical-6': '#A45E00',
    'text-primary': '#121828',
    'text-secondary': '#65748B',
    'text-tertiary': '#A29F9D',
    'text-disabled': 'rgba(55, 65, 81, 0.48)',
    'text-inverse': '#FFFFFF',
    'text-link': '#1072CB',
    'text-link-hover': '#135AA8',
    'surface-base': '#FFFFFF',
    'surface-elevated': '#F9F6F3',
    'surface-raised': '#EDEAE7',
    'surface-overlay': '#FFFFFF',
    'surface-input': '#F9F6F3',
    'background-base': '#EBEBEB',
    'background-default': '#FFFFFF',
    'background-subtle': '#F9F6F3',
    'background-frame': '#A29F9D',
    'border-prominent': '#A29F9D',
    'border-focus': '#1072CB',
    'border-input': '#D4D1CE',
    'border-input-hover': '#A29F9D',
    'border-input-focus': '#1072CB',
    'border-input-error': '#D14343',
    'hairline-subtle': 'rgba(0, 0, 0, 0.06)',
    'hairline-default': 'rgba(0, 0, 0, 0.09)',
    'hairline-strong': 'rgba(0, 0, 0, 0.14)',
    'scrim-press': 'rgba(0, 0, 0, 0.10)',
    'scrim-press-strong': 'rgba(0, 0, 0, 0.20)',
    'scrim-subtle': 'rgba(0, 0, 0, 0.30)',
    'scrim-default': 'rgba(0, 0, 0, 0.50)',
    'on-control-idle': '#D1D1D1',
    'on-control-active': '#FFFFFF',
    'on-data-strong': '#0B0B0B',
    'interactive-hover': 'rgba(55, 65, 81, 0.04)',
    'interactive-focus': 'rgba(55, 65, 81, 0.12)',
    'interactive-active': 'rgba(55, 65, 81, 0.16)',
    'interactive-selected': 'rgba(55, 65, 81, 0.08)',
    'interactive-disabled': 'rgba(55, 65, 81, 0.12)',
    'interactive-disabled-text': 'rgba(55, 65, 81, 0.26)',
    divider: '#E8E9EB',
    'avatar-background': '#72716F',
    'avatar-text': '#FFFFFF',
    'brand-primary-solid': '#FF7900',
    'brand-secondary-solid': '#307B9B',
    'status-success-solid': '#2ED573',
    'status-error-solid': '#D14343',
    'status-warning-solid': '#F9B415',
    'status-info-solid': '#2196F3',
  },
  dark: {
    'brand-primary': '#FF7900',
    'brand-primary-light': '#FFA063',
    'brand-primary-dark': '#DA5F00',
    'brand-primary-subtle': 'rgba(255, 121, 0, 0.12)',
    'brand-primary-muted': 'rgba(255, 121, 0, 0.30)',
    'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
    'brand-primary-hover': '#FFA063',
    'brand-primary-active': '#FFC7A2',
    'brand-secondary': '#307B9B',
    'brand-secondary-light': '#2697B7',
    'brand-secondary-dark': '#2A617F',
    'brand-secondary-subtle': 'rgba(34, 211, 238, 0.12)',
    'brand-secondary-muted': 'rgba(48, 123, 155, 0.30)',
    'brand-secondary-strong': 'rgba(48, 123, 155, 0.50)',
    'brand-secondary-hover': '#2697B7',
    'brand-secondary-active': '#01B5D1',
    'on-brand-primary': '#1C1916',
    'on-brand-secondary': '#1C1916',
    'on-brand-primary-subtle': '#FF7900',
    'on-brand-secondary-subtle': '#22D3EE',
    'status-success': '#2ED573',
    'status-success-light': '#58F69E',
    'status-success-dark': '#298732',
    'status-success-subtle': 'rgba(46, 213, 115, 0.12)',
    'status-success-muted': 'rgba(46, 213, 115, 0.30)',
    'status-success-strong': 'rgba(46, 213, 115, 0.50)',
    'status-live': '#2ED573',
    'status-live-muted': '#22A444',
    'status-error': '#D14343',
    'status-error-light': '#E05254',
    'status-error-dark': '#A4221C',
    'status-error-subtle': 'rgba(247, 113, 117, 0.08)',
    'status-error-muted': 'rgba(209, 67, 67, 0.30)',
    'status-error-strong': 'rgba(209, 67, 67, 0.50)',
    'status-error-vivid': '#FF4757',
    'status-error-vivid-light': '#E05254',
    'status-error-vivid-dark': '#A4221C',
    'status-error-vivid-subtle': 'rgba(255, 71, 87, 0.12)',
    'status-error-vivid-muted': 'rgba(255, 71, 87, 0.30)',
    'status-error-vivid-strong': 'rgba(255, 71, 87, 0.50)',
    'status-warning': '#F9B415',
    'status-warning-light': '#FFD352',
    'status-warning-dark': '#C27400',
    'status-warning-subtle': 'rgba(249, 180, 21, 0.12)',
    'status-warning-muted': 'rgba(249, 180, 21, 0.30)',
    'status-warning-strong': 'rgba(249, 180, 21, 0.50)',
    'status-info': '#2196F3',
    'status-info-light': '#78C2FF',
    'status-info-dark': '#1072CB',
    'status-info-subtle': 'rgba(120, 194, 255, 0.12)',
    'status-info-muted': 'rgba(33, 150, 243, 0.30)',
    'status-info-strong': 'rgba(33, 150, 243, 0.50)',
    'on-status-success': '#1C1916',
    'on-status-error': '#1C1916',
    'on-status-warning': '#1C1916',
    'on-status-info': '#1C1916',
    'on-status-success-subtle': '#2ED573',
    'on-status-error-subtle': '#F77175',
    'on-status-warning-subtle': '#F9B415',
    'on-status-info-subtle': '#78C2FF',
    'result-improve': '#4caf50',
    'result-improve-light': 'rgba(76, 175, 80, 0.16)',
    'result-improve-dark': '#248a24',
    'result-degrade': '#ef5350',
    'result-degrade-light': 'rgba(239, 83, 80, 0.16)',
    'result-degrade-dark': '#b30000',
    'result-inconclusive': '#9E9A97',
    'result-inconclusive-light': 'rgba(158, 154, 151, 0.16)',
    'result-neutral': '#A29F9D',
    'on-result-improve': '#FFFFFF',
    'on-result-degrade': '#FFFFFF',
    'on-result-inconclusive': '#FFFFFF',
    'data-1': '#1965B0',
    'data-2': '#4EB265',
    'data-3': '#F7F056',
    'data-4': '#DC050C',
    'data-5': '#882E72',
    'data-6': '#F4A736',
    'data-7': '#7BAFDE',
    'data-8': '#90C987',
    'data-9': '#CAACCB',
    'data-10': '#EE8026',
    'dataviz-diverging-0': '#2196F3',
    'dataviz-diverging-1': '#22D3EE',
    'dataviz-diverging-2': '#58F69E',
    'dataviz-diverging-3': '#F9B415',
    'dataviz-diverging-4': '#D14343',
    'dataviz-sequential-0': '#2ED573',
    'dataviz-sequential-1': '#FFD352',
    'dataviz-sequential-2': '#F9B415',
    'dataviz-sequential-3': '#FF7900',
    'dataviz-sequential-4': '#D14343',
    'dataviz-sequential-5': '#A4221C',
    'dataviz-categorical-0': '#2196F3',
    'dataviz-categorical-1': '#D548AF',
    'dataviz-categorical-2': '#E05254',
    'dataviz-categorical-3': '#FF7900',
    'dataviz-categorical-4': '#2ED573',
    'dataviz-categorical-5': '#22D3EE',
    'dataviz-categorical-6': '#A45E00',
    'text-primary': '#F9F6F3',
    'text-secondary': '#A29F9D',
    'text-tertiary': '#888684',
    'text-disabled': 'rgba(255, 255, 255, 0.38)',
    'text-inverse': '#1C1916',
    'text-link': '#828DF8',
    'text-link-hover': '#3CA8FF',
    'surface-base': '#252321',
    'surface-elevated': '#2C2A28',
    'surface-raised': '#31302F',
    'surface-overlay': '#373635',
    'surface-input': '#2C2A28',
    'background-base': '#1C1916',
    'background-default': '#252321',
    'background-subtle': '#2C2A28',
    'background-frame': '#100D0A',
    'border-prominent': '#424140',
    'border-focus': '#828DF8',
    'border-input': '#5A5958',
    'border-input-hover': '#72716F',
    'border-input-focus': '#828DF8',
    'border-input-error': '#E05254',
    'hairline-subtle': 'rgba(255, 255, 255, 0.10)',
    'hairline-default': 'rgba(255, 255, 255, 0.15)',
    'hairline-strong': 'rgba(255, 255, 255, 0.22)',
    'scrim-press': 'rgba(0, 0, 0, 0.10)',
    'scrim-press-strong': 'rgba(0, 0, 0, 0.20)',
    'scrim-subtle': 'rgba(0, 0, 0, 0.30)',
    'scrim-default': 'rgba(0, 0, 0, 0.50)',
    'on-control-idle': '#D1D1D1',
    'on-control-active': '#FFFFFF',
    'on-data-strong': '#0B0B0B',
    'interactive-hover': 'rgba(255, 255, 255, 0.04)',
    'interactive-focus': 'rgba(255, 255, 255, 0.12)',
    'interactive-active': 'rgba(255, 255, 255, 0.16)',
    'interactive-selected': 'rgba(255, 255, 255, 0.08)',
    'interactive-disabled': 'rgba(255, 255, 255, 0.12)',
    'interactive-disabled-text': 'rgba(255, 255, 255, 0.26)',
    divider: 'rgba(255, 255, 255, 0.09)',
    'avatar-background': '#5A5958',
    'avatar-text': '#FFFFFF',
    'brand-primary-solid': '#FF7900',
    'brand-secondary-solid': '#2697B7',
    'status-success-solid': '#2ED573',
    'status-error-solid': '#E05254',
    'status-warning-solid': '#F9B415',
    'status-info-solid': '#2196F3',
  },
} as const

describe('semantic token resolved values are unchanged by the hex migration (VW-83)', () => {
  it('matches the pre-migration fixture in light mode', () => {
    expect(getSemanticColors('light')).toEqual(resolvedBeforeFixture.light)
  })

  it('matches the pre-migration fixture in dark mode', () => {
    expect(getSemanticColors('dark')).toEqual(resolvedBeforeFixture.dark)
  })
})
