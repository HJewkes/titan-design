import { describe, expect, it } from 'vitest'
import { darkThemeCSSVars, lightThemeCSSVars } from '../../theme/config'
import {
  FOCUS_OPTIONS,
  MODES,
  PLANES,
  SAMPLE_KEYS,
  measureRing,
  modeColorProperties,
  type FocusOptionKey,
} from './focus-ring-options'

// Ratios as the story prints them: [plane, button, input, chip, navItem, dateSeparator].
// The ring's component ratio against Button and Input does not move with the plane: both edges are opaque.
type Row = [number, number, number, number, null, number]
const PINNED: Record<Exclude<FocusOptionKey, 'twoTone'>, Record<string, Row>> = {
  current: {
    'light background-base': [4.08, 1.86, 1.35, 3.28, null, 2.9],
    'light surface-base': [4.89, 1.86, 1.35, 3.92, null, 3.47],
    'light surface-elevated': [4.55, 1.86, 1.35, 3.62, null, 3.22],
    'dark background-base': [5.93, 1.12, 1.23, 4.44, null, 3.72],
    'dark surface-base': [5.31, 1.12, 1.23, 3.9, null, 3.28],
    'dark surface-elevated': [4.84, 1.12, 1.23, 3.55, null, 2.99],
  },
  neutral: {
    'light background-base': [14.76, 6.73, 4.88, 11.84, null, 10.49],
    'light surface-base': [17.69, 6.73, 4.88, 14.18, null, 12.53],
    'light surface-elevated': [16.43, 6.73, 4.88, 13.09, null, 11.64],
    'dark background-base': [16.25, 2.44, 3.37, 12.18, null, 10.21],
    'dark surface-base': [14.54, 2.44, 3.37, 10.68, null, 9.01],
    'dark surface-elevated': [13.28, 2.44, 3.37, 9.73, null, 8.19],
  },
  brand: {
    'light background-base': [6.04, 2.75, 1.99, 4.84, null, 4.29],
    'light surface-base': [7.24, 2.75, 1.99, 5.8, null, 5.13],
    'light surface-elevated': [6.72, 2.75, 1.99, 5.35, null, 4.76],
    'dark background-base': [6.66, 1, 1.38, 4.99, null, 4.18],
    'dark surface-base': [5.96, 1, 1.38, 4.37, null, 3.69],
    'dark surface-elevated': [5.44, 1, 1.38, 3.98, null, 3.36],
  },
}

const option = (key: FocusOptionKey) => FOCUS_OPTIONS.find((o) => o.key === key)!

function measuredRow(key: FocusOptionKey, cell: string) {
  const [mode, plane] = cell.split(' ') as [(typeof MODES)[number], (typeof PLANES)[number]]
  const ratios = SAMPLE_KEYS.map((sample) => measureRing(option(key), mode, plane, sample))
  return [ratios[0].plane, ...ratios.map((r) => r.component)]
}

describe('focus-ring options', () => {
  for (const [key, cells] of Object.entries(PINNED)) {
    it.each(Object.entries(cells))(`prints the pinned ${key} ratios on %s`, (cell, row) => {
      expect(measuredRow(key as FocusOptionKey, cell)).toEqual(row)
    })
  }

  it('measures the two-tone ring as the brand ring it paints, with the plane as its gap', () => {
    for (const cell of Object.keys(PINNED.brand)) {
      expect(measuredRow('twoTone', cell)).toEqual(PINNED.brand[cell])
    }
  })

  it('clears 3:1 against every plane for every option', () => {
    for (const o of FOCUS_OPTIONS)
      for (const mode of MODES)
        for (const plane of PLANES)
          expect(measureRing(o, mode, plane, 'navItem').plane).toBeGreaterThanOrEqual(3)
  })

  it.each([
    ['light', lightThemeCSSVars],
    ['dark', darkThemeCSSVars],
  ] as const)('re-declares every %s colour property the theme declares', (mode, themeVars) => {
    // The `-rgb` channel triples are not semantic tokens and no sample reads them.
    const colorVars = Object.entries(themeVars).filter(
      ([name]) => name.startsWith('--color-') && !name.endsWith('-rgb')
    )
    expect(modeColorProperties(mode)).toEqual(Object.fromEntries(colorVars))
  })
})
