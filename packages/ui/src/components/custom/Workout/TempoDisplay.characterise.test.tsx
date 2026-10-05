import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import * as stories from './TempoDisplay.stories'
import { TempoDisplay, type TempoDisplayProps } from './TempoDisplay'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const { Prescription, LiveAnimated, LivePlayground } = composed
const storyEntries = Object.entries(composed)

const base: TempoDisplayProps = { tempo: [3, 1, 2, 2] }

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const fixtures: [string, Partial<TempoDisplayProps>][] = [
  ['small', { size: 'sm' }],
  ['font size 40', { fontSize: 40 }],
  ['no label', { showLabel: false }],
  ['idle live', { live: { activePhase: null, phaseElapsedMs: 0 } }],
  ['running with completed omitted', { live: { activePhase: 'concentric', phaseElapsedMs: 900 } }],
  [
    'finished rep',
    {
      live: {
        activePhase: 'pauseTop',
        phaseElapsedMs: 2100,
        completed: { eccentric: 3200, pauseBottom: 700, concentric: 2000 },
      },
    },
  ],
  [
    'zero phase counting up',
    {
      tempo: [2, 0, 1.25, 0],
      liveReadout: 'countup',
      live: { activePhase: 'pauseTop', phaseElapsedMs: 400, completed: { eccentric: 1900 } },
    },
  ],
  ['custom className', { className: 'mt-2' }],
]

// The demo's cycle is 9200 ms, so the last step lands one rep later with the row reset.
const liveSteps = [1500, 1900, 2600, 3300]

const stubMatchMedia = (reduce: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )

describe('TempoDisplay characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    const wrap = (element: ReactElement) => <Surface theme={theme}>{element}</Surface>

    it.each(storyEntries)('renders the %s story unchanged', (_name, Story) => {
      expectUnchanged(render(wrap(<Story />)).container)
    })

    it.each([
      ['LiveAnimated', LiveAnimated],
      ['LivePlayground', LivePlayground],
    ] as const)('steps the %s demo through a rep', (_name, Story) => {
      const { container } = render(wrap(<Story />))
      expectUnchanged(container)
      for (const step of liveSteps) {
        act(() => {
          vi.advanceTimersByTime(step)
        })
        expectUnchanged(container)
      }
    })

    it.each(fixtures)('renders the %s fixture unchanged', (_name, overrides) => {
      expectUnchanged(render(wrap(<TempoDisplay {...base} {...overrides} />)).container)
    })

    it('opens the tooltip on press', () => {
      const onPress = vi.fn()
      const { container } = render(wrap(<TempoDisplay {...base} onPress={onPress} />))
      fireEvent.click(screen.getByTestId('tempo-display'))
      expect(onPress).toHaveBeenCalledTimes(1)
      expectUnchanged(container)
    })

    it('keeps the tooltip closed when showInfo is false', () => {
      const { container } = render(wrap(<TempoDisplay {...base} showInfo={false} />))
      fireEvent.click(screen.getByTestId('tempo-display'))
      expect(screen.queryByTestId('tempo-tooltip')).toBeNull()
      expectUnchanged(container)
    })
  })

  it('renders the Prescription story the same with and without reduced motion', () => {
    stubMatchMedia(false)
    const noPreference = render(<Prescription />)
    const html = noPreference.container.innerHTML
    noPreference.unmount()
    stubMatchMedia(true)
    expect(render(<Prescription />).container.innerHTML).toBe(html)
    expect(html).toMatchSnapshot()
  })
})
