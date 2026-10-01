import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AccessibilityInfo, Platform } from 'react-native'

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

  it('keeps its polite live region mounted while nobody is typing', () => {
    const { rerender } = render(<TypingIndicator participants={[]} />)
    const region = screen.getByTestId('chat-typing-region')
    expect(region).toHaveAttribute('aria-live', 'polite')

    rerender(<TypingIndicator participants={[COACH]} />)
    expect(screen.getByTestId('chat-typing-region')).toBe(region)
    expect(region).toContainElement(screen.getByText('Coach is typing'))
  })

  describe('on iOS', () => {
    const originalOS = Platform.OS
    afterEach(() => {
      Platform.OS = originalOS
      vi.restoreAllMocks()
    })

    it('announces through AccessibilityInfo when someone starts typing', () => {
      Platform.OS = 'ios'
      const announce = vi
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined)
      const { rerender } = render(<TypingIndicator participants={[]} />)
      rerender(<TypingIndicator participants={[COACH]} />)
      rerender(<TypingIndicator participants={[COACH]} />)
      rerender(<TypingIndicator participants={[]} />)
      expect(announce.mock.calls).toEqual([['Coach is typing']])
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TypingIndicator participants={[COACH]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
