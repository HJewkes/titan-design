import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { VelocityBandChart } from './VelocityBandChart'
import { EFFORT_BAND_PALETTE, type VelocityBandPalette } from './velocityBandPalette'
import {
  TIER_A_REP_RANGE_LOSS_GUARD,
  TIER_B_TWO_GUARDS,
  type BandScaleFixture,
} from './velocityBandScale-fixture'

expect.extend(toHaveNoViolations)

function renderChart(fixture: BandScaleFixture, palette?: VelocityBandPalette) {
  return render(
    <VelocityBandChart
      velocities={fixture.velocities}
      scale={fixture.scale}
      palette={palette}
      height={200}
      accessibilityLabel="set"
    />
  )
}

function barFill(repIndex: number): string {
  return screen.getByTestId(`setbar-bar-${repIndex}`).style.backgroundColor
}

function asRendered(hex: string): string {
  const probe = document.createElement('div')
  probe.style.backgroundColor = hex
  return probe.style.backgroundColor
}

describe('VelocityBandChart', () => {
  it('colours tier a bars from the dataviz-slowing tokens', () => {
    renderChart(TIER_A_REP_RANGE_LOSS_GUARD)
    const colors = getSemanticColors('dark')
    TIER_A_REP_RANGE_LOSS_GUARD.scale.repBands.forEach((band, i) => {
      if (band == null) return
      expect(barFill(i)).toBe(asRendered(colors[`dataviz-slowing-${band}`]))
    })
  })

  it('colours tier b bars on the effort scale', () => {
    renderChart(TIER_B_TWO_GUARDS)
    TIER_B_TWO_GUARDS.scale.repBands.forEach((band, i) => {
      if (band == null) return
      expect(barFill(i)).toBe(asRendered(EFFORT_BAND_PALETTE[band]))
    })
  })

  it('takes a caller palette over the default', () => {
    const grey: VelocityBandPalette = ['#111111', '#222222', '#333333', '#444444']
    renderChart(TIER_A_REP_RANGE_LOSS_GUARD, grey)
    const band = TIER_A_REP_RANGE_LOSS_GUARD.scale.repBands[0] ?? 0
    expect(barFill(0)).toBe(asRendered(grey[band]))
  })

  it('has no accessibility violations', async () => {
    const { container } = renderChart(TIER_B_TWO_GUARDS)
    expect(screen.getByRole('img', { name: 'set' })).toBeTruthy()
    expect(await axe(container)).toHaveNoViolations()
  })
})
