import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Pill } from '../../ui/pill'
import { AgentRosterRow } from './AgentRosterRow'
import {
  AGENTS_NOW,
  AGENT_BARE,
  AGENT_BLOCKED,
  AGENT_HOSTILE,
  AGENT_NO_TRANSCRIPT,
  AGENT_WORKING,
} from './agent-fixture'

const LISTBOX_ROLE = 'listbox' as ViewProps['role']

function Listbox({ children }: { children: ReactNode }) {
  return (
    <View role={LISTBOX_ROLE} aria-label="Agents">
      {children}
    </View>
  )
}

describe('AgentRosterRow', () => {
  it('shows name, state and the default fields: task, idle and cost', () => {
    render(<AgentRosterRow agent={AGENT_WORKING} now={AGENTS_NOW} />)
    expect(screen.getByText('orchard-planner')).toBeInTheDocument()
    expect(screen.getByText('Working')).toBeInTheDocument()
    expect(screen.getByText(AGENT_WORKING.task as string)).toBeInTheDocument()
    expect(screen.getByText('2m ago · $4.81')).toBeInTheDocument()
    expect(screen.queryByText('feat/orchard-ledger-totals')).not.toBeInTheDocument()
  })

  it('prints chosen fields in a fixed order and skips the ones the agent lacks', () => {
    render(
      <AgentRosterRow
        agent={AGENT_NO_TRANSCRIPT}
        now={AGENTS_NOW}
        fields={['tokens', 'branch', 'idle']}
      />
    )
    expect(screen.getByText('4m ago · feat/seed-seasons')).toBeInTheDocument()
  })

  it('is inert text without onSelect', () => {
    render(<AgentRosterRow agent={AGENT_BARE} now={AGENTS_NOW} />)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.getByText('bare-agent')).toBeInTheDocument()
  })

  it('is an option named by the agent summary with onSelect', () => {
    const onSelect = vi.fn()
    render(
      <Listbox>
        <AgentRosterRow agent={AGENT_BLOCKED} now={AGENTS_NOW} isSelected onSelect={onSelect} />
      </Listbox>
    )
    const option = screen.getByRole('option', { selected: true })
    expect(option).toHaveAccessibleName(/^kiln-watcher, Blocked, do not disturb/)
    expect(screen.getByTestId('agent-roster-row-accent')).toBeInTheDocument()
    fireEvent.click(option)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('renders hostile declared text as text', () => {
    render(<AgentRosterRow agent={AGENT_HOSTILE} now={AGENTS_NOW} />)
    expect(screen.getByText(/<script>alert\("orchard"\)<\/script>/)).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })

  it('renders the trailing slot', () => {
    render(
      <AgentRosterRow
        agent={AGENT_WORKING}
        now={AGENTS_NOW}
        trailing={<Pill size="xs">seat</Pill>}
      />
    )
    expect(screen.getByText('seat')).toBeInTheDocument()
  })

  it('has no accessibility violations: inert, outside a listbox', async () => {
    const { container } = render(<AgentRosterRow agent={AGENT_WORKING} now={AGENTS_NOW} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    ['option', { onSelect: () => {} }],
    ['selected option', { onSelect: () => {}, isSelected: true }],
  ])('has no accessibility violations: %s', async (_, props) => {
    const { container } = render(
      <Listbox>
        <AgentRosterRow agent={AGENT_WORKING} now={AGENTS_NOW} {...props} />
      </Listbox>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
