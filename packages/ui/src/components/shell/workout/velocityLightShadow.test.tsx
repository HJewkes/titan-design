import type { ReactElement } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SurfaceContext } from '../../ui/surface/SurfaceContext'
import { VelocityStrip } from '../../custom/Workout/VelocityStrip'
import { DualVelocityStrip } from '../../custom/Workout/DualVelocityStrip'
import { VelocityHero } from '../../custom/Fatigue/VelocityHero'
import { RomProgressionChart } from '../../custom/Fatigue/RomProgressionChart'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import { DualPinnedLiveStrip } from './DualPinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS } from './pinnedLiveStrip-fixture'
import { DUAL_STRIP_SCENARIOS } from './dualPinnedLiveStrip-fixture'

// TD-764: the soft light shadow (VW-877/VW-879) reached only DualPinnedLiveStrip. Every
// consumer of the shared bar chart now gets it, with no provider.
const SOFT = /^0 -?2px 5px rgba\(0, ?0, ?0, ?0\.2\)$/
const PAPER_DROP = '0 6px 16px rgba(0,0,0,0.45)'
const velocities = [0.9, 0.85, 0.8, 0.7]

const light = (ui: ReactElement) =>
  render(
    <SurfaceContext.Provider value={{ mode: 'light', level: 'base' }}>{ui}</SurfaceContext.Provider>
  )

const barShadows = () =>
  screen.getAllByTestId(/-bar-\d+$/).map((bar) => (bar as HTMLElement).style.boxShadow)

const consumers: Record<string, () => ReactElement> = {
  'VelocityStrip hero': () => <VelocityStrip variant="hero" velocities={velocities} height={120} />,
  'VelocityStrip expanded': () => (
    <VelocityStrip
      variant="expanded"
      showNumbers={false}
      showInfo={false}
      velocities={velocities}
    />
  ),
  'VelocityStrip framed': () => <VelocityStrip variant="expanded" velocities={velocities} />,
  DualVelocityStrip: () => (
    <DualVelocityStrip
      left={{ velocities }}
      right={{ velocities: [0.8, 0.75, 0.7] }}
      variant="hero"
      height={120}
    />
  ),
  VelocityHero: () => <VelocityHero velocities={velocities} targetReps={6} />,
  RomProgressionChart: () => (
    <RomProgressionChart
      points={[
        { repNumber: 1, romM: 0.5 },
        { repNumber: 2, romM: 0.48 },
        { repNumber: 3, romM: 0.45 },
      ]}
      workingStandardM={0.5}
      shortThresholdM={0.4}
    />
  ),
  PinnedLiveStrip: () => <PinnedLiveStrip {...LIVE_STRIP_SCENARIOS.set} layout="phone" />,
  DualPinnedLiveStrip: () => <DualPinnedLiveStrip {...DUAL_STRIP_SCENARIOS.set} layout="phone" />,
}

describe('velocity bars in light mode', () => {
  it.each(Object.entries(consumers))('%s draws the soft shadow, not the paper drop', (_n, make) => {
    light(make())
    const shadows = barShadows()
    expect(shadows.length).toBeGreaterThan(0)
    for (const s of shadows) {
      expect(s).toMatch(SOFT)
      expect(s).not.toContain(PAPER_DROP)
    }
  })
})
