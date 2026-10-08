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
      {!!isOpen && <Text>Card</Text>}
    </>
  )
}

/** A pointer press as a browser orders it: the trigger takes focus between down and up. */
function pressWithPointer(element: Element) {
  fireEvent.mouseDown(element, { button: 0, detail: 1 })
  fireEvent.focus(element)
  fireEvent.mouseUp(element, { button: 0, detail: 1 })
  fireEvent.click(element, { button: 0, detail: 1 })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  // RNW's input modality is module-global; a mouse move ends the touch modality a tap test leaves.
  fireEvent.mouseMove(document)
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

  it('closes after a pointer press, even while the pointer stays over the trigger', () => {
    const onPress = vi.fn()
    render(<HoverCard onPress={onPress} />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseEnter(trigger)

    pressWithPointer(trigger)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Card')).toBeNull()
  })

  it('stays closed when the pointer leaves after a press that focused the trigger', () => {
    render(<HoverCard />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseEnter(trigger)
    pressWithPointer(trigger)

    fireEvent.mouseLeave(trigger)

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('stays open on keyboard focus, with no pointer, until Escape', () => {
    render(<HoverCard closeDelay={200} />)
    fireEvent.focus(screen.getByTestId('trigger'))

    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('Card')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('opens on a later keyboard focus after a right click that sent no press', () => {
    render(<HoverCard openDelay={300} />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseDown(trigger, { button: 2, detail: 1 })
    fireEvent.blur(trigger)

    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('opens on a later keyboard focus after a right click that focused nothing (Safari)', () => {
    render(<HoverCard openDelay={300} />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseDown(trigger, { button: 2, detail: 1 })
    fireEvent.contextMenu(trigger, { button: 2 })
    fireEvent.mouseUp(trigger, { button: 2, detail: 1 })

    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('removes its gesture listeners when unmounted mid-press', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<HoverCard />)
    fireEvent.mouseDown(screen.getByTestId('trigger'), { button: 0, detail: 1 })

    unmount()

    const removed = remove.mock.calls.map(([type]) => type)
    expect(removed).toEqual(expect.arrayContaining(['mouseup', 'contextmenu']))
    remove.mockRestore()
  })

  it('opens on a later keyboard focus after a quick click on a trigger with no onPress', () => {
    render(<HoverCard openDelay={300} />)
    const trigger = screen.getByTestId('trigger')
    pressWithPointer(trigger)
    fireEvent.blur(trigger)

    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('opens on a later keyboard focus after a touch tap', () => {
    render(<HoverCard openDelay={300} />)
    const trigger = screen.getByTestId('trigger')
    const touch = { identifier: 0, clientX: 0, clientY: 0 }
    fireEvent.touchStart(trigger, { touches: [touch], changedTouches: [touch] })
    fireEvent.touchEnd(trigger, { touches: [], changedTouches: [touch] })
    pressWithPointer(trigger)
    fireEvent.blur(trigger)

    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  // A guard, not a regression test: the shared-flag code also passed it.
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

  it('drops a hover hold when it becomes disabled, so a later blur still closes', () => {
    const { rerender } = render(<HoverCard />)
    const trigger = screen.getByTestId('trigger')
    fireEvent.mouseEnter(trigger)
    rerender(<HoverCard isDisabled />)
    rerender(<HoverCard />)

    fireEvent.focus(trigger)
    fireEvent.blur(trigger)

    expect(screen.queryByText('Card')).toBeNull()
  })

  it('starts closed and silent when disabled, despite defaultIsOpen', () => {
    const onOpenChange = vi.fn()

    render(<HoverCard defaultIsOpen isDisabled onOpenChange={onOpenChange} />)

    expect(screen.queryByText('Card')).toBeNull()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('has no accessibility violations while open', async () => {
    vi.useRealTimers()
    const { container } = render(<HoverCard />)
    fireEvent.focus(screen.getByTestId('trigger'))

    expect(await axe(container)).toHaveNoViolations()
  })
})
