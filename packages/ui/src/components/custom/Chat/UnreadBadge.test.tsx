import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { UnreadBadge } from './UnreadBadge'

describe('UnreadBadge', () => {
  it('renders nothing when there is nothing unread', () => {
    render(<UnreadBadge count={0} />)
    expect(screen.queryByTestId('chat-unread-badge')).toBeNull()
  })

  it('shows a bare count without a press handler', () => {
    render(<UnreadBadge count={4} />)
    expect(screen.getByTestId('chat-unread-badge')).toHaveTextContent(/^4$/)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('caps the count at max', () => {
    render(<UnreadBadge count={120} />)
    expect(screen.getByTestId('chat-unread-badge')).toHaveTextContent('99+')
  })

  it('becomes a jump button that spells out its count when pressable', () => {
    const onPress = vi.fn()
    render(<UnreadBadge count={1} onPress={onPress} />)
    const button = screen.getByRole('button', { name: '1 new message' })
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('pluralises the jump label', () => {
    render(<UnreadBadge count={3} max={2} onPress={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('2+ new messages')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<UnreadBadge count={3} onPress={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
