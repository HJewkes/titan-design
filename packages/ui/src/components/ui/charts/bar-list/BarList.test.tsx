import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BarList } from './BarList'
import { barListFixtures, defaultFixture, veryLargeFixture, type BarListFixture } from './fixtures'

expect.extend(toHaveNoViolations)

const fixture = (name: string): BarListFixture => {
  const found = barListFixtures.find((f) => f.name === name)
  if (!found) throw new Error(`missing fixture ${name}`)
  return found
}

const renderFixture = (f: BarListFixture, props = {}) =>
  render(
    <BarList
      accessibilityLabel="Tool calls"
      rows={f.rows}
      max={f.max}
      sort={f.sort}
      maxRows={f.maxRows}
      layout={f.layout}
      {...props}
    />
  )

describe('BarList', () => {
  it('renders one list item per shown row and one overflow item', () => {
    renderFixture(defaultFixture)
    expect(screen.getAllByTestId('bar-list-row')).toHaveLength(10)
    expect(screen.getByTestId('bar-list-overflow')).toHaveTextContent('2 more · 3')
  })

  it('mounts at most maxRows + 1 rows for Very large', () => {
    renderFixture(veryLargeFixture)
    expect(screen.getAllByRole('listitem')).toHaveLength(11)
  })

  it("holds label, value, secondary and flag label in a row's accessible name", () => {
    const row = {
      id: 'p',
      label: 'Parser',
      value: 9.1,
      secondaryValue: 4,
      flag: { tone: 'error' as const, label: 'over 5%' },
    }
    render(
      <BarList accessibilityLabel="Errors" rows={[row]} formatSecondary={(v) => `${v} sessions`} />
    )
    expect(screen.getByRole('listitem')).toHaveAccessibleName(
      'Parser: 9.1, 4 sessions, over 5%, rank 1 of 1'
    )
  })

  it('hides bars from assistive tech and ends the list name with the summary', () => {
    renderFixture(defaultFixture)
    const list = screen.getByRole('list')
    expect(list).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^Tool calls\. Top 10 of 12 items/)
    )
    for (const fill of screen.getAllByTestId('bar-list-fill')) {
      expect(fill.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('lets summarize override the summary', () => {
    renderFixture(defaultFixture, { summarize: () => 'Custom summary.' })
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Tool calls. Custom summary.')
  })

  it('renders duplicate ids as two rows without a key warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderFixture(fixture('Hostile'))
    expect(screen.getAllByTestId('bar-list-row')).toHaveLength(6)
    expect(error.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false)
    error.mockRestore()
  })

  it('keeps the full label in the name for a long label', () => {
    const f = fixture('Long label')
    renderFixture(f)
    expect(screen.getByLabelText(new RegExp(`^${f.rows[0].label.trim()}`))).toBeInTheDocument()
  })

  it('sizes the fill by fraction of the maximum', () => {
    renderFixture(fixture('Funnel'))
    const fills = screen.getAllByTestId('bar-list-fill')
    expect(fills[1]).toHaveStyle({ width: '82%' })
  })

  it('shows No value text and no bar for a missing value', () => {
    renderFixture(fixture('Missing values'))
    expect(screen.getAllByText('No value')).toHaveLength(2)
  })

  it('renders All zero rows, not the empty state', () => {
    renderFixture(fixture('All zero'))
    expect(screen.getAllByTestId('bar-list-row')).toHaveLength(4)
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })

  describe('pressing', () => {
    it('passes the pressed row to onRowPress', () => {
      const onRowPress = vi.fn()
      renderFixture(defaultFixture, { onRowPress })
      fireEvent.click(screen.getAllByRole('button')[1])
      expect(onRowPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'Read' }))
    })

    it('stops onRowPress and sets aria-disabled when disabled', () => {
      const onRowPress = vi.fn()
      renderFixture(defaultFixture, { onRowPress, isDisabled: true })
      const [first] = screen.getAllByRole('button')
      fireEvent.click(first)
      expect(onRowPress).not.toHaveBeenCalled()
      expect(first).toHaveAttribute('aria-disabled', 'true')
    })

    it('renders no button and no focusable row without onRowPress', () => {
      const { container } = renderFixture(defaultFixture)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(container.querySelector('[tabindex]')).toBeNull()
    })

    it('makes pressable rows tab stops in display order', () => {
      renderFixture(defaultFixture, { onRowPress: vi.fn() })
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(10)
      expect(buttons[0]).toHaveAccessibleName(/^Bash:/)
      expect(buttons.every((b) => b.getAttribute('tabindex') === '0')).toBe(true)
    })

    it('renders a native button, which the browser presses on Enter and Space', () => {
      renderFixture(defaultFixture, { onRowPress: vi.fn() })
      expect(screen.getAllByRole('button').every((b) => b.tagName === 'BUTTON')).toBe(true)
    })
  })

  describe('states', () => {
    it('renders skeleton rows and no list items while loading', () => {
      renderFixture(defaultFixture, { isLoading: true })
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
      expect(screen.getByLabelText('Tool calls')).toHaveAttribute('aria-busy', 'true')
    })

    it('renders the default empty state, and a custom one replaces it', () => {
      const { rerender } = renderFixture(fixture('Empty'))
      expect(screen.getByText('No data')).toBeInTheDocument()
      rerender(
        <BarList accessibilityLabel="Tool calls" rows={[]} emptyState={<span>Nothing yet</span>} />
      )
      expect(screen.getByText('Nothing yet')).toBeInTheDocument()
      expect(screen.queryByText('No data')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    const cases: [string, () => ReturnType<typeof renderFixture>][] = [
      ['Default', () => renderFixture(defaultFixture)],
      ['Flagged', () => renderFixture(fixture('Flagged'))],
      ['With description (stacked)', () => renderFixture(fixture('With description'))],
      ['loading', () => renderFixture(defaultFixture, { isLoading: true })],
      ['empty', () => renderFixture(fixture('Empty'))],
      ['disabled', () => renderFixture(defaultFixture, { onRowPress: vi.fn(), isDisabled: true })],
    ]
    it.each(cases)('has no axe violations: %s', async (_name, mount) => {
      const { container } = mount()
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
