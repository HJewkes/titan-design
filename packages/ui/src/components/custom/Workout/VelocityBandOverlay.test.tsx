import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { VelocityBandOverlay, type VelocityBandTreatment } from './VelocityBandOverlay'
import { EFFORT_BAND_PALETTE, VelocityBandPreview } from './VelocityBandPreview'
import { bandSlotCount } from './velocityBandGeometry'
import {
  EMPTY_SET,
  TIER_A_NO_GUARD,
  TIER_A_TARGET_RPE_FALLBACK,
  TIER_B_LOW_CONFIDENCE,
  TIER_B_PAST_CUE,
  TIER_B_SUSPENDED_TAIL,
  TIER_B_TWO_GUARDS,
  type BandScaleFixture,
} from './velocityBandScale-fixture'

expect.extend(toHaveNoViolations)

function renderOverlay(fixture: BandScaleFixture, treatment?: Partial<VelocityBandTreatment>) {
  return render(
    <VelocityBandOverlay
      scale={fixture.scale}
      velocities={fixture.velocities}
      slotCount={bandSlotCount(fixture.scale, fixture.velocities.length)}
      chart={{ scaleDenom: 1, plotHeight: 200 }}
      plotWidth={600}
      treatment={treatment}
    />
  )
}

describe('VelocityBandOverlay', () => {
  it('draws the rep-range zone with its tick, end line and the caller label', () => {
    renderOverlay(TIER_A_NO_GUARD)
    expect(screen.getByTestId('band-zone-tint')).toBeTruthy()
    expect(screen.getByTestId('band-zone-tick')).toBeTruthy()
    expect(screen.getByTestId('band-zone-end')).toBeTruthy()
    expect(screen.getByText('8 to 12')).toBeTruthy()
  })

  it('draws the zone as a baseline bracket when asked', () => {
    renderOverlay(TIER_A_NO_GUARD, { zone: 'bracket' })
    expect(screen.getByTestId('band-zone-bracket')).toBeTruthy()
    expect(screen.queryByTestId('band-zone-tint')).toBeNull()
  })

  it('shows the zone before the first rep', () => {
    renderOverlay(EMPTY_SET)
    expect(screen.getByTestId('band-zone-end')).toBeTruthy()
  })

  it('draws no guard line when the set has none', () => {
    renderOverlay(TIER_A_NO_GUARD)
    expect(screen.queryByTestId('band-line-guard-0')).toBeNull()
  })

  it('draws two guard lines with their labels', () => {
    renderOverlay(TIER_B_TWO_GUARDS)
    expect(screen.getByTestId('band-line-guard-0')).toBeTruthy()
    expect(screen.getByTestId('band-line-guard-1')).toBeTruthy()
    expect(screen.getByText('RPE 9')).toBeTruthy()
    expect(screen.getByText('VL 30%')).toBeTruthy()
  })

  it('counts the reps past the cue, as a bracket or as a badge', () => {
    const { unmount } = renderOverlay(TIER_B_PAST_CUE)
    expect(screen.getByTestId('band-past-cue-bracket')).toBeTruthy()
    expect(screen.getByText('+2')).toBeTruthy()
    unmount()
    renderOverlay(TIER_B_PAST_CUE, { pastCue: 'badge' })
    expect(screen.queryByTestId('band-past-cue-bracket')).toBeNull()
    expect(screen.getByText('+2')).toBeTruthy()
  })

  it('prints the tier a fallback label verbatim', () => {
    renderOverlay(TIER_A_TARGET_RPE_FALLBACK)
    expect(screen.getByText('RPE 8 · by reps until calibrated')).toBeTruthy()
  })

  it('outlines only the low-confidence bars, and only when asked', () => {
    const { unmount } = renderOverlay(TIER_B_LOW_CONFIDENCE)
    expect(screen.getByTestId('band-low-confidence-9')).toBeTruthy()
    expect(screen.getByTestId('band-low-confidence-10')).toBeTruthy()
    expect(screen.queryByTestId('band-low-confidence-8')).toBeNull()
    unmount()
    renderOverlay(TIER_B_LOW_CONFIDENCE, { lowConfidence: 'fade' })
    expect(screen.queryByTestId('band-low-confidence-9')).toBeNull()
  })

  it('marks a setting change with the caller label, or leaves it unmarked', () => {
    const { unmount } = renderOverlay(TIER_B_SUSPENDED_TAIL)
    expect(screen.getByTestId('band-suspension')).toBeTruthy()
    expect(screen.getByText('Setting changed')).toBeTruthy()
    unmount()
    renderOverlay(TIER_B_SUSPENDED_TAIL, { suspension: 'none' })
    expect(screen.queryByTestId('band-suspension')).toBeNull()
  })

  it('draws nothing but its layers before the plot is measured', () => {
    render(
      <VelocityBandOverlay
        scale={TIER_B_TWO_GUARDS.scale}
        velocities={TIER_B_TWO_GUARDS.velocities}
        slotCount={12}
        chart={{ scaleDenom: 1, plotHeight: 200 }}
      />
    )
    expect(screen.getByTestId('velocity-band-overlay')).toBeTruthy()
    expect(screen.queryByTestId('band-line-guard-0')).toBeNull()
  })

  it('has no accessibility violations on a chart', async () => {
    const { container } = render(
      <VelocityBandPreview
        velocities={TIER_B_TWO_GUARDS.velocities}
        scale={TIER_B_TWO_GUARDS.scale}
        palette={EFFORT_BAND_PALETTE}
        height={200}
        accessibilityLabel="Ten reps, 0.66 to 0.40 metres per second, RPE 9 cap"
      />
    )
    expect(screen.getByRole('img', { name: /Ten reps/ })).toBeTruthy()
    expect(await axe(container)).toHaveNoViolations()
  })
})
