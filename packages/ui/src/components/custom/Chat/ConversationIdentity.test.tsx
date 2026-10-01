import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { ConversationIdentity } from './ConversationIdentity'
import { COACH } from './coach-thread-fixture'

describe('ConversationIdentity', () => {
  it('names the other party with an avatar', () => {
    render(<ConversationIdentity participant={COACH} />)
    expect(screen.getByText('Coach')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Coach' })).toBeInTheDocument()
  })

  it('adds the description line when given one', () => {
    render(<ConversationIdentity participant={COACH} description="Weekly check-ins" />)
    expect(screen.getByText('Weekly check-ins')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ConversationIdentity participant={COACH} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
