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
      referenceMarker={f.referenceMarker}
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

  it('gives every inline row the same values-column width so the tracks have one length', () => {
    const rows = [7, 1234, 98765].map((value) => ({ id: `v${value}`, label: `V${value}`, value }))
    render(
      <BarList
        accessibilityLabel="Widths"
        rows={rows}
        formatValue={(value) => value.toLocaleString('en-US')}
      />
    )
    const widths = screen.getAllByTestId('bar-list-values').map((el) => el.style.width)
    expect(widths).toEqual(['7ch', '7ch', '7ch'])
    const tracks = screen.getAllByTestId('bar-list-track')
    expect(new Set(tracks.map((el) => el.className)).size).toBe(1)
  })

  describe('reference marker', () => {
    const LIMIT_NAME =
      'Tool calls. Top 10 of 12 items by value. Largest: Bash, 412. 2 more not shown, totalling 3. Limit: 100. 3 of 12 items at or above.'

    it("draws one marker line per shown row at the marker's fraction", () => {
      renderFixture(fixture('Funnel'), { referenceMarker: { value: 50, label: 'Target' } })
      const lines = screen.getAllByTestId('bar-list-marker')
      expect(lines).toHaveLength(5)
      for (const line of lines) expect(line).toHaveStyle({ left: '50%', width: '2px' })
    })

    it('puts the line at the same x in every row, whatever the values column holds', () => {
      const rows = [7, 1234, 98765].map((value) => ({ id: `v${value}`, label: `V${value}`, value }))
      render(
        <BarList
          accessibilityLabel="Widths"
          rows={rows}
          max={100000}
          referenceMarker={{ value: 25000, label: 'Cap' }}
          formatValue={(value) => value.toLocaleString('en-US')}
        />
      )
      const lines = screen.getAllByTestId('bar-list-marker')
      expect(new Set(lines.map((el) => el.style.left))).toEqual(new Set(['25%']))
      // The line shares a parent with the aligned track, so one fraction is one x in every row.
      for (const line of lines) {
        const track = line.parentElement?.querySelector('[data-testid="bar-list-track"]')
        expect(line.parentElement).toBe(track?.parentElement)
        expect(line.parentElement).toHaveAttribute('aria-hidden', 'true')
      }
    })

    it('keeps the line inside the track end at fractions near 1', () => {
      const rows = [{ id: 'a', label: 'A', value: 10 }]
      for (const value of [9.99, 10]) {
        const { unmount } = render(
          <BarList accessibilityLabel="Edge" rows={rows} referenceMarker={{ value, label: 'M' }} />
        )
        const line = screen.getByTestId('bar-list-marker')
        const fraction = value / 10
        expect(line.style.left).toBe(`${fraction * 100}%`)
        expect(line.style.marginLeft).toBe(`${-2 * fraction}px`)
        unmount()
      }
    })

    it('renders the pre-marker bar structure without a marker', () => {
      const depth = (track: Element) => {
        let steps = 0
        for (let el = track; el.getAttribute('data-testid') !== 'bar-list-row'; steps++) {
          el = el.parentElement as Element
        }
        return steps
      }
      for (const f of barListFixtures.filter((x) => x.rows.length > 0)) {
        const { unmount } = renderFixture({ ...f, referenceMarker: undefined })
        const tracks = screen.getAllByTestId('bar-list-track')
        for (const track of tracks) {
          expect(track).toHaveAttribute('aria-hidden', 'true')
          expect(depth(track)).toBe(f.layout === 'stacked' ? 4 : 3)
        }
        unmount()
      }
    })

    it('draws no line when the marker is above the maximum, and keeps the legend text', () => {
      renderFixture(defaultFixture, { referenceMarker: { value: 5000, label: 'Limit' } })
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
      expect(screen.getByTestId('bar-list-marker-legend')).toHaveTextContent('Limit 5.0k')
      expect(screen.queryByTestId('bar-list-marker-swatch')).not.toBeInTheDocument()
    })

    it('shows the legend with the label and value text, hidden from assistive tech', () => {
      renderFixture(fixture('With marker'))
      const legend = screen.getByTestId('bar-list-marker-legend')
      expect(legend).toHaveTextContent('Limit 100')
      expect(legend).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByTestId('bar-list-marker-swatch')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(11)
    })

    it('ends the list name with the marker sentence', () => {
      renderFixture(fixture('With marker'))
      expect(screen.getByRole('list')).toHaveAttribute('aria-label', LIMIT_NAME)
    })

    it('says in a row name that it is at or above the marker; a row below does not', () => {
      renderFixture(fixture('With marker'))
      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveAccessibleName('Bash: 412, at or above Limit, rank 1 of 10')
      expect(rows[3]).toHaveAccessibleName('Grep: 96, rank 4 of 10')
    })

    it('hands summarize and formatRowLabel the marker fields', () => {
      const summarize = vi.fn(() => 'S.')
      const formatRowLabel = vi.fn((row: { label: string }) => row.label)
      renderFixture(fixture('With marker'), { summarize, formatRowLabel })
      expect(summarize).toHaveBeenCalledWith(
        expect.objectContaining({
          marker: expect.objectContaining({ label: 'Limit', reachedCount: 3, fraction: 100 / 412 }),
        })
      )
      expect(formatRowLabel).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'Bash' }),
        expect.objectContaining({ reachesMarker: true, markerLabel: 'Limit' })
      )
      expect(formatRowLabel).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'Grep' }),
        expect.objectContaining({ reachesMarker: false, markerLabel: 'Limit' })
      )
    })

    it('renders no line and no legend, and keeps the name, without a marker prop', () => {
      renderFixture(defaultFixture)
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bar-list-marker-legend')).not.toBeInTheDocument()
      expect(screen.getByRole('list')).toHaveAttribute(
        'aria-label',
        'Tool calls. Top 10 of 12 items by value. Largest: Bash, 412. 2 more not shown, totalling 3.'
      )
    })

    it('renders no marker while loading or empty', () => {
      const marker = { value: 100, label: 'Limit' }
      const { rerender } = renderFixture(defaultFixture, {
        isLoading: true,
        referenceMarker: marker,
      })
      expect(screen.queryByTestId('bar-list-marker-legend')).not.toBeInTheDocument()
      rerender(<BarList accessibilityLabel="Tool calls" rows={[]} referenceMarker={marker} />)
      expect(screen.queryByTestId('bar-list-marker-legend')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
    })
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
      ['With marker', () => renderFixture(fixture('With marker'))],
      [
        'marker above the maximum',
        () => renderFixture(defaultFixture, { referenceMarker: { value: 5000, label: 'Limit' } }),
      ],
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
