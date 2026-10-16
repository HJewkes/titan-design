import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VelocityStrip } from '../../custom/Workout/VelocityStrip'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { SurfaceContext } from '../../ui/surface/SurfaceContext'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import { LIVE_STRIP_ZONE_TOKEN, type LiveStripZone } from './liveStripModel'
import {
  INTENT_SETS,
  stripRepsOf,
  thresholdsFromStop,
  type IntentSet,
} from './liveBarColour-fixture'

const HERO_HEX = WORKOUT_TOKENS.scale
const STRIP_TOKEN = {
  green: 'dataviz-sequential-0',
  yellow: 'dataviz-sequential-2',
  orange: 'dataviz-sequential-3',
  red: 'dataviz-sequential-4',
} as const
type Band = keyof typeof STRIP_TOKEN

// Thirds of each stop: strength 6.7/13.3/20, power 3.3/6.7/10, hypertrophy 10/20/30.
const EXPECTED: Record<IntentSet['intent'], Band[]> = {
  Strength: ['green', 'green', 'green', 'yellow', 'orange', 'red'],
  Power: ['green', 'green', 'yellow', 'orange', 'red'],
  Hypertrophy: ['green', 'green', 'green', 'yellow', 'yellow', 'orange', 'orange', 'red'],
}

const colourOf = (testId: string) => getComputedStyle(screen.getByTestId(testId)).backgroundColor
const cssColour = (hex: string) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = hex
  return probe.style.backgroundColor
}

function renderBoth(set: IntentSet, mode: ThemeMode = 'dark') {
  const lossThresholds = thresholdsFromStop(set.stopPct)
  render(
    <SurfaceContext.Provider value={{ mode, level: 'base' }}>
      <PinnedLiveStrip
        state="set"
        layout="wall"
        exerciseName={set.exerciseName}
        setNumber={2}
        setCount={3}
        reps={stripRepsOf(set)}
        targetReps={set.targetReps}
        lossThresholds={lossThresholds}
      />
      <VelocityStrip
        variant="hero"
        velocities={set.velocities}
        targetReps={set.targetReps}
        height={180}
        lossThresholds={lossThresholds}
      />
    </SurfaceContext.Provider>
  )
}

const MODES: ThemeMode[] = ['dark', 'light']
const CASES = MODES.flatMap((mode) => INTENT_SETS.map((set) => [set.intent, mode, set] as const))

describe('bar colour parity between the pinned strip and the live hero', () => {
  it.each(CASES)(
    'colours the %s set identically on both surfaces from the same thresholds (%s)',
    (intent, mode, set) => {
      renderBoth(set, mode)
      const themed = getSemanticColors(mode)
      EXPECTED[intent].forEach((band, i) => {
        expect(colourOf(`live-strip-bar-${i}`)).toBe(resolveColor(STRIP_TOKEN[band]))
        expect(colourOf(`velocity-bar-${i}`)).toBe(cssColour(themed[STRIP_TOKEN[band]]))
      })
    }
  )

  it('gives the light hero the light token, not the dark hex, where the two differ', () => {
    const light = getSemanticColors('light')
    renderBoth(INTENT_SETS[0], 'light')
    expect(light[STRIP_TOKEN.red]).not.toBe(HERO_HEX.red)
    expect(colourOf('velocity-bar-5')).toBe(cssColour(light[STRIP_TOKEN.red]))
  })

  it('resolves each strip band token to the hero hex on the dark wall', () => {
    const dark = getSemanticColors('dark')
    for (const band of Object.keys(STRIP_TOKEN) as Band[]) {
      expect(dark[STRIP_TOKEN[band]]).toBe(HERO_HEX[band])
    }
  })
})

describe('zone-mode hero colours follow the theme like the pinned strip', () => {
  const ZONES = [
    { id: 'grinding', label: 'Grinding', min: 0, max: 0.35 },
    { id: 'maximalStrength', label: 'Max strength', min: 0.35, max: 0.5 },
    { id: 'strengthSpeed', label: 'Strength-speed', min: 0.5, max: 0.75 },
    { id: 'power', label: 'Power', min: 0.75, max: 1.0 },
    { id: 'speed', label: 'Speed', min: 1.0, max: null },
  ] as const
  const ZONE_IDS = ZONES.map((z) => z.id) as LiveStripZone[]
  const VELOCITY: Record<LiveStripZone, number> = {
    grinding: 0.3,
    maximalStrength: 0.4,
    strengthSpeed: 0.6,
    power: 0.9,
    speed: 1.1,
  }

  function renderZones(mode: ThemeMode, velocities: number[], zones = ZONES) {
    render(
      <SurfaceContext.Provider value={{ mode, level: 'base' }}>
        <VelocityStrip
          variant="hero"
          velocities={velocities}
          targetReps={velocities.length}
          height={180}
          barColor="zone"
          zones={zones}
        />
      </SurfaceContext.Provider>
    )
  }

  it.each(MODES)('resolves each zone id through its strip token (%s)', (mode) => {
    renderZones(
      mode,
      ZONE_IDS.map((id) => VELOCITY[id])
    )
    const themed = getSemanticColors(mode)
    ZONE_IDS.forEach((id, i) => {
      expect(colourOf(`velocity-bar-${i}`)).toBe(cssColour(themed[LIVE_STRIP_ZONE_TOKEN[id]]))
    })
  })

  it.each(MODES)('colours an unknown zone id with the speed token (%s)', (mode) => {
    renderZones(mode, [0.8], [{ id: 'future-band', label: 'Future', min: 0, max: null }] as never)
    expect(colourOf('velocity-bar-0')).toBe(
      cssColour(getSemanticColors(mode)[LIVE_STRIP_ZONE_TOKEN.speed])
    )
  })

  it('moves a zone bar off its dark hex in light mode', () => {
    renderZones('light', [VELOCITY.maximalStrength])
    const dark = getSemanticColors('dark')[LIVE_STRIP_ZONE_TOKEN.maximalStrength]
    expect(colourOf('velocity-bar-0')).not.toBe(cssColour(dark))
  })
})

describe('hero decision-line labels', () => {
  const [strength, power] = INTENT_SETS

  it('labels both lines when they sit a label height apart (strength, 13 and 20 percent)', () => {
    renderBoth(strength)
    expect(screen.getByText('VL 13%')).toBeInTheDocument()
    expect(screen.getByText('VL 20%')).toBeInTheDocument()
  })

  it('labels only the stop line when the lines would overprint (power, 7 and 10 percent)', () => {
    renderBoth(power)
    expect(screen.queryByText('VL 7%')).not.toBeInTheDocument()
    expect(screen.getByText('VL 10%')).toBeInTheDocument()
  })
})
