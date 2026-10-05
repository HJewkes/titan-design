import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import * as stories from './RestTimer.stories'
import { RestTimer, type RestTimerProps } from './RestTimer'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const { Default } = composed
const storyEntries = Object.entries(composed)

const base = Default.args as RestTimerProps

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const fixtures: [string, Partial<RestTimerProps>][] = [
  ['finished', { elapsedMs: 150_000 }],
  ['overrun', { elapsedMs: 160_000 }],
  ['zero duration', { totalSeconds: 0, elapsedMs: 0 }],
  ['display only', { displayOnly: true, nextSetInfo: 'Squat — Set 2 of 5' }],
  ['hidden', { visible: false }],
  ['ring without next set', { variant: 'ring' }],
  ['ring display only with next set', { variant: 'ring', displayOnly: true, nextSetInfo: 'Row' }],
]

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

describe('RestTimer characterisation', () => {
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

    it.each(fixtures)('renders the %s fixture unchanged', (_name, overrides) => {
      expectUnchanged(render(wrap(<RestTimer {...base} {...overrides} />)).container)
    })

    it('renders a running countdown at two elapsed times', () => {
      const { container, rerender } = render(wrap(<RestTimer {...base} elapsedMs={30_000} />))
      expectUnchanged(container)
      rerender(wrap(<RestTimer {...base} elapsedMs={31_000} />))
      expectUnchanged(container)
    })

    it('holds still while paused', () => {
      const { container, rerender } = render(wrap(<RestTimer {...base} elapsedMs={30_000} />))
      const paused = container.innerHTML
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      rerender(wrap(<RestTimer {...base} elapsedMs={30_000} />))
      expect(container.innerHTML).toBe(paused)
    })
  })

  it('renders the Default story the same with and without reduced motion', () => {
    stubMatchMedia(false)
    const noPreference = render(<Default />)
    const html = noPreference.container.innerHTML
    noPreference.unmount()
    stubMatchMedia(true)
    expect(render(<Default />).container.innerHTML).toBe(html)
    expect(html).toMatchSnapshot()
  })
})
