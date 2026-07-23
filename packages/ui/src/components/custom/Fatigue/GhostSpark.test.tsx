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
})
