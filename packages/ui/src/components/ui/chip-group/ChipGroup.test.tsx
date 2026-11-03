import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { ChipGroup } from './ChipGroup'
import { chipGroupFixtures } from './fixtures'

expect.extend(toHaveNoViolations)

const { items } = chipGroupFixtures.default
const radio = (name: string) => screen.getByRole('radio', { name })

describe('ChipGroup', () => {
  it('renders a radiogroup named by the label with one radio per item', () => {
    render(<ChipGroup label="Kind" items={items} />)

    const group = screen.getByRole('radiogroup', { name: 'Kind' })

    expect(within(group).getAllByRole('radio')).toHaveLength(items.length)
  })

  it('names each radio with its label and count, and shows the count', () => {
    render(<ChipGroup label="Kind" items={items} />)

    expect(radio('Clips, 12')).toHaveTextContent('12')
  })

  it('selects the first item when no value is given', () => {
    render(<ChipGroup label="Kind" items={items} />)

    expect(radio('All, 48')).toHaveAttribute('aria-checked', 'true')
    expect(radio('All, 48')).toHaveAttribute('aria-current', 'true')
    expect(radio('Clips, 12')).toHaveAttribute('aria-checked', 'false')
    expect(radio('Clips, 12')).not.toHaveAttribute('aria-current')
  })

  it('uncontrolled: pressing a chip selects it and reports its value', () => {
    const onValueChange = vi.fn()
    render(<ChipGroup label="Kind" items={items} onValueChange={onValueChange} />)

    fireEvent.click(radio('Talks, 9'))

    expect(onValueChange).toHaveBeenCalledWith('talks')
    expect(radio('Talks, 9')).toHaveAttribute('aria-checked', 'true')
    expect(radio('All, 48')).toHaveAttribute('aria-checked', 'false')
  })

  it('controlled: pressing reports the value and the selection follows the value prop', () => {
    const onValueChange = vi.fn()
    render(<ChipGroup label="Kind" items={items} value="clips" onValueChange={onValueChange} />)

    fireEvent.click(radio('Talks, 9'))

    expect(onValueChange).toHaveBeenCalledWith('talks')
    expect(radio('Clips, 12')).toHaveAttribute('aria-checked', 'true')
  })

  it('pressing the selected chip keeps it selected and reports nothing', () => {
    const onValueChange = vi.fn()
    render(<ChipGroup label="Kind" items={items} onValueChange={onValueChange} />)

    fireEvent.click(radio('All, 48'))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(radio('All, 48')).toHaveAttribute('aria-checked', 'true')
  })

  it('makes only the selected chip a Tab stop', () => {
    render(<ChipGroup label="Kind" items={items} defaultValue="talks" />)

    const stops = screen.getAllByRole('radio').filter((el) => el.getAttribute('tabindex') === '0')

    expect(stops).toEqual([radio('Talks, 9')])
  })

  it('arrow keys move the selection and focus, skipping a disabled chip', () => {
    const { items: withDisabled } = chipGroupFixtures.oneDisabled
    const onValueChange = vi.fn()
    render(<ChipGroup label="Kind" items={withDisabled} onValueChange={onValueChange} />)

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenCalledWith('talks')
    expect(radio('Talks, 20')).toHaveFocus()
  })

  it('End selects the last chip and Home the first', () => {
    render(<ChipGroup label="Kind" items={items} />)
    const group = screen.getByRole('radiogroup')

    fireEvent.keyDown(group, { key: 'End' })
    expect(radio('Archive, 1')).toHaveAttribute('aria-checked', 'true')

    fireEvent.keyDown(group, { key: 'Home' })
    expect(radio('All, 48')).toHaveAttribute('aria-checked', 'true')
  })

  it('formats large counts compactly and keeps the exact count in the name', () => {
    render(<ChipGroup label="Kind" items={chipGroupFixtures.largeCounts.items} />)

    expect(radio('All, 128400')).toHaveTextContent('128.4k')
  })

  it('omits the count when an item has none', () => {
    render(<ChipGroup label="Period" items={chipGroupFixtures.withoutCounts.items} />)

    expect(radio('Week')).toHaveTextContent(/^Week$/)
  })

  it('renders nothing for no items', () => {
    const { container } = render(<ChipGroup label="Kind" items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('isDisabled disables every chip', () => {
    render(<ChipGroup label="Kind" items={items} isDisabled />)

    for (const chip of screen.getAllByRole('radio')) {
      expect(chip).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('isLoading shows a labelled placeholder instead of the radios', () => {
    render(<ChipGroup label="Kind" items={items} isLoading />)

    expect(screen.getByRole('progressbar', { name: 'Loading Kind' })).toBeInTheDocument()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  describe('overflow="scroll"', () => {
    it('pins the first chip outside the scroller', () => {
      render(<ChipGroup label="Kind" items={items} overflow="scroll" testID="row" />)

      const group = screen.getByRole('radiogroup')
      const pinned = radio('All, 48')
      const scrolled = radio('Clips, 12')

      expect(group.contains(pinned)).toBe(true)
      expect(pinned.parentElement?.contains(scrolled)).toBe(false)
    })

    it('keeps every chip in one radiogroup', () => {
      render(<ChipGroup label="Kind" items={items} overflow="scroll" />)

      expect(within(screen.getByRole('radiogroup')).getAllByRole('radio')).toHaveLength(
        items.length
      )
    })
  })

  it.each([
    ['wrap', {}],
    ['scroll', { overflow: 'scroll' as const }],
    ['disabled', { isDisabled: true }],
    ['loading', { isLoading: true }],
    ['one disabled', { items: chipGroupFixtures.oneDisabled.items }],
  ])('has no accessibility violations: %s', async (_name, extra) => {
    const { container } = render(<ChipGroup label="Kind" items={items} {...extra} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
