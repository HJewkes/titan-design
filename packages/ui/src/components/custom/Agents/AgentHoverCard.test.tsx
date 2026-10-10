import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Pressable, Text } from 'react-native'
import { axe } from 'jest-axe'
import { AgentHoverCard, AgentHoverCardContent } from './AgentHoverCard'
import {
  AGENTS_NOW,
  AGENT_BLOCKED,
  AGENT_HOSTILE,
  AGENT_NON_FINITE,
  AGENT_NO_TRANSCRIPT,
  AGENT_WORKING,
} from './agent-fixture'

/** An element, not a wrapper component, so the card's trigger props reach the Pressable. */
const nameLink = (
  <Pressable accessibilityRole="link" testID="trigger" onPress={() => {}}>
    <Text>kiln-watcher</Text>
  </Pressable>
)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  fireEvent.mouseMove(document)
})

describe('AgentHoverCard', () => {
  it('opens on keyboard focus and describes the trigger, then closes on blur', () => {
    render(
      <AgentHoverCard agent={AGENT_BLOCKED} now={AGENTS_NOW} openDelay={0} closeDelay={0}>
        {nameLink}
      </AgentHoverCard>
    )
    const trigger = screen.getByTestId('trigger')
    expect(trigger).not.toHaveAttribute('aria-describedby')

    fireEvent.focus(trigger)
    act(() => vi.runAllTimers())
    const card = screen.getByRole('tooltip')
    expect(trigger).toHaveAttribute('aria-describedby', card.id)
    expect(card).toHaveTextContent('Needs approval to rotate the kiln schedule')

    fireEvent.blur(trigger)
    act(() => vi.runAllTimers())
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on hover after the open delay and closes on Escape', () => {
    render(
      <AgentHoverCard agent={AGENT_BLOCKED} now={AGENTS_NOW} openDelay={300}>
        {nameLink}
      </AgentHoverCard>
    )
    fireEvent.mouseEnter(screen.getByTestId('trigger'))
    act(() => vi.advanceTimersByTime(299))
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('wraps a plain-text trigger in a focusable one', () => {
    render(
      <AgentHoverCard agent={AGENT_WORKING} now={AGENTS_NOW} openDelay={0}>
        orchard-planner
      </AgentHoverCard>
    )
    const trigger = screen.getByTestId('agent-hover-card-trigger')
    expect(trigger).toHaveAttribute('tabindex', '0')
    fireEvent.focus(trigger)
    act(() => vi.runAllTimers())
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('isDisabled never opens, even when controlled open', () => {
    const onOpenChange = vi.fn()
    render(
      <AgentHoverCard
        agent={AGENT_WORKING}
        now={AGENTS_NOW}
        isDisabled
        isOpen
        onOpenChange={onOpenChange}
      >
        {nameLink}
      </AgentHoverCard>
    )
    fireEvent.focus(screen.getByTestId('trigger'))
    act(() => vi.runAllTimers())
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('follows a controlled isOpen and reports what the trigger asks for', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <AgentHoverCard
        agent={AGENT_WORKING}
        now={AGENTS_NOW}
        isOpen={false}
        openDelay={0}
        onOpenChange={onOpenChange}
      >
        {nameLink}
      </AgentHoverCard>
    )
    fireEvent.focus(screen.getByTestId('trigger'))
    act(() => vi.runAllTimers())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('tooltip')).toBeNull()

    rerender(
      <AgentHoverCard agent={AGENT_WORKING} now={AGENTS_NOW} isOpen onOpenChange={onOpenChange}>
        {nameLink}
      </AgentHoverCard>
    )
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    vi.useRealTimers()
    const { container } = render(
      <AgentHoverCard agent={AGENT_BLOCKED} now={AGENTS_NOW} defaultIsOpen>
        {nameLink}
      </AgentHoverCard>
    )
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    // The card is portalled to the body, so the page-level landmark rule is out of scope here.
    const results = await axe(container.ownerDocument.body, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})

describe('AgentHoverCardContent', () => {
  it('shows the metric figures and holds no focusable element', () => {
    const { container } = render(<AgentHoverCardContent agent={AGENT_WORKING} now={AGENTS_NOW} />)
    expect(screen.getByText('1.2M in · 86.4k out')).toBeInTheDocument()
    expect(screen.getByText('$4.81')).toBeInTheDocument()
    expect(container.querySelectorAll('[tabindex="0"], a, button')).toHaveLength(0)
  })

  it('shows the notice, not zeros, when there is no transcript', () => {
    render(<AgentHoverCardContent agent={AGENT_NO_TRANSCRIPT} now={AGENTS_NOW} />)
    expect(screen.getByText('No transcript for this session')).toBeInTheDocument()
    expect(screen.queryByTestId('agent-hover-card-metrics')).toBeNull()
  })

  it('never prints NaN, and renders declared text as text', () => {
    const { container, unmount } = render(
      <AgentHoverCardContent agent={AGENT_NON_FINITE} now={AGENTS_NOW} />
    )
    expect(container.textContent).not.toMatch(/NaN|Infinity/)
    unmount()
    render(<AgentHoverCardContent agent={AGENT_HOSTILE} now={AGENTS_NOW} />)
    expect(screen.getByText(/<script>alert\("orchard"\)<\/script>/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('flags an error rate above five percent', () => {
    render(<AgentHoverCardContent agent={AGENT_BLOCKED} now={AGENTS_NOW} />)
    expect(screen.getByText('11 · 9%')).toBeInTheDocument()
  })
})
