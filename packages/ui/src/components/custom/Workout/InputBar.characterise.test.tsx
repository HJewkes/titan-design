import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import * as stories from './InputBar.stories'
import { InputBar, type InputBarProps } from './InputBar'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const { Default } = composed
const storyEntries = Object.entries(composed)

const base = Default.args as InputBarProps

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const fixtures: [string, Partial<InputBarProps>][] = [
  ['hidden', { visible: false }],
  ['no total sets', { totalSets: null, setNumber: 3 }],
  ['cannot record', { canRecord: false }],
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

describe('InputBar characterisation', () => {
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
      expectUnchanged(render(wrap(<InputBar {...base} {...overrides} />)).container)
    })

    it('renders a typed reps value after a change', () => {
      const onRepsChange = vi.fn()
      const { container, rerender } = render(
        wrap(<InputBar {...base} onRepsChange={onRepsChange} />)
      )
      const reps = screen.getByTestId('input-bar-reps')
      reps.focus()
      fireEvent.change(reps, { target: { value: '7' } })
      expect(onRepsChange).toHaveBeenCalledWith('7')
      rerender(wrap(<InputBar {...base} onRepsChange={onRepsChange} reps="7" />))
      expectUnchanged(container)
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
