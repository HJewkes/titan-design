import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedClassNames } from '../../../test/classname-capture'
import { InitiativeCard, type InitiativeState } from './InitiativeCard'

const base = {
  title: 'planner — durable project state',
  slug: 'planner',
  openCount: 4,
  severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
}

describe('InitiativeCard', () => {
  it('renders title, slug, and open count', () => {
    render(<InitiativeCard {...base} state="focused" />)
    expect(screen.getByText(base.title)).toBeInTheDocument()
    expect(screen.getByText(base.slug)).toBeInTheDocument()
    expect(screen.getByText('4 open')).toBeInTheDocument()
  })

  it('renders a rank pill only when rank is given', () => {
    const { rerender } = render(<InitiativeCard {...base} state="focused" rank={1} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
    rerender(<InitiativeCard {...base} state="focused" />)
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
  })

  it('renders the top task when given', () => {
    render(
      <InitiativeCard
        {...base}
        state="focused"
        topTask={{ id: 'PL-6', title: 'Discovery sources' }}
      />
    )
    expect(screen.getByText('PL-6')).toBeInTheDocument()
    expect(screen.getByText('Discovery sources')).toBeInTheDocument()
  })

  it('renders a fallback when there is no top task', () => {
    render(<InitiativeCard {...base} state="focused" topTask={undefined} />)
    expect(screen.getByText('no open tasks')).toBeInTheDocument()
  })

  it('labels every lifecycle state', () => {
    const states: InitiativeState[] = ['focused', 'backburner', 'paused', 'done']
    for (const state of states) {
      const { unmount } = render(<InitiativeCard {...base} state={state} />)
      unmount()
    }
  })

  it('omits the severity bar when all counts are zero', () => {
    render(
      <InitiativeCard
        {...base}
        state="done"
        severityCounts={{ critical: 0, high: 0, medium: 0, low: 0 }}
      />
    )
    expect(screen.queryByTestId('segmented-bar-segment')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<InitiativeCard {...base} state="focused" rank={1} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('InitiativeCard className merge', () => {
  it('lets a caller class replace the root class it conflicts with', () => {
    render(<InitiativeCard {...base} state="focused" className="p-2" testID="cn-root" />)
    const classes = capturedClassNames.get('cn-root')?.split(/\s+/)
    expect(classes).toContain('p-2')
    expect(classes).not.toContain('p-4')
  })
})

describe('InitiativeCard as a link', () => {
  it('is static with neither onPress nor href', () => {
    render(<InitiativeCard {...base} state="focused" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('is one link named by the initiative title and one tab stop', () => {
    const { container } = render(
      <InitiativeCard {...base} state="focused" rank={1} onPress={() => {}} />
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: base.title })).toBeInTheDocument()
    const tabbable = container.querySelectorAll('[tabindex]:not([tabindex="-1"]), a[href], button')
    expect(tabbable).toHaveLength(1)
  })

  it('calls onPress when activated', () => {
    const onPress = vi.fn()
    render(<InitiativeCard {...base} state="focused" onPress={onPress} />)
    fireEvent.click(screen.getByRole('link', { name: base.title }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('activates from the keyboard', () => {
    const onPress = vi.fn()
    render(<InitiativeCard {...base} state="focused" onPress={onPress} />)
    const link = screen.getByRole('link', { name: base.title })
    fireEvent.keyDown(link, { key: 'Enter' })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('carries the href when given', () => {
    render(<InitiativeCard {...base} state="focused" href="/initiatives/planner" />)
    expect(screen.getByRole('link', { name: base.title })).toHaveAttribute(
      'href',
      '/initiatives/planner'
    )
  })

  it('renders the meta slot after the top task without adding a link', () => {
    render(
      <InitiativeCard {...base} state="focused" onPress={() => {}} meta={<span>3 days ago</span>} />
    )
    expect(screen.getByText('3 days ago')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('has no accessibility violations as a link', async () => {
    const { container } = render(
      <InitiativeCard
        {...base}
        state="focused"
        href="/x"
        onPress={() => {}}
        meta={<span>new</span>}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
