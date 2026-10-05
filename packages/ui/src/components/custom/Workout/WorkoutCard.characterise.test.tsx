import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './WorkoutCard.stories'
import { WorkoutCard, type WorkoutCardProps, type WorkoutStatus } from './WorkoutCard'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const storyEntries = Object.entries(composed)

const base = composed.Expanded.args as WorkoutCardProps

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const statuses: WorkoutStatus[] = ['completed', 'today', 'upcoming']

const fixtures: [string, Partial<WorkoutCardProps>][] = [
  ['no muscle groups', { muscleGroups: [] }],
  [
    'a muscle without volumeStatus',
    { muscleGroups: [{ group: 'calves', label: 'Calves' }, ...base.muscleGroups] },
  ],
  ['expanded with no exercises', { exercises: [] }],
  ['expanded with undefined exercises', { exercises: undefined }],
  ['expanded with no onToggle', { onToggle: undefined }],
  ['collapsed with exercises', { expanded: false }],
  ['custom className', { className: 'mt-4' }],
  ...statuses.map((status): [string, Partial<WorkoutCardProps>] => [
    `${status} expanded`,
    { status },
  ]),
  ...statuses.map((status): [string, Partial<WorkoutCardProps>] => [
    `${status} static`,
    { status, expanded: false, onToggle: undefined },
  ]),
]

describe('WorkoutCard characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(storyEntries)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expectUnchanged(container)
    })

    it.each(fixtures)('renders the %s fixture unchanged', (_name, overrides) => {
      const { container } = render(
        <Surface theme={theme}>
          <WorkoutCard {...base} {...overrides} />
        </Surface>
      )
      expectUnchanged(container)
    })
  })
})
