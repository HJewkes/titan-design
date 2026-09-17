import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { TypingIndicator } from './TypingIndicator'
import { ATHLETE, COACH } from './coach-thread-fixture'

describe('TypingIndicator', () => {
  it('renders nothing while nobody is typing', () => {
    render(<TypingIndicator participants={[]} />)
    expect(screen.queryByTestId('chat-typing-indicator')).toBeNull()
  })

  it('names a single typist', () => {
    render(<TypingIndicator participants={[COACH]} />)
    expect(screen.getByText('Coach is typing')).toBeInTheDocument()
  })

  it('names two typists', () => {
    render(<TypingIndicator participants={[COACH, ATHLETE]} />)
    expect(screen.getByText('Coach and Alex Rivera are typing')).toBeInTheDocument()
  })

  it('counts three or more typists instead of listing them', () => {
    const third = { ...ATHLETE, id: 'third', displayName: 'Sam' }
    render(<TypingIndicator participants={[COACH, ATHLETE, third]} />)
    expect(screen.getByText('3 people are typing')).toBeInTheDocument()
  })

  it('keeps only the dots when asked', () => {
    render(<TypingIndicator participants={[COACH]} dotsOnly />)
    expect(screen.getByTestId('chat-typing-indicator')).toBeInTheDocument()
    expect(screen.queryByText('Coach is typing')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TypingIndicator participants={[COACH]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
