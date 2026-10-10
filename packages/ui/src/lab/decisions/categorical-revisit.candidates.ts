import { primitiveRamps as ramp } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * TD-757: the categorical palette sets the owner weighs in the TD-756 round (D1-D9).
 *
 * Nothing here edits a token. `current-dark` reads the shipped `dataviz-categorical-0..6`
 * roles; `current-light` pins set B, the light fills the round weighed, which TD-759 replaced
 * with L-fix-vivid; every candidate is a `primitiveRamps` step, the pool the
 * original palette was built from. Order is canonical in every set (blue, magenta, red, orange,
 * green, cyan, amber) so slot indexes stay stable for `Avatar` and the shell.
 */
export type CategoricalSetId =
  | 'current-dark'
  | 'current-light'
  | 'L-fix-vivid'
  | 'L-fix-green'
  | 'ink-light-A'
  | 'ink-light-B'
  | 'ink-dark'

export const CATEGORICAL_HUES = [
  'blue',
  'magenta',
  'red',
  'orange',
  'green',
  'cyan',
  'amber',
] as const
export type CategoricalHue = (typeof CATEGORICAL_HUES)[number]
type RampStep = keyof (typeof ramp)['blue']

export interface CategoricalSet {
  id: CategoricalSetId
  mode: ThemeMode
  /** One line: what the set is and the trade-off it makes. */
  rationale: string
  /** Slots 0-6, each a `primitiveRamps` step. */
  steps: readonly RampStep[]
}

/** The planes a categorical sits on, rail first; in light, rail equals raised and overlay equals base. */
export const CATEGORICAL_PLANES = [
  { token: 'background-base', role: 'rail, top-bar end' },
  { token: 'surface-elevated', role: 'top-bar start' },
  { token: 'surface-base', role: 'chart plane' },
  { token: 'surface-raised', role: 'card' },
  { token: 'surface-overlay', role: 'tooltip, popover' },
] as const

const CATEGORICAL_KEYS = [
  'dataviz-categorical-0',
  'dataviz-categorical-1',
  'dataviz-categorical-2',
  'dataviz-categorical-3',
  'dataviz-categorical-4',
  'dataviz-categorical-5',
  'dataviz-categorical-6',
] as const

/** The step of `hue` whose hex is `value`; the shipped roles are all ramp steps. */
function stepOf(hue: CategoricalHue, value: string): RampStep {
  const steps = Object.keys(ramp[hue]).map(Number) as RampStep[]
  const step = steps.find((s) => ramp[hue][s] === value)
  if (step === undefined) throw new Error(`${value} is not a ${hue} ramp step`)
  return step
}

function shippedSteps(mode: ThemeMode): RampStep[] {
  const colors = getSemanticColors(mode)
  return CATEGORICAL_HUES.map((hue, slot) => stepOf(hue, colors[CATEGORICAL_KEYS[slot]]))
}

export const CATEGORICAL_SETS: readonly CategoricalSet[] = [
  {
    id: 'current-dark',
    mode: 'dark',
    rationale:
      'Shipped dark fills, built by the original method (all-pairs CVD ≥ 8 through slot 5).',
    steps: shippedSteps('dark'),
  },
  {
    id: 'current-light',
    mode: 'light',
    rationale:
      'Light fills shipped until TD-759, set B (VW-371): scored adjacent-only at CVD 6, never all-pairs.',
    steps: [500, 600, 600, 400, 600, 400, 600],
  },
  {
    id: 'L-fix-vivid',
    mode: 'light',
    rationale:
      'Light fills, B with red[400] and green[700]; restores all-pairs CVD 8 (default, D4).',
    steps: [500, 600, 400, 400, 700, 400, 600],
  },
  {
    id: 'L-fix-green',
    mode: 'light',
    rationale: 'Light fills, B with green[800]; strongest CVD, but green reads near-black.',
    steps: [500, 600, 600, 400, 800, 400, 600],
  },
  {
    id: 'ink-light-A',
    mode: 'light',
    rationale:
      'Light ink tier: the primitive `dark` variant with amber[600]; 3:1 on every plane (D9).',
    steps: [600, 600, 500, 600, 800, 800, 600],
  },
  {
    id: 'ink-light-B',
    mode: 'light',
    rationale:
      'Light ink tier, best objective at 3:1; borrows brand-secondary and text-link steps.',
    steps: [700, 800, 500, 600, 800, 600, 600],
  },
  {
    id: 'ink-dark',
    mode: 'dark',
    rationale: 'Dark ink tier: the dark fills with amber[500] in slot 6, 3:1 on the overlay (D5).',
    steps: [500, 500, 500, 400, 300, 300, 500],
  },
]

export function setColors(set: CategoricalSet): string[] {
  return CATEGORICAL_HUES.map((hue, slot) => ramp[hue][set.steps[slot]])
}

export function planeColors(mode: ThemeMode): string[] {
  const colors = getSemanticColors(mode)
  return CATEGORICAL_PLANES.map((plane) => colors[plane.token])
}
