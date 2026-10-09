import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Typography } from '../../ui/typography'
import { AgentRoster } from './AgentRoster'
import {
  AGENTS_DUPLICATE_IDS,
  AGENTS_LARGE,
  AGENTS_MIXED,
  AGENTS_NOW,
  AGENT_AVAILABLE,
  AGENT_BLOCKED,
  AGENT_WORKING,
} from './agent-fixture'

const THREE = [AGENT_AVAILABLE, AGENT_WORKING, AGENT_BLOCKED]

function options() {
  return screen.getAllByRole('option')
}

function names() {
  return options().map((option) => option.getAttribute('aria-label')?.split(',')[0])
}

function selectedName() {
  return screen
    .queryAllByRole('option', { selected: true })
    .map((option) => option.getAttribute('aria-label')?.split(',')[0])
}

describe('AgentRoster', () => {
  it('lists live agents above past ones, each by state then recency', () => {
    render(<AgentRoster agents={AGENTS_MIXED} now={AGENTS_NOW} />)
    const live = within(screen.getByRole('group', { name: 'Live' }))
    const past = within(screen.getByRole('group', { name: 'Past' }))
    expect(live.getAllByRole('option')).toHaveLength(6)
    expect(past.getAllByRole('option')).toHaveLength(3)
    expect(names().slice(0, 3)).toEqual(['kiln-watcher', 'orchard-planner', 'seed-sorter'])
  })

  it('keeps the first of a duplicate id and both agents that share a name', () => {
    render(<AgentRoster agents={AGENTS_DUPLICATE_IDS} now={AGENTS_NOW} />)
    expect(names().filter((name) => name === 'orchard-planner')).toHaveLength(1)
    expect(names().filter((name) => name === 'grove-pruner')).toHaveLength(2)
    expect(screen.queryByText('A stale copy of the same session')).not.toBeInTheDocument()
  })

  it('selects on press when uncontrolled and reports the id', () => {
    const onChange = vi.fn()
    render(<AgentRoster agents={THREE} now={AGENTS_NOW} onSelectedIdChange={onChange} />)
    fireEvent.click(screen.getByText('quarry-scout'))
    expect(selectedName()).toEqual(['quarry-scout'])
    expect(onChange).toHaveBeenCalledWith(AGENT_AVAILABLE.id)
  })

  it('controlled selection does not change without the prop', () => {
    const onChange = vi.fn()
    render(
      <AgentRoster
        agents={THREE}
        now={AGENTS_NOW}
        selectedId={AGENT_WORKING.id}
        onSelectedIdChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('quarry-scout'))
    expect(onChange).toHaveBeenCalledWith(AGENT_AVAILABLE.id)
    expect(selectedName()).toEqual(['orchard-planner'])
  })

  it('makes the selected row the one tab stop, else the first', () => {
    const { rerender } = render(<AgentRoster agents={THREE} now={AGENTS_NOW} />)
    expect(options().map((o) => o.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
    rerender(<AgentRoster agents={THREE} now={AGENTS_NOW} selectedId={AGENT_AVAILABLE.id} />)
    expect(options().map((o) => o.getAttribute('tabindex'))).toEqual(['-1', '-1', '0'])
  })

  it('moves focus with Down, Up, Home and End, and stops at the ends', () => {
    render(<AgentRoster agents={THREE} now={AGENTS_NOW} />)
    const [first, second, third] = options()
    act(() => first.focus())
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'End' })
    expect(third).toHaveFocus()
    fireEvent.keyDown(third, { key: 'ArrowDown' })
    expect(third).toHaveFocus()
    fireEvent.keyDown(third, { key: 'Home' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'ArrowUp' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    fireEvent.keyDown(second, { key: 'ArrowUp' })
    expect(first).toHaveFocus()
  })

  it('does not select on focus move; Enter and Space select', () => {
    render(<AgentRoster agents={THREE} now={AGENTS_NOW} />)
    const [first, second, third] = options()
    act(() => first.focus())
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(selectedName()).toEqual([])
    fireEvent.keyDown(second, { key: 'Enter' })
    fireEvent.keyUp(second, { key: 'Enter' })
    expect(selectedName()).toEqual(['orchard-planner'])
    fireEvent.keyDown(second, { key: 'ArrowDown' })
    fireEvent.keyDown(third, { key: ' ' })
    expect(selectedName()).toEqual(['quarry-scout'])
  })

  it('never pulls focus into the list when the host re-sorts it', () => {
    function Host() {
      const [agents, setAgents] = useState(THREE)
      return (
        <>
          <button onClick={() => setAgents([...THREE].reverse())}>Re-sort</button>
          <AgentRoster
            agents={agents.map((agent, i) => ({
              ...agent,
              state: i === 0 ? 'blocked' : 'available',
            }))}
            now={AGENTS_NOW}
            selectedId={AGENT_AVAILABLE.id}
          />
        </>
      )
    }
    render(<Host />)
    const button = screen.getByRole('button', { name: 'Re-sort' })
    act(() => button.focus())
    fireEvent.click(button)
    expect(button).toHaveFocus()
  })

  it('shows skeleton rows and no empty state while loading', () => {
    render(<AgentRoster agents={[]} now={AGENTS_NOW} isLoading />)
    expect(screen.getByRole('group', { name: 'Loading agents' })).toBeInTheDocument()
    expect(screen.queryByText('No agents')).not.toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows the default empty state, or the host slot', () => {
    const { rerender } = render(<AgentRoster agents={[]} now={AGENTS_NOW} />)
    expect(screen.getByText('No agents')).toBeInTheDocument()
    rerender(
      <AgentRoster
        agents={[]}
        now={AGENTS_NOW}
        emptyState={<Typography>Broker offline</Typography>}
      />
    )
    expect(screen.getByText('Broker offline')).toBeInTheDocument()
  })

  it('renders 200 rows with unique keys', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<AgentRoster agents={AGENTS_LARGE} now={AGENTS_NOW} />)
    expect(options()).toHaveLength(200)
    expect(error).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything())
    error.mockRestore()
  })

  it.each([
    ['mixed', { agents: AGENTS_MIXED, selectedId: AGENT_WORKING.id }],
    ['loading', { agents: [], isLoading: true }],
    ['empty', { agents: [] }],
  ])('has no accessibility violations: %s', async (_, props) => {
    const { container } = render(<AgentRoster now={AGENTS_NOW} {...props} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
