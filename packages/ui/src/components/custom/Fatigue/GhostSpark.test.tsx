import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GhostSpark, GHOST_GUTTER } from './GhostSpark'
import { siblingSource } from '../../../test/spacing-resolver'
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

/**
 * The spark's gutter, pinned (AW-142 wave three).
 *
 * Chart geometry, so the pixel does not move — but it was written three times across two
 * files, and the card's plot arithmetic silently depends on matching it. One constant now,
 * the way GhostBand already exports BAND_H and BAND_GAP.
 */
describe('GhostSpark gutter is one number', () => {
  it('renders both branches through GHOST_GUTTER', () => {
    const source = siblingSource(import.meta.url, 'GhostSpark.tsx')
    expect(GHOST_GUTTER).toBe(4)
    expect(source.match(/paddingHorizontal: GHOST_GUTTER/g)).toHaveLength(2)
    expect(source).not.toMatch(/paddingHorizontal: [0-9]/)
  })

  it('is the same gutter the dual spark carries', () => {
    const dual = siblingSource(import.meta.url, 'DualGhostSpark.tsx')
    expect(dual).toContain('paddingHorizontal: GHOST_GUTTER')
    expect(dual).not.toMatch(/paddingHorizontal: [0-9]/)
  })
})
