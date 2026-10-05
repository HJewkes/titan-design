import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import { Animated } from 'react-native'
import * as stories from './MesoCard.stories'
import { MesoCard, type MesoCardProps } from './MesoCard'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const { Collapsed, Highlighted, Interactive } = composed
const storyEntries = Object.entries(composed)

const base = Collapsed.args as MesoCardProps

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const fixtures: [string, Partial<MesoCardProps>][] = [
  ['static (no onToggle)', { onToggle: undefined }],
  ['toggle', { onToggle: () => {} }],
  ['empty heatmap', { volumeHeatmap: [] }],
  [
    'clamped heatmap',
    {
      volumeHeatmap: [-10, 0, 63, 100, 150].map((percentage, i) => ({
        group: `g${i}`,
        percentage,
      })),
    },
  ],
  ['expanded with no weeks', { expanded: true, weeks: [] }],
  [
    'expanded weeks without totalWeeks or isCurrent',
    {
      expanded: true,
      currentWeek: 2,
      totalWeeks: 6,
      weeks: [1, 2, 3].map((weekNumber) => ({
        weekNumber,
        workouts: [{ name: 'Upper', status: 'upcoming' as const }],
        intensityLevel: 0.5,
      })),
    },
  ],
  [
    'expanded weeks with explicit totalWeeks and isCurrent',
    {
      expanded: true,
      currentWeek: 1,
      weeks: [{ weekNumber: 2, totalWeeks: 9, isCurrent: true, workouts: [], intensityLevel: 0.9 }],
    },
  ],
  ['custom className', { className: 'mt-4' }],
]

describe('MesoCard characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    const wrap = (element: ReactElement) => <Surface theme={theme}>{element}</Surface>

    it.each(storyEntries)('renders the %s story unchanged', (_name, Story) => {
      expectUnchanged(render(wrap(<Story />)).container)
    })

    it('renders the Interactive story expanded then collapsed', () => {
      const { container } = render(wrap(<Interactive />))
      fireEvent.click(screen.getByTestId('meso-card-toggle'))
      expectUnchanged(container)
      fireEvent.click(screen.getByTestId('meso-card-toggle'))
      expectUnchanged(container)
    })

    it.each(fixtures)('renders the %s fixture unchanged', (_name, overrides) => {
      expectUnchanged(render(wrap(<MesoCard {...base} {...overrides} />)).container)
    })

    it('animates the highlight off', () => {
      const { container, rerender } = render(wrap(<Highlighted />))
      rerender(wrap(<Highlighted highlighted={false} />))
      expectUnchanged(container)
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expectUnchanged(container)
    })

    // The interpolated border never reaches the jsdom DOM, so its range is recorded directly.
    it('interpolates the border from the hairline to brand primary', () => {
      const interpolate = vi.spyOn(Animated.Value.prototype, 'interpolate')
      render(wrap(<Highlighted />))
      expect(interpolate.mock.calls).toMatchSnapshot()
      interpolate.mockRestore()
    })

    it('animates the highlight on', () => {
      const { container, rerender } = render(wrap(<Highlighted highlighted={false} />))
      rerender(wrap(<Highlighted />))
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expectUnchanged(container)
    })
  })
})
