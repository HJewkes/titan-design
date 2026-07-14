import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  TempoBar,
  getTempoPacingState,
  getTempoFillPct,
  formatTempoDelta,
  TEMPO_PACING,
} from './TempoBar'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')
const TARGET = { concentric: 1, hold: 1, eccentric: 3 }

describe('getTempoPacingState', () => {
  it('returns none when there is no target', () => {
    expect(getTempoPacingState(1000, null)).toBe('none')
  })

  it('returns none for a sub-threshold target', () => {
    expect(getTempoPacingState(1000, TEMPO_PACING.minPhaseDurationMs - 1)).toBe('none')
  })

  it('returns on-pace when within the behind threshold', () => {
    expect(getTempoPacingState(1000, 1000)).toBe('on-pace')
    expect(getTempoPacingState(1100, 1000)).toBe('on-pace') // +10%, under 15%
  })

  it('returns behind once elapsed exceeds the behind threshold', () => {
    expect(getTempoPacingState(1200, 1000)).toBe('behind') // +20%, over 15%
  })
})

describe('getTempoFillPct', () => {
  it('fills fully when there is no target', () => {
    expect(getTempoFillPct(500, null)).toBe(100)
  })

  it('is proportional to elapsed vs target', () => {
    expect(getTempoFillPct(500, 1000)).toBe(50)
  })

  it('clamps at 100 when past target', () => {
    expect(getTempoFillPct(2000, 1000)).toBe(100)
  })
})

describe('TempoBar', () => {
  it('renders the bar with phase labels', () => {
    render(<TempoBar activePhase={null} phaseElapsedMs={0} target={TARGET} />)
    expect(screen.getByTestId('tempo-bar')).toBeInTheDocument()
    expect(screen.getByText('Con')).toBeInTheDocument()
    expect(screen.getByText('Hold')).toBeInTheDocument()
    expect(screen.getByText('Ecc')).toBeInTheDocument()
  })

  it('renders the active segment with an elapsed/target label', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET} />)
    expect(screen.getByTestId('tempo-segment-active-Con')).toBeInTheDocument()
    expect(screen.getByText('0.6 / 1.0')).toBeInTheDocument()
  })

  it('shows only elapsed when the active phase has no target', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={800} />)
    expect(screen.getByText('0.8')).toBeInTheDocument()
  })

  it('marks a completed phase that hit its target with a check', () => {
    render(
      <TempoBar
        activePhase="hold"
        phaseElapsedMs={100}
        completed={{ concentric: 950 }}
        target={TARGET}
      />
    )
    expect(screen.getByTestId('tempo-segment-completed-Con')).toBeInTheDocument()
    expect(screen.getByText('0.9 ✓')).toBeInTheDocument()
  })

  it('marks a completed phase that missed its target with a cross', () => {
    render(
      <TempoBar
        activePhase="hold"
        phaseElapsedMs={100}
        completed={{ eccentric: 4000 }}
        target={TARGET}
      />
    )
    // eccentric target 3s, 4s elapsed => behind => cross
    expect(screen.getByText('4.0 ✗')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={1500}
        completed={{ concentric: 900, hold: 1000 }}
        target={TARGET}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('TempoBar size="wall"', () => {
  const TARGET_W = { concentric: 1, hold: 1, eccentric: 3 }

  it('scales the active label up at wall density', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET_W} size="wall" />)
    expect(screen.getByText('0.6 / 1.0')).toHaveStyle({ fontSize: 22 })
  })

  it('keeps the compact label size by default', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET_W} />)
    expect(screen.getByText('0.6 / 1.0')).toHaveStyle({ fontSize: 12 })
  })

  it('preserves the segment testIDs at wall density', () => {
    render(
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={1500}
        completed={{ concentric: 900 }}
        target={TARGET_W}
        size="wall"
      />
    )
    expect(screen.getByTestId('tempo-segment-active-Ecc')).toBeInTheDocument()
    expect(screen.getByTestId('tempo-segment-completed-Con')).toBeInTheDocument()
  })

  it('spells out the full phase words at wall density', () => {
    render(<TempoBar activePhase={null} phaseElapsedMs={0} target={TARGET_W} size="wall" />)
    expect(screen.getByText('Concentric')).toBeInTheDocument()
    expect(screen.getByText('Eccentric')).toBeInTheDocument()
    expect(screen.queryByText('Con')).not.toBeInTheDocument()
  })
})

describe('formatTempoDelta', () => {
  it('shows remaining time to target as a positive value', () => {
    expect(formatTempoDelta(1500)).toBe('1.5')
  })

  it('shows over-target time as negative', () => {
    expect(formatTempoDelta(-1200)).toBe('-1.2')
  })

  it('shows 0.0 at the target (no -0.0)', () => {
    expect(formatTempoDelta(0)).toBe('0.0')
    expect(formatTempoDelta(-10)).toBe('0.0')
  })
})

describe('TempoBar activeDisplay (delta countdown + toggle)', () => {
  it('counts the remaining time down to the target in delta mode', () => {
    render(
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={1800}
        target={TARGET}
        activeDisplay="delta"
      />
    )
    // eccentric target 3.0s, elapsed 1.8s → 1.2s remaining
    expect(screen.getByText('1.2')).toBeInTheDocument()
  })

  it('goes negative once the phase runs past its target', () => {
    render(
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={4200}
        target={TARGET}
        activeDisplay="delta"
      />
    )
    expect(screen.getByText('-1.2')).toBeInTheDocument()
  })

  it('tapping the active segment toggles time ↔ delta', () => {
    render(
      <TempoBar
        activePhase="concentric"
        phaseElapsedMs={600}
        target={TARGET}
        activeDisplay="time"
      />
    )
    expect(screen.getByText('0.6 / 1.0')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('tempo-segment-active-Con'))
    // concentric target 1.0s, elapsed 0.6s → 0.4s remaining
    expect(screen.getByText('0.4')).toBeInTheDocument()
    expect(screen.queryByText('0.6 / 1.0')).not.toBeInTheDocument()
  })

  it('defaults to the time readout', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET} />)
    expect(screen.getByText('0.6 / 1.0')).toBeInTheDocument()
  })
})

describe('TempoBar completed pacing colour', () => {
  it('colours a missed completed phase red', () => {
    render(
      <TempoBar
        activePhase="hold"
        phaseElapsedMs={100}
        completed={{ eccentric: 4000 }}
        target={TARGET}
      />
    )
    expect(screen.getByText('4.0 ✗')).toHaveStyle({ color: t['status-error'] })
  })
})
