import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { compositeOver, contrast } from '../../../../theme/color-checks'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { capturedByNode } from '../../../../test/classname-capture'
import { Surface } from '../../surface'
import { silverRed } from '../kit/silverRed'
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

  it("formats the overflow row and the summary's hidden total with the caller's formatValue", () => {
    renderFixture(defaultFixture, { formatValue: (value: number) => `$${value.toFixed(2)}` })
    expect(screen.getByTestId('bar-list-overflow')).toHaveTextContent('2 more · $3.00')
    expect(screen.getByRole('list')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('2 more not shown, totalling $3.00.')
    )
  })

  it('names no rank in a row of a list kept in input order', () => {
    renderFixture(fixture('Funnel'))
    for (const row of screen.getAllByTestId('bar-list-row')) {
      expect(row.getAttribute('aria-label')).not.toMatch(/rank/)
    }
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

  describe('colour', () => {
    const flagged = fixture('Flagged')
    const classOf = (el: Element) => capturedByNode.get(el) ?? ''
    const fillOf = (label: string) =>
      screen
        .getByLabelText(new RegExp(`^${label}:`))
        .querySelector<HTMLElement>('[data-testid="bar-list-fill"]')

    it.each(['dark', 'light'] as const)(
      'paints unflagged rows silver and flagged rows one red in %s mode',
      (mode) => {
        const { neutral, flag } = silverRed(mode)
        render(
          <Surface theme={mode}>
            <BarList accessibilityLabel="Errors" rows={flagged.rows} />
          </Surface>
        )
        const tones = new Set(flagged.rows.map((row) => row.flag?.tone))
        expect(tones).toEqual(new Set(['warning', 'error', undefined]))
        for (const row of flagged.rows) {
          expect(fillOf(row.label)).toHaveStyle({ backgroundColor: row.flag ? flag : neutral })
        }
      }
    )

    it.each(['dark', 'light'] as const)(
      'keeps both fills at 3:1 or more against the track on the %s base surface',
      (mode) => {
        const colors = getSemanticColors(mode)
        const track = compositeOver(colors['hairline-default'], colors['surface-base'])
        const { neutral, flag } = silverRed(mode)
        expect(contrast(neutral, track)).toBeGreaterThanOrEqual(3)
        expect(contrast(flag, track)).toBeGreaterThanOrEqual(3)
      }
    )

    it('paints silver outside any Surface, the dark default', () => {
      renderFixture(defaultFixture)
      for (const fill of screen.getAllByTestId('bar-list-fill')) {
        expect(fill).toHaveStyle({ backgroundColor: silverRed('dark').neutral })
      }
    })

    it("lets a row's own color win over the flag", () => {
      const row = {
        id: 'own',
        label: 'Own',
        value: 4,
        color: 'status-info' as const,
        flag: { tone: 'error' as const, label: 'over' },
      }
      render(<BarList accessibilityLabel="Own colour" rows={[row]} />)
      expect(screen.getByTestId('bar-list-fill').style.backgroundColor).toBe(
        'var(--color-status-info)'
      )
    })

    it('draws the track from the hairline token and no brand class anywhere', () => {
      const { container } = renderFixture(flagged)
      for (const track of screen.getAllByTestId('bar-list-track')) {
        expect(classOf(track).split(' ')).toContain('bg-hairline')
      }
      const classes = [...container.querySelectorAll('*')].map(classOf).join(' ')
      expect(classes).toContain('bg-hairline')
      expect(classes).not.toMatch(/brand-/)
    })

    it('writes both flag tones in the error text colour, so the label carries the tone', () => {
      renderFixture(flagged)
      const labels = flagged.rows.flatMap((row) => (row.flag ? [row.flag.label] : []))
      expect(labels.length).toBeGreaterThan(1)
      for (const label of new Set(labels)) {
        for (const el of screen.getAllByText(label)) {
          const colours = classOf(el).match(/\btext-(text|status|brand)-\S+/g)
          expect(colours).toEqual(['text-text-error'])
        }
      }
    })
  })

  it('renders no button and no focusable row', () => {
    const { container } = renderFixture(defaultFixture)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('[tabindex]')).toBeNull()
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
      [
        'Flagged (light)',
        () =>
          render(
            <Surface theme="light">
              <BarList accessibilityLabel="Errors" rows={fixture('Flagged').rows} />
            </Surface>
          ),
      ],
    ]
    it.each(cases)('has no axe violations: %s', async (_name, mount) => {
      const { container } = mount()
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
