import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'

import { GoalPriorityIcon, GOAL_PRIORITY_MEANING, type GoalPriority } from './GoalPriorityIcon'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const dark = getSemanticColors('dark')
const PRIORITIES: GoalPriority[] = ['specialize', 'maintain', 'deprioritize']

function glyph(container: HTMLElement): string {
  return [...container.querySelectorAll('svg path, svg circle')]
    .map((el) => el.getAttribute('d') ?? el.getAttribute('r') ?? '')
    .join('|')
}

describe('GoalPriorityIcon', () => {
  it('names the priority for assistive tech', () => {
    render(<GoalPriorityIcon priority="specialize" />)
    expect(screen.getByRole('button', { name: 'Priority: Specialize' })).toBeInTheDocument()
  })

  it('draws a different glyph for each level', () => {
    const drawn = PRIORITIES.map((priority) => {
      const { container, unmount } = render(<GoalPriorityIcon priority={priority} />)
      const d = glyph(container)
      unmount()
      return d
    })
    expect(new Set(drawn).size).toBe(PRIORITIES.length)
  })

  it('gives the accent only to the level worth the attention', () => {
    const colorOf = (priority: GoalPriority): string | null => {
      const { container, unmount } = render(<GoalPriorityIcon priority={priority} />)
      const stroke = container.querySelector('svg')?.getAttribute('stroke') ?? null
      unmount()
      return stroke
    }
    expect(colorOf('specialize')).toBe(dark['brand-secondary'])
    expect(colorOf('maintain')).toBe(dark['text-secondary'])
    expect(colorOf('deprioritize')).toBe(dark['text-tertiary'])
  })

  it('never borrows a status tone', () => {
    const statuses = [dark['status-success'], dark['status-warning'], dark['status-info']]
    PRIORITIES.forEach((priority) => {
      const { container, unmount } = render(<GoalPriorityIcon priority={priority} />)
      expect(statuses).not.toContain(container.querySelector('svg')?.getAttribute('stroke'))
      unmount()
    })
  })

  it('opens what the level means on hover', () => {
    render(<GoalPriorityIcon priority="maintain" />)

    fireEvent.mouseEnter(screen.getByTestId('goal-priority-icon'))

    expect(screen.getByText(GOAL_PRIORITY_MEANING.maintain)).toBeInTheDocument()
  })

  it('renders a bare image when the tip is off', () => {
    render(<GoalPriorityIcon priority="deprioritize" withTip={false} />)
    expect(screen.getByRole('img', { name: 'Priority: Deprioritize' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<GoalPriorityIcon priority="specialize" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
