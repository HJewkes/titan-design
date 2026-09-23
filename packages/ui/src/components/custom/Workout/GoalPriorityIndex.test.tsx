import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { GoalPriorityIndex, groupPriorities } from './GoalPriorityIndex'
import { NINE_PRIORITIES as NINE } from './goalPriorityIndex-fixture'

describe('groupPriorities', () => {
  it('groups by level in level order, keeping declaration order inside a group', () => {
    expect(groupPriorities(NINE)).toEqual([
      { level: 'specialize', names: ['Bench press', 'Back', 'Shoulders'] },
      { level: 'maintain', names: ['Squat', 'Chest', 'Biceps', 'Deadlift', 'Bodyweight'] },
      { level: 'deprioritize', names: ['Calves (no target)'] },
    ])
  })

  it('skips a level nobody declared', () => {
    const groups = groupPriorities([{ name: 'Bench press', level: 'specialize', hasTarget: true }])
    expect(groups.map((group) => group.level)).toEqual(['specialize'])
  })

  it('returns no groups for no priorities', () => {
    expect(groupPriorities([])).toEqual([])
  })
})

describe('GoalPriorityIndex', () => {
  it('renders nothing with no priorities', () => {
    const { container } = render(<GoalPriorityIndex priorities={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one group per declared level (F15)', () => {
    render(<GoalPriorityIndex priorities={NINE} />)
    expect(screen.getAllByTestId('goal-priority-index-group')).toHaveLength(3)
  })

  it('names a priority nothing tracks', () => {
    render(<GoalPriorityIndex priorities={NINE} />)
    expect(screen.getByText('Calves (no target)')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<GoalPriorityIndex priorities={NINE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
