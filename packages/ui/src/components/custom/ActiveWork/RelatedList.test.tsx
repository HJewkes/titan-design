import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { RelatedList, groupRefsByKind } from './RelatedList'
import { REF_FIXTURE } from './ref-fixture'

describe('groupRefsByKind', () => {
  it('orders groups by kind and keeps input order inside a group', () => {
    const groups = groupRefsByKind(REF_FIXTURE)
    expect(groups.map((g) => g.kind)).toEqual([
      'task',
      'pr',
      'session',
      'agent',
      'note',
      'file',
      'initiative',
    ])
    expect(groups[0].refs.map((r) => r.label)).toEqual(['PL-18', 'PL-20'])
  })

  it('drops kinds with no refs', () => {
    const groups = groupRefsByKind(REF_FIXTURE.filter((r) => r.kind === 'session'))
    expect(groups).toHaveLength(1)
  })
})

describe('RelatedList', () => {
  it('heads each group with its plural and count', () => {
    render(<RelatedList refs={REF_FIXTURE} />)
    const sessions = screen.getByRole('group', { name: 'Sessions, 2' })
    expect(within(sessions).getAllByRole('listitem')).toHaveLength(2)
    expect(within(sessions).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Tasks, 2' })).toBeInTheDocument()
  })

  it('calls onPressRef with the pressed ref', () => {
    const onPressRef = vi.fn()
    render(<RelatedList refs={REF_FIXTURE} onPressRef={onPressRef} />)
    fireEvent.click(screen.getByRole('link', { name: /Agent planner-impl/ }))
    expect(onPressRef).toHaveBeenCalledWith(expect.objectContaining({ id: 'agent:planner-impl' }))
  })

  it('renders the default empty state with no refs', async () => {
    const { container } = render(<RelatedList refs={[]} />)
    expect(screen.getByText('Nothing related')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders a caller empty state in place of the default', () => {
    render(<RelatedList refs={[]} emptyState={<>No linked sessions</>} />)
    expect(screen.getByText('No linked sessions')).toBeInTheDocument()
    expect(screen.queryByText('Nothing related')).not.toBeInTheDocument()
  })

  it('swaps the groups for placeholders while loading', async () => {
    const { container } = render(<RelatedList refs={REF_FIXTURE} isLoading />)
    expect(screen.getByLabelText('Loading related items')).toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no a11y violations with every kind present', async () => {
    const { container } = render(<RelatedList refs={REF_FIXTURE} onPressRef={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
