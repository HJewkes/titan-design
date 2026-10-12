import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Surface } from '../../components/ui/surface'
import {
  AlertSolidOptions,
  OPTIONS,
  TONES,
  formatMeasurement,
  measureOption,
  type OptionKey,
} from './alert-solid-options'

const OPTION_KEYS = Object.keys(OPTIONS) as OptionKey[]

describe('Alert solid label options (lab)', () => {
  it.each([
    ['white-paper', 'dark', [9.07, 5.6, 9.64, 4.59]],
    ['white-paper', 'light', [4.56, 3.12, 3.63, 4.57]],
    ['ramp-light-paper', 'dark', [1.82, 2.91, 1.69, 3.54]],
    ['ramp-light-paper', 'light', [4.3, 2.91, 3.38, 4.24]],
    ['ramp-dark-paper', 'dark', [6.95, 4.39, 7.65, 3.73]],
    ['ramp-dark-paper', 'light', [2.94, 4.39, 3.83, 3.12]],
    ['dark-flat', 'dark', [9.07, 5.6, 9.64, 4.59]],
    ['dark-flat', 'light', [3.84, 5.6, 4.83, 3.83]],
  ] as const)('measures %s in %s as success, info, warning, error', (option, mode, expected) => {
    const ratios = measureOption(OPTIONS[option], mode).map((m) => Number(m.ratio.toFixed(2)))
    expect(ratios).toEqual(expected)
  })

  it('shares the dark-end label between the regular and debossed paper options', () => {
    expect(measureOption(OPTIONS['ramp-dark-paper-deboss'], 'light')).toEqual(
      measureOption(OPTIONS['ramp-dark-paper'], 'light')
    )
  })

  it('names the verdict the label and the glyph each need', () => {
    const light = measureOption(OPTIONS['white-paper'], 'light')
    expect(light.map((m) => m.verdict)).toEqual(['AA', 'large text only', 'large text only', 'AA'])
    expect(measureOption(OPTIONS['ramp-light-paper'], 'dark')[0].verdict).toBe('below 3:1')
  })

  it.each(OPTION_KEYS)('captions every tone of %s with its measured ratio', (option) => {
    render(
      <Surface theme="light">
        <AlertSolidOptions option={option} />
      </Surface>
    )
    expect(screen.getAllByRole('alert')).toHaveLength(TONES.length)
    for (const measurement of measureOption(OPTIONS[option], 'light')) {
      expect(screen.getByText(formatMeasurement(measurement))).toBeInTheDocument()
    }
  })
})
