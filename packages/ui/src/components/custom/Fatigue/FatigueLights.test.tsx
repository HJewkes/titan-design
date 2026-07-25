import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FatigueLights } from './FatigueLights'
import type { FatigueVerdict } from './fatigue-model'

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
