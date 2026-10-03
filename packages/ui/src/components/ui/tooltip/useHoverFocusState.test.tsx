import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Pressable, Text } from 'react-native'
import { axe } from 'jest-axe'
import { useHoverFocusState, type HoverFocusStateOptions } from './index'

function HoverCard({ onPress, ...options }: HoverFocusStateOptions & { onPress?: () => void }) {
  const { isOpen, triggerProps } = useHoverFocusState(options)
  return (
    <>
      <Pressable accessibilityRole="button" testID="trigger" onPress={onPress} {...triggerProps}>
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

  it('stays open while focused when the pointer moves over and off the trigger', () => {
    render(<HoverCard />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.focus(trigger)

    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('stays open while focused when the trigger is pressed and released', () => {
    const onPress = vi.fn()
    render(<HoverCard onPress={onPress} />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.focus(trigger)

    fireEvent.mouseDown(trigger, { button: 0, detail: 1 })
    fireEvent.mouseUp(trigger, { button: 0, detail: 1 })
    fireEvent.click(trigger, { button: 0, detail: 1 })

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('closes on blur once the pointer has already left', () => {
    render(<HoverCard />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.focus(trigger)
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)

    fireEvent.blur(trigger)

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('stays open while hovered when focus leaves', () => {
    render(<HoverCard />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseEnter(trigger)
    fireEvent.focus(trigger)

    fireEvent.blur(trigger)

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('never reports an open that was still pending at unmount', () => {
    const onOpenChange = vi.fn()
    const { unmount } = render(<HoverCard openDelay={300} onOpenChange={onOpenChange} />)
    fireEvent.focus(screen.getByTestId('trigger'))

    unmount()
    act(() => vi.advanceTimersByTime(300))

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('cancels a pending open when it becomes disabled', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<HoverCard openDelay={300} onOpenChange={onOpenChange} />)
    fireEvent.focus(screen.getByTestId('trigger'))

    rerender(<HoverCard openDelay={300} onOpenChange={onOpenChange} isDisabled />)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.queryByText('Card')).toBeNull()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes an open card when it becomes disabled', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<HoverCard onOpenChange={onOpenChange} />)
    fireEvent.focus(screen.getByTestId('trigger'))

    rerender(<HoverCard onOpenChange={onOpenChange} isDisabled />)

    expect(screen.queryByText('Card')).toBeNull()
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  it('has no accessibility violations while open', async () => {
    vi.useRealTimers()
    const { container } = render(<HoverCard />)
    fireEvent.focus(screen.getByTestId('trigger'))

    expect(await axe(container)).toHaveNoViolations()
  })
})
