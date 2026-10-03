import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { FacetBar } from './FacetBar'
import { facetBarFixtures } from './fixtures'

expect.extend(toHaveNoViolations)

const { options } = facetBarFixtures.default
const pressed = (name: string) => screen.getByRole('button', { name })

describe('FacetBar', () => {
  it('renders a group named by the label holding one button per option', () => {
    render(<FacetBar label="Record" options={options} />)
    const group = screen.getByRole('group', { name: 'Record' })
    expect(within(group).getAllByRole('button')).toHaveLength(3)
    expect(within(group).getByText('Record')).toBeInTheDocument()
  })

  it('isLabelHidden keeps the group name and renders no label text', () => {
    render(<FacetBar label="Record" isLabelHidden options={options} />)
    expect(screen.getByRole('group', { name: 'Record' })).toBeInTheDocument()
    expect(screen.queryByText('Record')).not.toBeInTheDocument()
  })

  it('uncontrolled: pressing a chip sets aria-pressed true and calls onValueChange with the array', () => {
    const onValueChange = vi.fn()
    render(<FacetBar label="Record" options={options} onValueChange={onValueChange} />)
    expect(pressed('Notes, 128')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(pressed('Notes, 128'))
    expect(pressed('Notes, 128')).toHaveAttribute('aria-pressed', 'true')
    expect(onValueChange).toHaveBeenCalledWith(['notes'])
  })

  it('controlled: pressing calls onValueChange and aria-pressed stays as the value prop says', () => {
    const onValueChange = vi.fn()
    render(<FacetBar label="Record" options={options} value={[]} onValueChange={onValueChange} />)
    fireEvent.click(pressed('Notes, 128'))
    expect(onValueChange).toHaveBeenCalledWith(['notes'])
    expect(pressed('Notes, 128')).toHaveAttribute('aria-pressed', 'false')
  })

  it('multiple: a second press on another chip reports both, in options order', () => {
    const onValueChange = vi.fn()
    render(
      <FacetBar
        label="Record"
        options={options}
        defaultValue={['drafts']}
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(pressed('Notes, 128'))
    expect(onValueChange).toHaveBeenLastCalledWith(['notes', 'drafts'])
  })

  it('single: pressing another chip reports only it; pressing the selected chip reports null', () => {
    const onValueChange = vi.fn()
    render(
      <FacetBar
        label="Period"
        selectionMode="single"
        options={facetBarFixtures.single.options}
        defaultValue="month"
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(pressed('Week'))
    expect(onValueChange).toHaveBeenLastCalledWith('week')
    expect(pressed('Month')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(pressed('Week'))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('defaultValue selects on first render', () => {
    render(<FacetBar label="Record" options={options} defaultValue={['sources']} />)
    expect(pressed('Sources, 42')).toHaveAttribute('aria-pressed', 'true')
    expect(pressed('Notes, 128')).toHaveAttribute('aria-pressed', 'false')
  })

  it("a chip's accessible name holds the label and the count; without a count it is the label", () => {
    render(
      <FacetBar
        label="Record"
        options={[
          { value: 'a', label: 'Alpha', count: 5 },
          { value: 'b', label: 'Beta' },
        ]}
      />
    )
    expect(pressed('Alpha, 5')).toBeInTheDocument()
    expect(pressed('Beta')).toBeInTheDocument()
  })

  it('formatCount receives the count; a NaN count renders no count', () => {
    const formatCount = vi.fn((n: number) => `n${n}`)
    render(
      <FacetBar
        label="Record"
        formatCount={formatCount}
        options={[
          { value: 'a', label: 'Alpha', count: 5 },
          { value: 'b', label: 'Beta', count: Number.NaN },
        ]}
      />
    )
    expect(formatCount).toHaveBeenCalledWith(5)
    expect(formatCount).toHaveBeenCalledTimes(1)
    expect(screen.getByText('n5')).toBeInTheDocument()
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
    expect(pressed('Beta')).toBeInTheDocument()
  })

  it('isDisabled disables every chip and onValueChange never fires', () => {
    const onValueChange = vi.fn()
    render(<FacetBar label="Record" isDisabled options={options} onValueChange={onValueChange} />)
    screen.getAllByRole('button').forEach((button) => fireEvent.click(button))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('a disabled option cannot be pressed and its neighbours can', () => {
    const onValueChange = vi.fn()
    render(
      <FacetBar
        label="Class"
        options={facetBarFixtures.withDisabled.options}
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(pressed('Two, 3'))
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.click(pressed('Three, 2'))
    expect(onValueChange).toHaveBeenCalledWith(['three'])
  })

  it('a disabled selected chip stays selected', () => {
    render(
      <FacetBar
        label="Class"
        options={facetBarFixtures.withDisabled.options}
        defaultValue={['two']}
      />
    )
    expect(pressed('Two, 3')).toHaveAttribute('aria-pressed', 'true')
  })

  it('empty options render nothing', () => {
    const { container } = render(<FacetBar label="Kind" options={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('duplicate values render one chip and log no key warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<FacetBar label="Kind" options={facetBarFixtures.duplicateValue.options} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('a stale selected value survives a press on another chip', () => {
    const onValueChange = vi.fn()
    render(
      <FacetBar
        label="Record"
        options={facetBarFixtures.staleSelection.options}
        defaultValue={['gone', 'notes']}
        onValueChange={onValueChange}
      />
    )
    fireEvent.click(pressed('Sources, 42'))
    expect(onValueChange).toHaveBeenCalledWith(['notes', 'sources', 'gone'])
  })

  it('many renders 40 buttons', () => {
    render(<FacetBar label="Group" options={facetBarFixtures.many.options} />)
    expect(screen.getAllByRole('button')).toHaveLength(40)
  })

  it('keyboard: every enabled chip is a native button tab stop in options order', () => {
    render(<FacetBar label="Class" options={facetBarFixtures.withDisabled.options} />)
    const buttons = screen.getAllByRole('button')
    // jsdom does not turn Enter or Space into a click; a native button does that in the browser.
    expect(buttons.every((b) => b.tagName === 'BUTTON')).toBe(true)
    const stops = buttons.filter((b) => !(b as HTMLButtonElement).disabled && b.tabIndex === 0)
    expect(stops.map((b) => b.getAttribute('aria-label'))).toEqual([
      'One, 5',
      'Three, 2',
      'Four, 1',
    ])
  })

  it('has no accessibility violations', async () => {
    const f = facetBarFixtures
    const cases = [
      <FacetBar key="d" label="Record" options={options} defaultValue={['notes']} />,
      <FacetBar
        key="s"
        label="Period"
        selectionMode="single"
        options={f.single.options}
        defaultValue="month"
      />,
      <FacetBar key="x" label="Class" options={f.withDisabled.options} defaultValue={['two']} />,
      <FacetBar key="h" label="Record" isLabelHidden options={options} />,
      <FacetBar key="m" label="Group" options={f.many.options} />,
    ]
    for (const ui of cases) {
      const { container, unmount } = render(ui)
      expect(await axe(container)).toHaveNoViolations()
      unmount()
    }
  })
})
