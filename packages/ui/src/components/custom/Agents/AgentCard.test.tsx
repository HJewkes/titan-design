import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Typography } from '../../ui/typography'
import { AgentCard } from './AgentCard'
import {
  AGENTS_NOW,
  AGENT_BARE,
  AGENT_BLOCKED,
  AGENT_HOSTILE,
  AGENT_HUGE,
  AGENT_NON_FINITE,
  AGENT_NO_TRANSCRIPT,
  AGENT_PROVISIONAL,
  AGENT_RETIRED,
  AGENT_WORKING,
  AGENT_ZERO_CALLS,
} from './agent-fixture'

describe('AgentCard', () => {
  it('shows status, task, branch, recency, tokens, tool calls, errors, cost and activity', () => {
    render(<AgentCard agent={AGENT_WORKING} now={AGENTS_NOW} />)
    expect(screen.getByText('Working')).toBeInTheDocument()
    expect(screen.getByText(AGENT_WORKING.task as string)).toBeInTheDocument()
    expect(screen.getByText('feat/orchard-ledger-totals')).toBeInTheDocument()
    expect(screen.getByText('Last event 2m ago')).toBeInTheDocument()
    const metrics = within(screen.getByTestId('agent-card-metrics'))
    expect(metrics.getByText('1.2M in · 86.4k out')).toBeInTheDocument()
    expect(metrics.getByText('312')).toBeInTheDocument()
    expect(metrics.getByText('$4.81')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Tool calls per interval/ })).toBeInTheDocument()
  })

  it('is a group named by the agent summary, never a button', () => {
    render(<AgentCard agent={AGENT_BLOCKED} now={AGENTS_NOW} onPress={() => {}} />)
    expect(
      screen.getByRole('group', { name: /^kiln-watcher, Blocked, do not disturb/ })
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the notice, not zeros, when there is no transcript', () => {
    render(<AgentCard agent={AGENT_NO_TRANSCRIPT} now={AGENTS_NOW} />)
    expect(screen.getByText('No transcript for this session')).toBeInTheDocument()
    expect(screen.queryByTestId('agent-card-metrics')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('keeps a known cost beside the notice, and takes a custom empty slot', () => {
    const { rerender } = render(<AgentCard agent={AGENT_RETIRED} now={AGENTS_NOW} />)
    expect(screen.getByText('Cost $12.75')).toBeInTheDocument()
    rerender(
      <AgentCard
        agent={AGENT_RETIRED}
        now={AGENTS_NOW}
        metricsEmpty={<Typography>Transcript pruned</Typography>}
      />
    )
    expect(screen.getByText('Transcript pruned')).toBeInTheDocument()
  })

  it('renders declared task text as text', () => {
    render(<AgentCard agent={AGENT_HOSTILE} now={AGENTS_NOW} />)
    expect(screen.getByText(/<script>alert\("orchard"\)<\/script>/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })

  it('caps tags at three and counts the rest', () => {
    render(<AgentCard agent={AGENT_HOSTILE} now={AGENTS_NOW} />)
    expect(screen.getByText('tag-3')).toBeInTheDocument()
    expect(screen.queryByText('tag-4')).not.toBeInTheDocument()
    expect(screen.getByText('+9')).toBeInTheDocument()
  })

  it('never prints NaN or Infinity', () => {
    const { container } = render(<AgentCard agent={AGENT_NON_FINITE} now={AGENTS_NOW} />)
    expect(container.textContent).not.toMatch(/NaN|Infinity/)
    expect(screen.getByText('Last event —')).toBeInTheDocument()
  })

  it('flags an error rate above five percent', () => {
    render(<AgentCard agent={AGENT_BLOCKED} now={AGENTS_NOW} />)
    expect(screen.getByText('11 · 9%')).toBeInTheDocument()
  })

  it('does not flag a session with no tool calls', () => {
    render(<AgentCard agent={AGENT_ZERO_CALLS} now={AGENTS_NOW} />)
    const metrics = within(screen.getByTestId('agent-card-metrics'))
    expect(metrics.getAllByText('0')).toHaveLength(2)
    expect(metrics.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('caps the spark at 24 bars and the context bar at full', () => {
    render(<AgentCard agent={AGENT_HUGE} now={AGENTS_NOW} />)
    expect(screen.getAllByTestId(/^spark-bars-bar-/)).toHaveLength(24)
    expect(screen.getByText('$4,812.50')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('makes the name the only link for onPress, and the task pill a second', () => {
    const onPress = vi.fn()
    const onPressTask = vi.fn()
    render(
      <AgentCard
        agent={AGENT_WORKING}
        now={AGENTS_NOW}
        onPress={onPress}
        onPressTask={onPressTask}
      />
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    fireEvent.click(screen.getByText('orchard-planner'))
    fireEvent.click(screen.getByText('ORC-41'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPressTask).toHaveBeenCalledWith('ORC-41')
  })

  it('says when there is no stated task and renders a bare agent', () => {
    render(<AgentCard agent={AGENT_BARE} now={AGENTS_NOW} />)
    expect(screen.getByText('No stated task')).toBeInTheDocument()
    expect(screen.getByText('Last event —')).toBeInTheDocument()
  })

  it('marks a provisional name', () => {
    render(<AgentCard agent={AGENT_PROVISIONAL} now={AGENTS_NOW} />)
    expect(screen.getByText('Provisional name')).toBeInTheDocument()
  })

  it('renders the skeleton and no agent text while loading', () => {
    render(<AgentCard agent={AGENT_WORKING} now={AGENTS_NOW} isLoading />)
    expect(screen.queryByText('orchard-planner')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Loading agent' })).toBeInTheDocument()
  })

  it.each([
    ['default', { agent: AGENT_WORKING }],
    ['loading', { agent: AGENT_WORKING, isLoading: true }],
    ['no transcript', { agent: AGENT_NO_TRANSCRIPT }],
    ['hostile', { agent: AGENT_HOSTILE }],
    ['links', { agent: AGENT_WORKING, onPress: () => {}, onPressTask: () => {} }],
  ])('has no accessibility violations: %s', async (_, props) => {
    const { container } = render(<AgentCard now={AGENTS_NOW} {...props} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
