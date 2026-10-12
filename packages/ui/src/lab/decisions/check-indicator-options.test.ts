import { describe, expect, it } from 'vitest'
import {
  CHECK_OPTIONS,
  MODES,
  NON_TEXT_FLOOR,
  PLANES,
  measureCheck,
  type CheckOptionKey,
} from './check-indicator-options'

// Ratios as the story prints them: [indicator / box, checked box / plane, unchecked border / plane].
type Row = [number, number, number]
const FILLED: Record<string, Row> = {
  'light background-base': [2.63, 1.73, 3.21],
  'light surface-base': [2.63, 2.19, 4.07],
  'dark background-base': [6.66, 6.66, 4.83],
  'dark surface-base': [6.66, 5.96, 4.32],
}
const PINNED: Record<CheckOptionKey, Record<string, Row>> = {
  current: FILLED,
  squaredRadio: FILLED,
  strokeCheck: FILLED,
  hollowSquare: {
    'light background-base': [4.76, 4.76, 3.21],
    'light surface-base': [6.04, 6.04, 4.07],
    'dark background-base': [6.66, 6.66, 4.83],
    'dark surface-base': [5.96, 5.96, 4.32],
  },
  outlineCheck: {
    'light background-base': [11.63, 3.21, 3.21],
    'light surface-base': [14.76, 4.07, 4.07],
    'dark background-base': [16.25, 4.83, 4.83],
    'dark surface-base': [14.54, 4.32, 4.32],
  },
}

const option = (key: CheckOptionKey) => CHECK_OPTIONS.find((o) => o.key === key)!

function measuredRow(key: CheckOptionKey, cell: string): Row {
  const [mode, plane] = cell.split(' ') as [(typeof MODES)[number], (typeof PLANES)[number]]
  const m = measureCheck(option(key), mode, plane)
  return [m.indicator, m.box, m.unchecked]
}

describe('check-indicator options', () => {
  for (const [key, cells] of Object.entries(PINNED)) {
    it.each(Object.entries(cells))(`prints the pinned ${key} ratios on %s`, (cell, row) => {
      expect(measuredRow(key as CheckOptionKey, cell)).toEqual(row)
    })
  }

  it('fails the non-text floor in light for every brand-filled option, on both planes', () => {
    for (const o of CHECK_OPTIONS.filter((c) => c.isFilled))
      for (const plane of PLANES) {
        const m = measureCheck(o, 'light', plane)
        expect(m.indicator).toBeLessThan(NON_TEXT_FLOOR)
        expect(m.box).toBeLessThan(NON_TEXT_FLOOR)
      }
  })

  it('clears the non-text floor everywhere for the hollow options', () => {
    for (const o of CHECK_OPTIONS.filter((c) => !c.isFilled))
      for (const mode of MODES)
        for (const plane of PLANES) {
          const m = measureCheck(o, mode, plane)
          expect(m.indicator).toBeGreaterThanOrEqual(NON_TEXT_FLOOR)
          expect(m.box).toBeGreaterThanOrEqual(NON_TEXT_FLOOR)
        }
  })
})
