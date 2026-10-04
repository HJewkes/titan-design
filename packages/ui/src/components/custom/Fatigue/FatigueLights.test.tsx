import { describe, it, expect } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen } from '@testing-library/react'
import { FatigueLights } from './FatigueLights'
import type { FatigueVerdict } from './fatigue-model'
import { resolveAll, spacingClassesAt, spacingClassesOf } from '../../../test/spacing-resolver'

const dims: FatigueVerdict['dimensions'] = { velocityLoss: 'alarm', rom: 'warn', tempo: 'ok' }

describe('FatigueLights', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<FatigueLights dimensions={dims} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders the three VEL/ROM/TEMPO labels', () => {
    render(<FatigueLights dimensions={dims} />)
    expect(screen.getByText('VEL')).toBeInTheDocument()
    expect(screen.getByText('ROM')).toBeInTheDocument()
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('composes three StatusDot primitives', () => {
    render(<FatigueLights dimensions={dims} />)
    expect(screen.getAllByTestId('status-dot')).toHaveLength(3)
  })

  it('labels each dimension with its detail + status word', () => {
    render(<FatigueLights dimensions={dims} />)
    expect(screen.getByLabelText('Velocity loss, alarm')).toBeInTheDocument()
    expect(screen.getByLabelText('ROM depth, watch')).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo, ok')).toBeInTheDocument()
  })

  it('renders neutral "warming up" lights when dimensions are null', () => {
    render(<FatigueLights dimensions={null} />)
    expect(screen.getByLabelText('Velocity loss, warming up')).toBeInTheDocument()
    expect(screen.getAllByTestId('status-dot')).toHaveLength(3)
  })
})

/**
 * The lights' spacing, pinned (AW-142 wave three).
 *
 * The dot-to-label gap was 5 and is now `gap-inline-sm` (4). 5 bought nothing: StatusDot's
 * glow is a 12px blur, so its halo reaches past the label at either value, and the 1px was
 * not the thing separating them. The 16px gap between the three lights is the numeric rung
 * `gap-4` — it is horizontal and the inline ramp stops at 12.
 */
describe('FatigueLights geometry resolves to the spacing tokens', () => {
  it('spaces a dot from its label by gap-inline-sm', () => {
    render(<FatigueLights dimensions={dims} />)
    expect(spacingClassesAt(screen.getByLabelText('Velocity loss, alarm'))).toEqual([
      'gap-inline-sm',
    ])
    expect(resolveAll(['gap-inline-sm'])).toEqual(['4px'])
  })

  it.each([
    ['grouped', false, ['gap-4']],
    ['spread', true, []],
  ] as const)('%s, the three lights carry %j', (_label, spread, classes) => {
    render(<FatigueLights dimensions={dims} spread={spread} />)
    expect(spacingClassesOf('fatigue-lights')).toEqual([...classes])
    expect(resolveAll(['gap-4'])).toEqual(['16px'])
  })
})
