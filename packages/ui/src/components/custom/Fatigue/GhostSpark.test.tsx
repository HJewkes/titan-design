import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GhostSpark } from './GhostSpark'
import { FATIGUE_STATES } from './fatigue-mock'

const model = FATIGUE_STATES[3].model // the full 8-rep set

describe('GhostSpark', () => {
  it('renders without crashing for a populated set', () => {
    render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
      />
    )
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('renders an empty box for no curves', () => {
    render(<GhostSpark curves={[]} tempoSeconds={null} width={360} height={180} />)
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('hides the peak annotation at rest', () => {
    render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
      />
    )
    expect(screen.queryByText(/peak/)).not.toBeInTheDocument()
  })

  it('reveals the peak annotation when forced revealed', () => {
    render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
        forceRevealed
      />
    )
    expect(screen.getByText(/^peak /)).toBeInTheDocument()
  })

  it('renders one ghost path per prior rep plus the current line + halo', () => {
    const { container } = render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
      />
    )
    // 7 ghosts + 2 current (halo + tint) = 9 paths for an 8-rep set.
    expect(container.querySelectorAll('path')).toHaveLength(9)
  })

  it('draws the wide phase band (rects) for the current rep phase runs', () => {
    const { container } = render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
      />
    )
    // one band rect per phase segment (ecc / pause / con / hold ⇒ ≥ 2).
    expect(container.querySelectorAll('rect').length).toBeGreaterThanOrEqual(2)
  })

  it('hides the ECC/CON band labels at rest, shows them when revealed', () => {
    const { rerender } = render(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
      />
    )
    expect(screen.queryByText('ECC')).not.toBeInTheDocument()
    expect(screen.queryByText('CON')).not.toBeInTheDocument()
    rerender(
      <GhostSpark
        curves={model.velocityCurves}
        tempoSeconds={model.tempoSeconds}
        width={360}
        height={180}
        forceRevealed
      />
    )
    expect(screen.getByText('ECC')).toBeInTheDocument()
    expect(screen.getByText('CON')).toBeInTheDocument()
  })
})
