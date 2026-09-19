import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VelocityStrip } from '../../custom/Workout/VelocityStrip'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { PinnedLiveStrip } from './PinnedLiveStrip'
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

function renderBoth(set: IntentSet) {
  const lossThresholds = thresholdsFromStop(set.stopPct)
  render(
    <>
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
    </>
  )
}

describe('bar colour parity between the pinned strip and the live hero on dark surfaces', () => {
  it.each(INTENT_SETS.map((set) => [set.intent, set] as const))(
    'colours the %s set identically on both surfaces from the same thresholds',
    (intent, set) => {
      renderBoth(set)
      EXPECTED[intent].forEach((band, i) => {
        expect(colourOf(`live-strip-bar-${i}`)).toBe(resolveColor(STRIP_TOKEN[band]))
        expect(colourOf(`velocity-bar-${i}`)).toBe(cssColour(HERO_HEX[band]))
      })
    }
  )

  it('resolves each strip band token to the hero hex on the dark wall', () => {
    const dark = getSemanticColors('dark')
    for (const band of Object.keys(STRIP_TOKEN) as Band[]) {
      expect(dark[STRIP_TOKEN[band]]).toBe(HERO_HEX[band])
    }
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
