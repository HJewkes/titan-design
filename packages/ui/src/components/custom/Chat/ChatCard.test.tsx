import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { ChatCard } from './ChatCard'
import { CheckinCard } from './coach-cards'
import { CHECKIN } from './coach-thread-fixture'

describe('ChatCard', () => {
  it('lays out status, title, subtitle, body and small print', () => {
    render(
      <ChatCard status="Proposed" title="Plan change" subtitle="Thursday" footnote="From this week">
        Add 2.5 kg.
      </ChatCard>
    )
    const card = screen.getByTestId('chat-card')
    expect(card).toHaveTextContent('Proposed')
    expect(card).toHaveTextContent('Plan change')
    expect(card).toHaveTextContent('Thursday')
    expect(card).toHaveTextContent('Add 2.5 kg.')
    expect(card).toHaveTextContent('From this week')
  })

  it('renders a string subtitle without a bare text node in a View', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ChatCard title="Plan change" subtitle="Thursday" />)
    expect(screen.getByText('Thursday')).toBeInTheDocument()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('runs each action when pressed', () => {
    const onAccept = vi.fn()
    render(
      <ChatCard
        title="Plan change"
        actions={[
          { key: 'accept', label: 'Accept', onPress: onAccept },
          { key: 'decline', label: 'Decline' },
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('shows no more than three actions', () => {
    const actions = ['a', 'b', 'c', 'd'].map((key) => ({ key, label: key }))
    render(<ChatCard title="Pick one" actions={actions} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('omits the body and footer for a title-only card', () => {
    render(<ChatCard title="Noted" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('carries the check-in lockup as one instance of the same anatomy', () => {
    render(<CheckinCard checkin={CHECKIN} />)
    const card = screen.getByTestId('chat-card')
    expect(card).toHaveTextContent('Sunday check-in')
    expect(card).toHaveTextContent('Scheduled')
    expect(card).toHaveTextContent("Review last week's four sessions")
    expect(card).toHaveTextContent('15 min')
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ChatCard title="Plan change" actions={[{ key: 'ok', label: 'OK' }]} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
