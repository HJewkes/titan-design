/**
 * Its own file because react-native-web warns once per module instance: a render in another test
 * of the same file would spend the warning before this spy could see it.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SetBarChart } from './SetBarChart'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SetBarChart value labels and pointer events', () => {
  it('lets presses through the label without the deprecated pointerEvents prop', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <SetBarChart
        slots={[{ kind: 'rep', value: 0.8 }]}
        colorFor={() => '#C7CBD1'}
        height={200}
        showValueLabels
        testIDPrefix="t"
      />
    )
    const labelBox = screen.getByTestId('t-label-0').parentElement as HTMLElement

    expect(getComputedStyle(labelBox).pointerEvents).toBe('none')
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/pointerEvents is deprecated/)
  })
})
