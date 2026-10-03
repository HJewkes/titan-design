import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Pressable, Text } from 'react-native'
import { axe } from 'jest-axe'
import { useHoverFocusState, type HoverFocusStateOptions } from './index'

function HoverCard(options: HoverFocusStateOptions) {
  const { isOpen, triggerProps } = useHoverFocusState(options)
  return (
    <>
      <Pressable accessibilityRole="button" testID="trigger" {...triggerProps}>
        <Text>Agent</Text>
      </Pressable>
      {isOpen && <Text>Card</Text>}
    </>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useHoverFocusState', () => {
  it('opens on keyboard focus only after the open delay', () => {
    render(<HoverCard openDelay={300} />)

    fireEvent.focus(screen.getByTestId('trigger'))
    act(() => vi.advanceTimersByTime(299))
    expect(screen.queryByText('Card')).toBeNull()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('opens on hover after the open delay', () => {
    render(<HoverCard openDelay={300} />)

    fireEvent.mouseEnter(screen.getByTestId('trigger'))
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('closes on blur after the close delay', () => {
    render(<HoverCard closeDelay={200} />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.focus(trigger)

    fireEvent.blur(trigger)
    expect(screen.getByText('Card')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('closes at once on Escape, ignoring the close delay', () => {
    render(<HoverCard closeDelay={200} />)
    fireEvent.focus(screen.getByTestId('trigger'))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('ignores keys other than Escape', () => {
    render(<HoverCard />)
    fireEvent.focus(screen.getByTestId('trigger'))

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('stays closed on focus while disabled', () => {
    render(<HoverCard isDisabled />)

    fireEvent.focus(screen.getByTestId('trigger'))

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('reports focus, Escape and default state through onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(<HoverCard defaultIsOpen onOpenChange={onOpenChange} />)
    expect(screen.getByText('Card')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.focus(screen.getByTestId('trigger'))

    expect(onOpenChange.mock.calls).toEqual([[false], [true]])
  })

  it('has no accessibility violations while open', async () => {
    vi.useRealTimers()
    const { container } = render(<HoverCard />)
    fireEvent.focus(screen.getByTestId('trigger'))

    expect(await axe(container)).toHaveNoViolations()
  })
})
