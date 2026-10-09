import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AgentStateLabel } from './AgentStateLabel'
import { AGENT_STATE_ORDER, AGENT_STATE_META } from './agent-state'

describe('AgentStateLabel', () => {
  it('pairs every state dot with its word', () => {
    for (const state of AGENT_STATE_ORDER) {
      const { unmount } = render(<AgentStateLabel state={state} />)
      expect(screen.getByText(AGENT_STATE_META[state].label)).toBeInTheDocument()
      expect(screen.getByTestId(`agent-state-dot-${state}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('hides the dot from assistive tech, since the word carries the state', () => {
    render(<AgentStateLabel state="working" />)
    expect(screen.getByTestId('agent-state-dot-working')).toHaveAttribute('aria-hidden', 'true')
  })

  it('adds the do-not-disturb pill only when isDnd is set', () => {
    const { rerender } = render(<AgentStateLabel state="blocked" />)
    expect(screen.queryByText('DND')).not.toBeInTheDocument()
    rerender(<AgentStateLabel state="blocked" isDnd />)
    expect(screen.getByText('DND')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<AgentStateLabel state="blocked" isDnd size="md" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
