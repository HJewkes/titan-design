import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { loadComposedStories } from '../../../test/composed-stories'
import { Tooltip, type TooltipPlacement } from './Tooltip'

const stories = await loadComposedStories((file) => file === 'ui/tooltip/Tooltip.stories.tsx')

const placements: TooltipPlacement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'right',
]

const triggerRect = { top: 100, left: 200, bottom: 140, right: 280, width: 80, height: 40 }

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...triggerRect,
    x: triggerRect.left,
    y: triggerRect.top,
    toJSON: () => triggerRect,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Tooltip characterisation', () => {
  it('discovers the Tooltip stories', () => {
    expect(stories.length).toBeGreaterThan(0)
  })

  for (const { name, Story } of stories) {
    it(`story ${name}`, () => {
      const { container } = render(<Story />)
      expect(container).toMatchSnapshot()
    })
  }

  for (const placement of placements) {
    it(`open in flow at ${placement}`, () => {
      const { container } = render(
        <Tooltip label="Tip" placement={placement} isOpen className="extra">
          <Text>Trigger</Text>
        </Tooltip>
      )
      expect(container).toMatchSnapshot()
    })

    it(`open in a portal at ${placement}`, () => {
      render(
        <Tooltip label="Tip" placement={placement} usePortal isOpen className="extra">
          <Text>Trigger</Text>
        </Tooltip>
      )
      act(() => vi.runAllTimers())
      expect(document.body).toMatchSnapshot()
    })
  }

  it('open with rich content and no arrow', () => {
    const { container } = render(
      <Tooltip content={<Text>Rich</Text>} hasArrow={false} isOpen>
        <Text>Trigger</Text>
      </Tooltip>
    )
    expect(container).toMatchSnapshot()
  })

  it('opens on hover after the open delay and closes after the close delay', () => {
    const { container } = render(
      <Tooltip label="Delayed" openDelay={300} closeDelay={200}>
        <Text>Trigger</Text>
      </Tooltip>
    )
    const trigger = screen.getByText('Trigger').closest('[tabindex]') as HTMLElement
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByText('Delayed')).toBeTruthy()
    expect(container).toMatchSnapshot('open')
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByText('Delayed')).toBeNull()
    expect(container).toMatchSnapshot('closed')
  })
})
