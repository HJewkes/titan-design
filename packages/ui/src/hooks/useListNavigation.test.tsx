import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useListNavigation, type ListNavigationOptions } from './useListNavigation'

expect.extend(toHaveNoViolations)

const LABELS = ['Copy', 'Delete', 'Duplicate']

type HarnessProps = Partial<Omit<ListNavigationOptions, 'count' | 'activeIndex'>> & {
  initialIndex?: number
}

function Harness({ initialIndex = 0, onActiveIndexChange, ...options }: HarnessProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const { onKeyDown, getItemProps } = useListNavigation({
    focusMode: 'roving',
    ...options,
    count: LABELS.length,
    activeIndex,
    onActiveIndexChange: (index) => {
      setActiveIndex(index)
      onActiveIndexChange?.(index)
    },
  })
  return (
    <View testID="list" role="menu" onKeyDown={onKeyDown}>
      {LABELS.map((label, index) => (
        <Pressable key={label} role="menuitem" {...getItemProps(index)}>
          <Text>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function HostDriven({ activeIndex }: { activeIndex: number }) {
  const { onKeyDown, getItemProps } = useListNavigation({
    focusMode: 'roving',
    count: LABELS.length,
    activeIndex,
    onActiveIndexChange: () => {},
  })
  return (
    <View role="menu" {...{ onKeyDown }}>
      {LABELS.map((label, index) => (
        <Pressable key={label} role="menuitem" {...getItemProps(index)}>
          <Text>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const items = () => screen.getAllByRole('menuitem')
const tabStops = () => items().filter((item) => item.getAttribute('tabindex') === '0')

describe('useListNavigation, roving', () => {
  it('moves DOM focus to the next item on ArrowDown and keeps one tab stop', () => {
    render(<Harness />)
    act(() => items()[0].focus())

    fireEvent.keyDown(items()[0], { key: 'ArrowDown' })

    expect(items()[1]).toHaveFocus()
    expect(tabStops()).toEqual([items()[1]])
  })

  it('starts with exactly one tab stop on the active item', () => {
    render(<Harness initialIndex={2} />)

    expect(tabStops()).toEqual([items()[2]])
  })

  it('puts the tab stop on the first enabled item when none is active', () => {
    render(<Harness initialIndex={-1} isDisabled={(index) => index === 0} />)

    expect(tabStops()).toEqual([items()[1]])
  })

  it('does not move focus on first render', () => {
    render(<Harness initialIndex={1} />)

    expect(document.body).toHaveFocus()
  })

  it('leaves focus outside the list when the host changes the active index', () => {
    const list = (activeIndex: number) => (
      <>
        <Pressable testID="outside" />
        <HostDriven activeIndex={activeIndex} />
      </>
    )
    const { rerender } = render(list(0))
    const outside = screen.getByTestId('outside')
    act(() => outside.focus())

    rerender(list(2))

    expect(outside).toHaveFocus()
  })

  it('leaves focus outside the list when the host later applies a key it ignored', () => {
    const list = (activeIndex: number) => (
      <>
        <Pressable testID="outside" />
        <HostDriven activeIndex={activeIndex} />
      </>
    )
    const { rerender } = render(list(0))
    act(() => items()[0].focus())
    fireEvent.keyDown(items()[0], { key: 'ArrowDown' })
    const outside = screen.getByTestId('outside')
    act(() => outside.focus())

    rerender(list(1))

    expect(outside).toHaveFocus()
  })

  it('follows a host change of the active index while focus is on an item', () => {
    const { rerender } = render(<HostDriven activeIndex={0} />)
    act(() => items()[0].focus())

    rerender(<HostDriven activeIndex={2} />)

    expect(items()[2]).toHaveFocus()
  })

  it('wraps from the last item to the first', () => {
    render(<Harness initialIndex={2} />)
    act(() => items()[2].focus())

    fireEvent.keyDown(items()[2], { key: 'ArrowDown' })

    expect(items()[0]).toHaveFocus()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useListNavigation, virtual', () => {
  it('reports the next index on ArrowDown without moving DOM focus', () => {
    const onActiveIndexChange = vi.fn()
    render(<Harness focusMode="virtual" onActiveIndexChange={onActiveIndexChange} />)
    const list = screen.getByTestId('list')

    fireEvent.keyDown(list, { key: 'ArrowDown' })

    expect(onActiveIndexChange).toHaveBeenCalledWith(1)
    expect(document.body).toHaveFocus()
  })

  it('makes no item a tab stop', () => {
    render(<Harness focusMode="virtual" />)

    expect(tabStops()).toEqual([])
  })
})

describe('useListNavigation, keys', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('prevents the default action for handled keys only', () => {
    render(<Harness getLabel={(index) => LABELS[index]} />)
    const list = screen.getByTestId('list')

    const handled = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'd']
    // Space before any typing: it reaches the item's own press, not typeahead.
    const unhandled = ['Tab', 'Escape', 'ArrowRight', ' ']

    for (const key of unhandled) expect(fireEvent.keyDown(list, { key })).toBe(true)
    for (const key of handled) expect(fireEvent.keyDown(list, { key })).toBe(false)
  })

  it('ignores printable keys when no getLabel is given', () => {
    const onActiveIndexChange = vi.fn()
    render(<Harness onActiveIndexChange={onActiveIndexChange} />)

    expect(fireEvent.keyDown(screen.getByTestId('list'), { key: 'd' })).toBe(true)
    expect(onActiveIndexChange).not.toHaveBeenCalled()
  })

  it('focuses the item whose label matches the typed prefix', () => {
    vi.useFakeTimers()
    render(<Harness getLabel={(index) => LABELS[index]} />)
    const list = screen.getByTestId('list')
    act(() => items()[0].focus())

    fireEvent.keyDown(list, { key: 'd' })
    fireEvent.keyDown(list, { key: 'u' })

    expect(items()[2]).toHaveFocus()
  })
})
