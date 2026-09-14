import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FatigueLights } from './FatigueLights'
import type { FatigueVerdict } from './fatigue-model'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'

const dims: FatigueVerdict['dimensions'] = { velocityLoss: 'alarm', rom: 'warn', tempo: 'ok' }

describe('FatigueLights', () => {
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
  const source = siblingSource(import.meta.url, 'FatigueLights.tsx')

  it('spaces a dot from its label by gap-inline-sm', () => {
    expect(spacingClassesIn(source, 'Light')).toEqual(['gap-inline-sm'])
    expect(resolveAll(['gap-inline-sm'])).toEqual(['4px'])
  })

  it('spaces the three lights by gap-4 when not spread', () => {
    expect(source).toContain("spread ? 'justify-between' : 'justify-start gap-4'")
    expect(resolveAll(['gap-4'])).toEqual(['16px'])
  })
})
