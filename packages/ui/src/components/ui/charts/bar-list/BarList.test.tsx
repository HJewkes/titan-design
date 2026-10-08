import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { compositeOver, contrast } from '../../../../theme/color-checks'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { capturedByNode } from '../../../../test/classname-capture'
import { Surface } from '../../surface'
import { silverRed } from '../kit/silverRed'
import { BarList } from './BarList'
import storyMeta from './BarList.stories'
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

const classOf = (el: Element) => capturedByNode.get(el) ?? ''

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

  describe('row layout', () => {
    const flagged = fixture('Flagged')
    const testIdsIn = (row: Element) =>
      [...row.querySelectorAll<HTMLElement>('[data-testid]')].map((el) => el.dataset.testid)

    it('orders an inline row as track, value, and prints no flag label', () => {
      renderFixture(flagged)
      const [first] = screen.getAllByTestId('bar-list-row')
      expect(testIdsIn(first)).toEqual(['bar-list-track', 'bar-list-fill', 'bar-list-value'])
      expect(within(first).queryByText('over 5%')).toBeNull()
    })

    it('puts the secondary value after the value', () => {
      const row = {
        id: 'p',
        label: 'Parser',
        value: 9.1,
        secondaryValue: 4,
        flag: { tone: 'error' as const, label: 'over 5%' },
      }
      render(<BarList accessibilityLabel="Errors" rows={[row]} />)
      expect(testIdsIn(screen.getByTestId('bar-list-row')).slice(2)).toEqual([
        'bar-list-value',
        'bar-list-secondary',
      ])
    })

    it('puts the same cells in the stacked header, above the track', () => {
      renderFixture(fixture('With description'))
      const [first] = screen.getAllByTestId('bar-list-row')
      const ids = testIdsIn(first)
      expect(ids.indexOf('bar-list-value')).toBeGreaterThanOrEqual(0)
      expect(ids.indexOf('bar-list-value')).toBeLessThan(ids.indexOf('bar-list-track'))
    })

    it('gives every row the same cell widths so the tracks have one length', () => {
      const rows = [7, 1234, 98765].map((value, i) => ({
        id: `v${value}`,
        label: `V${value}`,
        value,
        ...(i === 0 ? { secondaryValue: 12 } : {}),
        ...(i === 1 ? { flag: { tone: 'error' as const, label: 'over' } } : {}),
      }))
      render(
        <BarList
          accessibilityLabel="Widths"
          rows={rows}
          formatValue={(value) => value.toLocaleString('en-US')}
        />
      )
      const widths = (testId: string, property: 'minWidth' | 'width') =>
        screen.getAllByTestId(testId).map((el) => el.style[property])
      expect(widths('bar-list-value', 'minWidth')).toEqual(['6ch', '6ch', '6ch'])
      expect(widths('bar-list-secondary', 'width')).toEqual(['3ch', '3ch', '3ch'])
      const tracks = screen.getAllByTestId('bar-list-track')
      expect(new Set(tracks.map((el) => el.className)).size).toBe(1)
    })

    // Tabular digits are a `fontVariant` style; jsdom drops the property, so only the browser shows it.
    it('right-aligns the value in the mono column', () => {
      renderFixture(defaultFixture)
      for (const cell of screen.getAllByTestId('bar-list-value')) {
        expect(classOf(cell).split(' ')).toEqual(
          expect.arrayContaining(['font-mono', 'text-right'])
        )
      }
    })

    it('renders no secondary cell when no shown row has the part', () => {
      renderFixture(defaultFixture)
      expect(screen.queryByTestId('bar-list-secondary')).toBeNull()
    })

    it('paints no flag label anywhere in a flagged list until a tip opens', () => {
      const { container } = renderFixture(flagged)
      for (const row of flagged.rows) {
        if (row.flag) expect(within(container).queryByText(row.flag.label)).toBeNull()
      }
    })
  })

  describe('isValueHidden', () => {
    const flagged = fixture('Flagged')

    it('takes the value cell out of every row and keeps the secondary cell', () => {
      renderFixture(fixture('With secondary'), { isValueHidden: true })
      expect(screen.queryByTestId('bar-list-value')).toBeNull()
      expect(screen.getAllByTestId('bar-list-secondary').length).toBeGreaterThan(0)
    })

    it('names every row and the list the same whether the value is shown or hidden', () => {
      const namesFor = (isValueHidden: boolean) => {
        const { unmount } = renderFixture(flagged, { isValueHidden })
        const names = [screen.getByRole('list'), ...screen.getAllByTestId('bar-list-row')].map(
          (el) => el.getAttribute('aria-label')
        )
        unmount()
        return names
      }
      const shown = namesFor(false)
      expect(shown[1]).toBe('Parser: 9.1, over 5%, rank 1 of 5')
      expect(namesFor(true)).toEqual(shown)
    })
  })

  describe('tip', () => {
    const flagged = fixture('Flagged')
    const tabStops = () =>
      screen.getAllByTestId('bar-list-row').filter((row) => row.getAttribute('tabindex') === '0')

    afterEach(() => {
      // RNW's input modality is module-global; a mouse move ends the modality a test leaves.
      fireEvent.mouseMove(document)
    })

    it('shows no tip and takes no focus for a plain list with its value shown', () => {
      const { container } = renderFixture(defaultFixture)
      expect(container.querySelector('[tabindex]')).toBeNull()
      act(() => fireEvent.focus(screen.getAllByTestId('bar-list-row')[0]))
      expect(screen.queryByTestId('bar-list-tip')).toBeNull()
    })

    it.each([
      ['a flagged row', () => renderFixture(flagged)],
      ['a hidden value', () => renderFixture(defaultFixture, { isValueHidden: true })],
    ])(
      'turns the tips on for %s: one tab stop, rows stay list items, not buttons',
      (_name, mount) => {
        mount()
        expect(tabStops()).toHaveLength(1)
        expect(screen.queryByRole('button')).toBeNull()
        for (const row of screen.getAllByTestId('bar-list-row')) {
          expect(row).toHaveAttribute('role', 'listitem')
        }
        // The Flagged fixture has no overflow row; the Default fixture's never takes the stop.
        expect(
          screen.queryByTestId('bar-list-overflow')?.getAttribute('tabindex') ?? null
        ).toBeNull()
      }
    )

    it('opens the tip on keyboard focus, moves it with the arrows and closes it on Escape', () => {
      renderFixture(flagged)
      const rows = screen.getAllByTestId('bar-list-row')
      act(() => rows[0].focus())
      expect(screen.getByTestId('bar-list-tip')).toHaveTextContent('Parser')

      fireEvent.keyDown(rows[0], { key: 'ArrowDown' })
      expect(document.activeElement).toBe(rows[1])
      expect(tabStops()).toEqual([rows[1]])
      expect(screen.getByTestId('bar-list-tip')).toHaveTextContent('Formatter')

      fireEvent.keyDown(rows[1], { key: 'End' })
      expect(document.activeElement).toBe(rows[4])
      fireEvent.keyDown(rows[4], { key: 'ArrowDown' })
      expect(document.activeElement).toBe(rows[4])

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByTestId('bar-list-tip')).toBeNull()
    })

    it('moves the tab stop to a clicked row', () => {
      renderFixture(flagged)
      const rows = screen.getAllByTestId('bar-list-row')
      expect(tabStops()).toEqual([rows[0]])
      fireEvent.click(rows[2])
      expect(tabStops()).toEqual([rows[2]])
    })

    it("runs the caller's onKeyDown after the arrow keys, not instead of them", () => {
      const onKeyDown = vi.fn()
      renderFixture(flagged, { onKeyDown })
      const rows = screen.getAllByTestId('bar-list-row')
      act(() => rows[0].focus())
      fireEvent.keyDown(rows[0], { key: 'ArrowDown' })
      expect(document.activeElement).toBe(rows[1])
      expect(onKeyDown).toHaveBeenCalledTimes(1)
      expect(onKeyDown.mock.calls[0][0]).toMatchObject({ key: 'ArrowDown' })
    })

    it('holds the row label, the formatted value and the flag label in the error text colour', () => {
      renderFixture(flagged, { formatValue: (value: number) => `${value}%` })
      const rows = screen.getAllByTestId('bar-list-row')
      act(() => rows[0].focus())
      const tip = screen.getByTestId('bar-list-tip')
      expect(tip).toHaveTextContent('Parser')
      expect(tip).toHaveTextContent('9.1%')
      const flagLine = within(tip).getByText('over 5%')
      expect(classOf(flagLine).split(' ')).toEqual(
        expect.arrayContaining(['text-text-error', 'leading-normal'])
      )

      fireEvent.keyDown(rows[0], { key: 'ArrowDown' })
      fireEvent.keyDown(rows[1], { key: 'ArrowDown' })
      const nearTip = screen.getByTestId('bar-list-tip')
      expect(within(nearTip).getByText('near 5%')).toBeInTheDocument()
      expect(classOf(within(nearTip).getByText('near 5%')).split(' ')).toContain('text-text-error')

      fireEvent.keyDown(rows[2], { key: 'End' })
      const lastTip = screen.getByTestId('bar-list-tip')
      expect(lastTip).toHaveTextContent('Importer')
      expect(within(lastTip).queryByText(/5%/)).toBeNull()
    })

    it('hides the tip from assistive tech and describes the row with nothing', () => {
      renderFixture(flagged)
      const row = screen.getAllByTestId('bar-list-row')[0]
      act(() => fireEvent.focus(row))
      const tip = screen.getByTestId('bar-list-tip')
      expect(tip.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      expect(row).not.toHaveAttribute('aria-describedby')
      expect(row).toHaveAccessibleName('Parser: 9.1, over 5%, rank 1 of 5')
    })

    it('has no axe violations with a tip open', async () => {
      const { container } = renderFixture(flagged)
      // The focus's effect queues a frame that positions the portal; let it fire inside act.
      act(() => fireEvent.focus(screen.getAllByTestId('bar-list-row')[0]))
      await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
      expect(screen.getByTestId('bar-list-tip')).toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()
      // The portal puts the tip under body; `region` is a page rule, not the component's.
      const body = await axe(document.body, { rules: { region: { enabled: false } } })
      expect(body).toHaveNoViolations()
    })
  })

  describe('reference marker', () => {
    const LIMIT_NAME =
      'Tool calls. Top 10 of 12 items by value. Largest: Bash, 412. 2 more not shown, totalling 3. Limit: 100. 3 of 12 items at or above.'
    const classesOf = (el: Element) => (capturedByNode.get(el) ?? '').split(' ')

    it("draws one marker line per shown row at the marker's fraction", () => {
      renderFixture(fixture('Funnel'), { referenceMarker: { value: 50, label: 'Target' } })
      const lines = screen.getAllByTestId('bar-list-marker')
      expect(lines).toHaveLength(5)
      for (const line of lines) expect(line).toHaveStyle({ left: '50%', width: '4px' })
    })

    it('paints the line as a text-primary core with a text-inverse keyline each side', () => {
      renderFixture(fixture('With marker'))
      const lines = screen.getAllByTestId('bar-list-marker')
      expect(lines).toHaveLength(10)
      for (const el of lines) {
        expect(classesOf(el)).toEqual(
          expect.arrayContaining(['absolute', 'bg-text-primary', 'border-x', 'border-text-inverse'])
        )
      }
    })

    it.each(
      (['dark', 'light'] as const).flatMap((mode) =>
        (['surface-base', 'surface-elevated'] as const).map((plane) => [mode, plane] as const)
      )
    )(
      'keeps the line at 3:1 or more against both fills, the track and the plane: %s %s',
      (mode, plane) => {
        render(
          <Surface theme={mode}>
            <BarList
              accessibilityLabel="Tool calls"
              rows={defaultFixture.rows}
              max={500}
              referenceMarker={{ value: 100, label: 'Limit' }}
            />
          </Surface>
        )
        const classes = classesOf(screen.getAllByTestId('bar-list-marker')[0])
        const tokenOf = (prefix: string) => {
          const found = classes.find((name) => name.startsWith(`${prefix}-text-`))
          if (!found) throw new Error(`no ${prefix} colour class on the marker`)
          return found.slice(prefix.length + 1) as 'text-primary' | 'text-inverse'
        }
        const colors = getSemanticColors(mode)
        const core = colors[tokenOf('bg')]
        const keyline = colors[tokenOf('border')]
        for (const fill of Object.values(silverRed(mode))) {
          expect(contrast(keyline, fill)).toBeGreaterThanOrEqual(3)
        }
        expect(contrast(core, colors[plane])).toBeGreaterThanOrEqual(3)
        expect(
          contrast(core, compositeOver(colors['hairline-default'], colors[plane]))
        ).toBeGreaterThanOrEqual(3)
      }
    )

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

    it('keeps the line, keylines included, inside the track end at fractions near 1', () => {
      const rows = [{ id: 'a', label: 'A', value: 10 }]
      for (const value of [9.99, 10]) {
        const { unmount } = render(
          <BarList accessibilityLabel="Edge" rows={rows} referenceMarker={{ value, label: 'M' }} />
        )
        const line = screen.getByTestId('bar-list-marker')
        const fraction = value / 10
        expect(line.style.left).toBe(`${fraction * 100}%`)
        expect(line.style.marginLeft).toBe(`${-4 * fraction}px`)
        unmount()
      }
    })

    it('renders the bare track, hidden and unwrapped, without a marker', () => {
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
          expect(classesOf(track)).toContain('flex-1')
          expect(depth(track)).toBe(f.layout === 'stacked' ? 4 : 3)
        }
        unmount()
      }
    })

    it('has no legend and no swatch when a marker is set', () => {
      renderFixture(fixture('With marker'))
      expect(screen.queryByTestId('bar-list-marker-legend')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bar-list-marker-swatch')).not.toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(11)
    })

    describe('tip', () => {
      const rowsOfList = () => screen.getAllByTestId('bar-list-row')
      const tabStops = () => rowsOfList().filter((row) => row.getAttribute('tabindex') === '0')

      afterEach(() => {
        fireEvent.mouseMove(document)
      })

      it('is opt-in: without the prop (and no flag) there is no line, wrapper, tip or focusable row', () => {
        const { container } = renderFixture(defaultFixture)
        expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
        expect(container.querySelector('[tabindex]')).toBeNull()
        act(() => fireEvent.focus(rowsOfList()[0]))
        expect(screen.queryByTestId('bar-list-tip')).toBeNull()
        const track = screen.getAllByTestId('bar-list-track')[0]
        expect(track.parentElement).toBe(rowsOfList()[0].firstElementChild?.firstElementChild)
      })

      it('puts every data row in the roving set, whether or not the value is hidden', () => {
        renderFixture(fixture('With marker'))
        expect(tabStops()).toHaveLength(1)
        const rows = rowsOfList()
        act(() => rows[0].focus())
        fireEvent.keyDown(rows[0], { key: 'End' })
        expect(document.activeElement).toBe(rows[9])
        expect(screen.getByTestId('bar-list-overflow')).not.toHaveAttribute('tabindex')
      })

      it('holds the label, the value, the limit and the flag label of a flagged row', () => {
        renderFixture(fixture('Over limit'))
        act(() => rowsOfList()[0].focus())
        const tip = screen.getByTestId('bar-list-tip')
        for (const text of ['Parser', '9.1', 'Limit', '5', 'over 5%']) {
          expect(within(tip).getByText(text)).toBeInTheDocument()
        }
        const limit = within(tip).getByText('Limit')
        expect(classesOf(limit)).toEqual(
          expect.arrayContaining(['leading-normal', 'text-text-secondary'])
        )
        const lines = [...tip.children].map((line) => line.textContent)
        expect(lines).toEqual(['Parser9.1', 'Limit5', 'over 5%'])
      })

      it('shows the limit line on an unflagged row and no flag line', () => {
        renderFixture(fixture('Over limit'))
        act(() => rowsOfList()[0].focus())
        fireEvent.keyDown(rowsOfList()[0], { key: 'End' })
        const tip = screen.getByTestId('bar-list-tip')
        expect(tip).toHaveTextContent('Importer')
        expect(tip).toHaveTextContent('Limit')
        expect(within(tip).queryByText('over 5%')).toBeNull()
      })

      it('states the limit in the tip when the marker is above the maximum, with no line', () => {
        renderFixture(defaultFixture, { referenceMarker: { value: 5000, label: 'Limit' } })
        expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
        act(() => rowsOfList()[0].focus())
        const tip = screen.getByTestId('bar-list-tip')
        expect(tip).toHaveTextContent('Limit')
        expect(tip).toHaveTextContent('5.0k')
      })

      it('hides the tip from assistive tech and names the row with the #407 name plus the marker', () => {
        renderFixture(fixture('With marker'))
        const row = rowsOfList()[0]
        act(() => row.focus())
        expect(screen.getByTestId('bar-list-tip').closest('[aria-hidden="true"]')).not.toBeNull()
        expect(document.querySelector('[role="tooltip"]')).toBeNull()
        expect(row).not.toHaveAttribute('aria-describedby')
        expect(row).toHaveAccessibleName('Bash: 412, at or above Limit, rank 1 of 10')
      })

      it.each([
        { value: Number.NaN, label: 'Limit' },
        { value: Number.POSITIVE_INFINITY, label: 'Limit' },
        { value: 0, label: 'Limit' },
        { value: -5, label: 'Limit' },
      ])(
        'renders no tip and does not throw for the hostile marker %o on an unflagged list',
        (referenceMarker) => {
          const { container } = renderFixture(defaultFixture, { referenceMarker })
          expect(container.querySelector('[tabindex]')).toBeNull()
          act(() => fireEvent.focus(rowsOfList()[0]))
          expect(screen.queryByTestId('bar-list-tip')).toBeNull()
        }
      )

      it('keeps the model while a new marker literal carries the same values', () => {
        const formatValue = vi.fn((value: number) => String(value))
        // Only the model formats the hidden total, with no row; the rows format on every render.
        const builds = () => formatValue.mock.calls.filter((call) => call[1] === undefined).length
        const { rerender } = render(
          <BarList
            accessibilityLabel="Tool calls"
            rows={defaultFixture.rows}
            formatValue={formatValue}
            referenceMarker={{ value: 100, label: 'Limit' }}
          />
        )
        const calls = builds()
        expect(calls).toBe(1)
        rerender(
          <BarList
            accessibilityLabel="Tool calls"
            rows={defaultFixture.rows}
            formatValue={formatValue}
            referenceMarker={{ value: 100, label: 'Limit' }}
          />
        )
        expect(builds()).toBe(calls)
        rerender(
          <BarList
            accessibilityLabel="Tool calls"
            rows={defaultFixture.rows}
            formatValue={formatValue}
            referenceMarker={{ value: 200, label: 'Limit' }}
          />
        )
        expect(builds()).toBe(calls + 1)
      })

      it('passes axe on the Over limit fixture with a tip open', async () => {
        const { container } = renderFixture(fixture('Over limit'))
        // The focus's effect queues a frame that positions the portal; let it fire inside act.
        act(() => rowsOfList()[0].focus())
        await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
        expect(await axe(container)).toHaveNoViolations()
        const body = await axe(document.body, { rules: { region: { enabled: false } } })
        expect(body).toHaveNoViolations()
      })
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

    it('renders no line, and keeps the name, without a marker prop', () => {
      renderFixture(defaultFixture)
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
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
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
      rerender(<BarList accessibilityLabel="Tool calls" rows={[]} referenceMarker={marker} />)
      expect(screen.queryByTestId('bar-list-marker')).not.toBeInTheDocument()
    })

    it('gives the story a referenceMarker object control typed so a URL can set its fields', () => {
      const control = storyMeta.argTypes?.referenceMarker
      expect(control?.control).toBe('object')
      expect(control?.type).toEqual({
        name: 'object',
        value: { value: { name: 'number' }, label: { name: 'string' } },
      })
      expect(fixture('With marker').referenceMarker).toEqual({ value: 100, label: 'Limit' })
    })
  })

  describe('colour', () => {
    const flagged = fixture('Flagged')
    const fillOf = (label: string) =>
      screen
        .getByLabelText(new RegExp(`^${label}:`))
        .querySelector<HTMLElement>('[data-testid="bar-list-fill"]')

    it.each(['dark', 'light'] as const)(
      'paints unflagged rows silver, warning rows the near red and error rows the over red in %s mode',
      (mode) => {
        const { neutral, near, over } = silverRed(mode)
        render(
          <Surface theme={mode}>
            <BarList accessibilityLabel="Errors" rows={flagged.rows} />
          </Surface>
        )
        const tones = new Set(flagged.rows.map((row) => row.flag?.tone))
        expect(tones).toEqual(new Set(['warning', 'error', undefined]))
        const expected = { warning: near, error: over }
        for (const row of flagged.rows) {
          const fill = row.flag ? expected[row.flag.tone] : neutral
          expect(fillOf(row.label)).toHaveStyle({ backgroundColor: fill })
        }
        expect(near).not.toBe(over)
      }
    )

    it.each(['dark', 'light'] as const)(
      'keeps every fill at 3:1 or more against the track on the %s base surface',
      (mode) => {
        const colors = getSemanticColors(mode)
        const track = compositeOver(colors['hairline-default'], colors['surface-base'])
        for (const fill of Object.values(silverRed(mode))) {
          expect(contrast(fill, track)).toBeGreaterThanOrEqual(3)
        }
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
  })

  it('renders no button and no focusable row in a plain list', () => {
    const { container } = renderFixture(defaultFixture)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('[tabindex]')).toBeNull()
  })

  it('gives the story fixture, sort, layout, size and value controls and no colour control', () => {
    const controls = storyMeta.argTypes ?? {}
    for (const name of ['fixture', 'sort', 'layout', 'size'] as const) {
      expect(controls[name]?.control).toBe('select')
    }
    expect(controls.isValueHidden).toMatchObject({ control: 'boolean' })
    expect(Object.keys(controls)).not.toContain('color')
    expect(Object.keys(controls)).not.toContain('readouts')
  })

  describe('states', () => {
    it('renders skeleton rows and no list items while loading', () => {
      renderFixture(defaultFixture, { isLoading: true })
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
      expect(screen.getByLabelText('Tool calls')).toHaveAttribute('aria-busy', 'true')
    })

    it('renders the default empty state under the list name, and a custom one replaces it', () => {
      const { rerender } = renderFixture(fixture('Empty'))
      const empty = screen.getByRole('group', { name: 'Tool calls' })
      expect(within(empty).getByText('No data')).toBeInTheDocument()
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
      ['Flagged (tips on)', () => renderFixture(fixture('Flagged'))],
      ['With marker', () => renderFixture(fixture('With marker'))],
      [
        'marker above the maximum',
        () => renderFixture(defaultFixture, { referenceMarker: { value: 5000, label: 'Limit' } }),
      ],
      [
        'With marker (light)',
        () =>
          render(
            <Surface theme="light">
              <BarList
                accessibilityLabel="Tool calls"
                rows={defaultFixture.rows}
                referenceMarker={fixture('With marker').referenceMarker}
              />
            </Surface>
          ),
      ],
      ['With description (stacked)', () => renderFixture(fixture('With description'))],
      [
        'Default with the value hidden',
        () => renderFixture(defaultFixture, { isValueHidden: true }),
      ],
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
