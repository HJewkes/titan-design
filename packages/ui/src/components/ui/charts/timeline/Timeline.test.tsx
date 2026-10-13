import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Timeline } from './Timeline'
import type { TimelineItem } from './timeline-model'

const items: TimelineItem[] = [
  { id: 'intro', at: 0, label: 'Intro', tone: 'primary' },
  { id: 'setup', at: 20, label: 'Setup' },
  { id: 'build', at: 50, label: 'Build', tone: 'success' },
  { id: 'debug', at: 75, label: 'Debug', tone: 'warning' },
  { id: 'wrap', at: 100, label: 'Wrap-up' },
]

describe('Timeline', () => {
  it('renders one list item per event', () => {
    render(<Timeline accessibilityLabel="Chapters" items={items} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(items.length)
  })

  it('puts the playhead at its fraction of the width', () => {
    render(<Timeline accessibilityLabel="Chapters" items={items} playhead={0.25} />)
    expect(screen.getByTestId('timeline-playhead')).toHaveStyle({ left: '25%' })
  })

  it('places the playhead within the pan window', () => {
    render(
      <Timeline accessibilityLabel="Chapters" items={items} playhead={0.75} window={[0.5, 1]} />
    )
    expect(screen.getByTestId('timeline-playhead')).toHaveStyle({ left: '50%' })
  })

  it('leaves out the events before a second-half window', () => {
    render(<Timeline accessibilityLabel="Chapters" items={items} window={[0.5, 1]} />)
    expect(screen.queryByText('Intro')).not.toBeInTheDocument()
    expect(screen.queryByText('Setup')).not.toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
  })

  it('runs down the page when vertical', () => {
    render(
      <Timeline accessibilityLabel="Chapters" items={items} playhead={0.5} orientation="vertical" />
    )
    expect(screen.getByTestId('timeline-playhead')).toHaveStyle({ top: '50%' })
  })

  it('renders the same tree for the same props', () => {
    const first = render(<Timeline accessibilityLabel="Chapters" items={items} playhead={0.4} />)
    const html = first.container.innerHTML
    first.unmount()
    const second = render(<Timeline accessibilityLabel="Chapters" items={items} playhead={0.4} />)
    expect(second.container.innerHTML).toBe(html)
  })

  it('shows the default empty state with no events', () => {
    render(<Timeline accessibilityLabel="Chapters" items={[]} />)
    expect(screen.getByText('No events')).toBeInTheDocument()
  })

  it('shows a busy skeleton while loading', () => {
    render(<Timeline accessibilityLabel="Chapters" items={items} isLoading />)
    expect(screen.queryByText('Intro')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Chapters')).toHaveAttribute('aria-busy', 'true')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Timeline accessibilityLabel="Chapters" items={items} playhead={0.25} window={[0.5, 1]} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations when empty or loading', async () => {
    const { container } = render(
      <>
        <Timeline accessibilityLabel="Empty chapters" items={[]} />
        <Timeline accessibilityLabel="Loading chapters" items={items} isLoading />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
