import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pressable, Text } from 'react-native'

const layout = vi.hoisted(() => ({ width: null as number | null }))

// jsdom never lays out, so a test that needs real geometry pins the column width here.
vi.mock('../../../hooks/useMeasuredWidth', () => ({
  useMeasuredWidth: () => ({ width: layout.width, onLayout: () => undefined }),
}))

import { Shelf, type ShelfProps } from './Shelf'

const TITLES = ['Intro to snapping', 'Peek and nudge', 'Focus into view', 'Bleed into gutter']
const MORE = [...TITLES, 'Five', 'Six', 'Seven', 'Eight']

function renderShelf(props: Partial<ShelfProps> = {}, titles: string[] = TITLES) {
  return render(
    <Shelf label="Yesterday" itemWidth={240} {...props}>
      {titles.map((title) => (
        <Pressable key={title} accessibilityRole="button" accessibilityLabel={title}>
          <Text>{title}</Text>
        </Pressable>
      ))}
    </Shelf>
  )
}

const scroll = vi.fn()

beforeEach(() => {
  HTMLElement.prototype.scroll = scroll as unknown as typeof HTMLElement.prototype.scroll
})

afterEach(() => {
  layout.width = null
  scroll.mockReset()
})

describe('Shelf', () => {
  it('renders nothing without items, so the caller can show its own empty state', () => {
    const { container } = render(
      <Shelf label="Yesterday" itemWidth={240}>
        {[]}
        {null}
        {false}
      </Shelf>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('names the row and lists every item', () => {
    renderShelf()

    expect(screen.getByRole('group', { name: 'Yesterday' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('gives every item the resolved breakpoint width', () => {
    layout.width = 700
    renderShelf({ itemWidth: { xs: 200, sm: 264 } })

    for (const item of screen.getAllByRole('listitem')) expect(item).toHaveStyle({ width: '264px' })
  })

  it('shows only the forward nudge on a wide column whose row overflows', () => {
    layout.width = 1000
    renderShelf({}, MORE)

    expect(screen.getByRole('button', { name: 'More from Yesterday' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back in Yesterday' })).toBeNull()
  })

  it('hides the auto nudge below its breakpoint', () => {
    layout.width = 600
    renderShelf()

    expect(screen.queryByRole('button', { name: 'More from Yesterday' })).toBeNull()
  })

  it('shows the auto nudge from a lower breakpoint when asked', () => {
    layout.width = 600
    renderShelf({ nudgeFrom: 'sm' })

    expect(screen.getByRole('button', { name: 'More from Yesterday' })).toBeInTheDocument()
  })

  it('hides the nudge when every item fits', () => {
    layout.width = 1200
    renderShelf({ nudge: 'always' })

    expect(screen.queryByRole('button', { name: 'More from Yesterday' })).toBeNull()
  })

  it('never shows the nudge when turned off', () => {
    layout.width = 1000
    renderShelf({ nudge: 'never' }, MORE)

    expect(screen.queryByRole('button', { name: 'More from Yesterday' })).toBeNull()
  })

  it('moves the row by the items that fit in 0.8 of the column', () => {
    layout.width = 1000
    renderShelf({}, MORE)

    fireEvent.click(screen.getByRole('button', { name: 'More from Yesterday' }))

    // 0.8 × 1000 = 800 holds three 252px steps.
    expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ left: 756 }))
  })

  it('scrolls a cut-off item into view when it takes focus', () => {
    layout.width = 600
    renderShelf()

    fireEvent.focus(screen.getByRole('button', { name: 'Focus into view' }))

    expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ left: 396 }))
  })

  it('leaves the row still when a whole item takes focus', () => {
    layout.width = 600
    renderShelf()

    fireEvent.focus(screen.getByRole('button', { name: 'Peek and nudge' }))

    expect(scroll).not.toHaveBeenCalled()
  })

  it('has no accessibility violations with the nudge showing', async () => {
    layout.width = 1000
    const { container } = renderShelf({}, MORE)

    expect(await axe(container)).toHaveNoViolations()
  })
})
