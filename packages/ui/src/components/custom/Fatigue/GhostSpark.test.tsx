import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GhostSpark } from './GhostSpark'
import { FATIGUE_STATES } from './fatigue-mock'

const model = FATIGUE_STATES[3].model // the full 8-rep set

describe('GhostSpark', () => {
  it('renders without crashing for a populated set', () => {
    render(<GhostSpark curves={model.velocityCurves} width={360} height={180} />)
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('renders an empty box for no curves', () => {
    render(<GhostSpark curves={[]} width={360} height={180} />)
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('does not render a peak annotation (chrome removed)', () => {
    render(<GhostSpark curves={model.velocityCurves} width={360} height={180} />)
    expect(screen.queryByText(/peak/)).not.toBeInTheDocument()
  })

  it('renders one ghost path per prior rep plus the current line + soft ground', () => {
    const { container } = render(
      <GhostSpark curves={model.velocityCurves} width={360} height={180} />
    )
    // 7 ghosts + 2 current (soft ground + tint line) = 9 paths for an 8-rep set.
    expect(container.querySelectorAll('path')).toHaveLength(9)
  })

  it('draws the wide phase band (rects) for the current rep phase runs', () => {
    const { container } = render(
      <GhostSpark curves={model.velocityCurves} width={360} height={180} />
    )
    // one band rect per phase segment (ecc / pause / con / hold ⇒ ≥ 2).
    expect(container.querySelectorAll('rect').length).toBeGreaterThanOrEqual(2)
  })

  it('always shows the ECC / CON band labels (no longer hover-gated)', () => {
    render(<GhostSpark curves={model.velocityCurves} width={360} height={180} />)
    expect(screen.getByText('ECC')).toBeInTheDocument()
    expect(screen.getByText('CON')).toBeInTheDocument()
  })
})
