import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'

/**
 * The VW-371 phase 2 decision record: every light-mode candidate for the three
 * `dataviz-*` palettes, rendered by `DatavizLightPalette.stories.tsx`. The set
 * marked `chosen` in each palette is what the light block of the token mirrors
 * carries (landed 2026-09-17); `dataviz-palettes.test.ts` fails if they drift.
 * The rest stay here as the record of what was weighed and why it lost.
 *
 * Every value is a `primitiveRamps` step, picked by exhaustive search over the
 * ramps and scored with the dataviz skill's validator (Machado-2009 CVD, OKLab
 * ΔE×100). "Planes" below means the three light surfaces a chart sits on:
 * `surface-base` (white), `surface-elevated` and `surface-raised`.
 *
 * Turns, all reviewed 2026-09-17:
 * 1. Set A (contrast-first, steps 700-900) read as "very muddy": chroma
 *    collapses there (amber[800] C 0.066, cyan[600] C 0.088). A is not kept.
 * 2. Sets B and C on steps 300-700, with relaxed panel-contrast floors.
 * 3. Categorical B locked with Cardio kept brown; diverging D (white labels);
 *    sequential narrowed to steps 0-2 (`SEQUENTIAL_HEAD_VARIANTS`).
 * 4. Diverging C' (blue[500], black slot-0 label); sequential allows a lift at
 *    step 0→1, as the shipped dark ramp does; full ramps S1 and S4.
 * 5. Chosen: diverging C', sequential S1, categorical B. Landed.
 */

export type DatavizPalette = 'diverging' | 'sequential' | 'categorical'

export type DatavizKey = `dataviz-${DatavizPalette}-${number}`

export type CandidateSetId = 'B' | 'C' | "C'" | 'D' | 'H1' | 'H2' | 'H3' | 'H4' | 'S1' | 'S4'

/** Which ink a label on a fill is forced to; `light` is white, `dark` is black. */
export type LabelInk = 'light' | 'dark'

export interface LightCandidate {
  key: DatavizKey
  /** The ramp step the proposal points at, as it would be written in semantic.ts. */
  step: string
  value: string
  rationale: string
}

export interface CandidateSet {
  id: CandidateSetId
  title: string
  /** One line: the trade-off this set makes. */
  rationale: string
  /** The rules the set satisfies, and any rule it relaxes, printed as stated. */
  rules: string[]
  steps: LightCandidate[]
  /** The set the reviewer picked; its steps are the landed light tokens. */
  chosen?: boolean
  /** Per-stop label ink overrides; stops not listed use `bestTextColor`. */
  forcedLabels?: Partial<Record<number, LabelInk>>
}

const DIVERGING_C: CandidateSet = {
  id: 'C',
  title: 'C · light centre',
  rationale:
    'Stays close to dark mode: centre one step darker (green pin), inner arms two, blue end one.',
  rules: [
    'ends (stops 0,4) ≥ 3:1 on all planes',
    'inner arms (1,3) ≥ 2:1 on all planes',
    'RELAXED: centre (2) has no contrast floor (1.6:1 on raised); relies on chip outline and label',
    'centre strictly lightest; labels ≥ 4.5:1; all-pairs CVD ΔE ≥ 8',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[600]',
      value: ramp.blue[600],
      rationale: 'L 0.55, C 0.160. One step darker than dark mode.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[400]',
      value: ramp.cyan[400],
      rationale: 'L 0.71, C 0.125. Near the cyan chroma peak.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[300]',
      value: ramp.green[300],
      rationale: 'L 0.77, C 0.191. The green pin; 1.6:1 on raised.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[400]',
      value: ramp.amber[400],
      rationale: 'L 0.71, C 0.156. Mirrors cyan[400].',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[600]',
      value: ramp.red[600],
      rationale: 'Unchanged from dark. L 0.59, C 0.179, 3.8:1 on raised.',
    },
  ],
}

const DIVERGING_C_PRIME: CandidateSet = {
  id: "C'",
  title: "C' · C with a blue[500] end, black label",
  chosen: true,
  rationale: 'Reviewer ask: C with slot 0 lifted to blue[500] and its label forced black.',
  forcedLabels: { 0: 'dark' },
  rules: [
    'ACCEPTED: the blue↔cyan normal-vision ΔE below, knowingly, for the brighter end',
    'slot 0 black label 6.72:1 (white would be 3.12:1); inner arms ≥ 2:1',
    'BROKEN: slot 0 end is 2.61:1 on raised, 3.12:1 on white (ends rule is ≥ 3:1 on all planes)',
    'BROKEN: blue[500]↔cyan[400] normal-vision ΔE 11.1 (floor 15; C has 19.0). CVD ΔE 10.9',
    'all-pairs CVD ΔE 8.5 (unchanged from C; the worst pair is not blue↔cyan)',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[500]',
      value: ramp.blue[500],
      rationale: 'L 0.66, C 0.169. The dark-mode value.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[400]',
      value: ramp.cyan[400],
      rationale: 'L 0.71. Now only 0.05 L from slot 0.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[300]',
      value: ramp.green[300],
      rationale: 'L 0.77, C 0.191.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[400]',
      value: ramp.amber[400],
      rationale: 'L 0.71, C 0.156.',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[600]',
      value: ramp.red[600],
      rationale: 'L 0.59, C 0.179.',
    },
  ],
}

const DIVERGING_D: CandidateSet = {
  id: 'D',
  title: 'D · white labels everywhere',
  rationale:
    'B with a green[500] centre, the lightest centre that still takes white text at 3:1. No 700-step arms.',
  forcedLabels: { 0: 'light', 1: 'light', 2: 'light', 3: 'light', 4: 'light' },
  rules: [
    'white label ≥ 3:1 on every stop; ≥ 4.5:1 on the ends only (6.87, 7.44)',
    'ends ≥ 3:1 and inner stops ≥ 2:1 on all planes',
    'BROKEN: centre is not visibly lightest; it leads cyan and amber by ΔL 0.0007 (all L 0.63)',
    'BROKEN: all-pairs CVD ΔE 4.9 (green↔amber; floor 8, WARN floor 6). Normal-vision ΔE 17.7',
  ],
  steps: [
    {
      key: 'dataviz-diverging-0',
      step: 'blue[700]',
      value: ramp.blue[700],
      rationale: 'L 0.47, C 0.142. White 6.87:1.',
    },
    {
      key: 'dataviz-diverging-1',
      step: 'cyan[500]',
      value: ramp.cyan[500],
      rationale: 'L 0.63, C 0.106. White 3.39:1.',
    },
    {
      key: 'dataviz-diverging-2',
      step: 'green[500]',
      value: ramp.green[500],
      rationale: 'L 0.63, C 0.174. White 3.25:1; green[400] is 2.40:1.',
    },
    {
      key: 'dataviz-diverging-3',
      step: 'amber[500]',
      value: ramp.amber[500],
      rationale: 'L 0.63, C 0.141. White 3.63:1.',
    },
    {
      key: 'dataviz-diverging-4',
      step: 'red[700]',
      value: ramp.red[700],
      rationale: 'L 0.47, C 0.167. White 7.44:1.',
    },
  ],
}

const CATEGORICAL_B: CandidateSet = {
  id: 'B',
  title: 'B · vivid, Cardio kept brown',
  chosen: true,
  rationale:
    'Reviewer pick: B with step 6 back on the current amber[600]. Red and green take the darker slots.',
  rules: [
    'RELAXED: every slot ≥ 2:1 on all planes (was 3:1 on white); legend and tile labels carry identity',
    'L in 0.43-0.77; C ≥ 0.12 (cyan) and ≥ 0.15 (other hues, bar Cardio)',
    'adjacent normal-vision ΔE ≥ 15',
    'RELAXED: adjacent CVD ΔE ≥ 6 (was 8); green↔orange is 6.9, the validator WARN band',
    'L in band except the locked brown: amber[600] is L 0.55, C 0.126 (below the 0.15 hue floor, by choice)',
  ],
  steps: [
    {
      key: 'dataviz-categorical-0',
      step: 'blue[500]',
      value: ramp.blue[500],
      rationale: 'Unchanged from dark. 2.6:1 on raised.',
    },
    {
      key: 'dataviz-categorical-1',
      step: 'magenta[600]',
      value: ramp.magenta[600],
      rationale: 'L 0.55, C 0.209, the most saturated ramp step. ΔE 15.3 from red[600].',
    },
    {
      key: 'dataviz-categorical-2',
      step: 'red[600]',
      value: ramp.red[600],
      rationale: 'The red pin. L 0.59 separates it from orange[400] (ΔE 15.9).',
    },
    {
      key: 'dataviz-categorical-3',
      step: 'orange[400]',
      value: ramp.orange[400],
      rationale: 'Unchanged from dark. L 0.72, C 0.190. 2.2:1 on raised.',
    },
    {
      key: 'dataviz-categorical-4',
      step: 'green[600]',
      value: ramp.green[600],
      rationale: 'L 0.55, C 0.150. Darker than dark mode so it clears 3:1 and parts from cyan.',
    },
    {
      key: 'dataviz-categorical-5',
      step: 'cyan[400]',
      value: ramp.cyan[400],
      rationale: 'L 0.71, C 0.125. The cyan ramp peaks at 0.134.',
    },
    {
      key: 'dataviz-categorical-6',
      step: 'amber[600]',
      value: ramp.amber[600],
      rationale: 'Unchanged from dark, per review. ΔE 24.0 from cyan[400]; adjacent min stays 6.9.',
    },
  ],
}

const headStep = (
  index: number,
  step: string,
  value: string,
  rationale: string
): LightCandidate => ({
  key: `dataviz-sequential-${index}`,
  step,
  value,
  rationale,
})

/**
 * Sequential steps 0-2 only (turn 3). The review: "we need to start by figuring
 * out how to make steps 1 and 2 work without making them look like dirt". The
 * tail (steps 3-5) is decided after one of these is picked. `primitiveRamps` has
 * no yellow or lime ramp, so amber[300] (the gold pin) is the nearest yellow.
 */
export const SEQUENTIAL_HEAD_VARIANTS: CandidateSet[] = [
  {
    id: 'H1',
    title: 'H1 · green → gold pin → orange pin (S1 opening)',
    chosen: true,
    rationale: 'Nearest thing to a lime/yellow middle: no ramp exists, so the gold pin stands in.',
    rules: [
      'step 0→1 lifts (L 0.77 → 0.81); allowed since turn 4, dark lifts 0.77 → 0.88',
      'adjacent CVD 6.4 (WARN band) / 8.9',
    ],
    steps: [
      headStep(0, 'green[300]', ramp.green[300], 'L 0.77, C 0.191.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165.'),
      headStep(2, 'orange[400]', ramp.orange[400], 'L 0.72, C 0.190.'),
    ],
  },
  {
    id: 'H2',
    title: 'H2 · tint-first',
    rationale: 'Lightness carries the walk; step 2 is still amber[500], so the mustard stays.',
    rules: ['monotone light→dark', 'adjacent CVD 10.9 / 18.7', 'step 0 is 1.16:1 on raised'],
    steps: [
      headStep(0, 'green[200]', ramp.green[200], 'L 0.87, C 0.181.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165.'),
      headStep(2, 'amber[500]', ramp.amber[500], 'L 0.63, C 0.141. The mustard.'),
    ],
  },
  {
    id: 'H3',
    title: 'H3 · skip mustard',
    rationale: 'No amber at all: green straight into light and mid orange.',
    rules: [
      'step 0→1 lifts (L 0.77 → 0.79); allowed since turn 4',
      'BROKEN: adjacent CVD 4.7 (step 0↔1), below the 6 WARN floor',
    ],
    steps: [
      headStep(0, 'green[300]', ramp.green[300], 'L 0.77, C 0.191.'),
      headStep(1, 'orange[300]', ramp.orange[300], 'L 0.79, C 0.137. Reads peach.'),
      headStep(2, 'orange[500]', ramp.orange[500], 'L 0.63, C 0.175.'),
    ],
  },
  {
    id: 'H4',
    title: 'H4 · pins only',
    rationale:
      'Amber never goes below its gold pin, where it turns to mustard; every step is C ≥ 0.165.',
    rules: [
      'monotone light→dark (ΔL 0.055 / 0.092)',
      'adjacent CVD 10.9 / 8.9',
      'step 0 is 1.16:1 on raised; it reads by chroma, not contrast',
      'full ramp with the turn-4 tail: S4 above',
    ],
    steps: [
      headStep(0, 'green[200]', ramp.green[200], 'L 0.87, C 0.181. The dark-mode centre mint.'),
      headStep(1, 'amber[300]', ramp.amber[300], 'L 0.81, C 0.165. The dark-mode step 2.'),
      headStep(2, 'orange[400]', ramp.orange[400], 'L 0.72, C 0.190. The dark-mode step 3.'),
    ],
  },
]

const tailSteps: LightCandidate[] = [
  headStep(3, 'orange[500]', ramp.orange[500], 'L 0.63, C 0.175. ΔL 0.092 below orange[400].'),
  headStep(
    4,
    'red[700]',
    ramp.red[700],
    'L 0.47, C 0.167. red[600] is only ΔL 0.044 below orange[500].'
  ),
  headStep(5, 'red[800]', ramp.red[800], 'L 0.38, C 0.145. Darkest; ΔL 0.089.'),
]

const TAIL_RULES = [
  'monotone from step 1, ΔL ≥ 0.05 (0.091 / 0.092 / 0.160 / 0.089)',
  'tail orange[500] → red[700] → red[800]; min C 0.145, labels ≥ 5.6:1',
]

const SEQUENTIAL_S1: CandidateSet = {
  id: 'S1',
  title: 'S1 · H1 opening + tail',
  chosen: true,
  rationale:
    'Dark-mode hues through step 3, lifting at step 1 exactly as dark does; one vivid red tail.',
  rules: [
    'step 0→1 lifts ΔL +0.044 (allowed; dark lifts +0.113)',
    ...TAIL_RULES,
    'adjacent CVD 6.4 / 8.9 / 9.0 / 16.7 / 7.9 (step 0↔1 in the WARN band)',
    'step 0 is 1.61:1 on raised, 1.93:1 on white',
  ],
  steps: [...SEQUENTIAL_HEAD_VARIANTS[0].steps, ...tailSteps],
}

const SEQUENTIAL_S4: CandidateSet = {
  id: 'S4',
  title: 'S4 · H4 opening + same tail',
  rationale: 'Strictly monotone all the way; step 0 is the pale dark-mode mint.',
  rules: [
    'monotone from step 0 (ΔL 0.055 at step 0→1)',
    ...TAIL_RULES,
    'adjacent CVD 10.9 / 8.9 / 9.0 / 16.7 / 7.9',
    'step 0 is 1.16:1 on raised, 1.39:1 on white',
  ],
  steps: [...SEQUENTIAL_HEAD_VARIANTS[3].steps, ...tailSteps],
}

export const LIGHT_CANDIDATE_SETS: Record<DatavizPalette, CandidateSet[]> = {
  diverging: [DIVERGING_C_PRIME, DIVERGING_C, DIVERGING_D],
  sequential: [SEQUENTIAL_S1, SEQUENTIAL_S4],
  categorical: [CATEGORICAL_B],
}

/** The reviewer's pick for a palette: the values the light token block carries. */
export function chosenSet(palette: DatavizPalette): CandidateSet {
  const chosen = LIGHT_CANDIDATE_SETS[palette].filter((set) => set.chosen)
  if (chosen.length !== 1) {
    throw new Error(`${palette}: expected exactly one chosen set, found ${chosen.length}`)
  }
  return chosen[0]
}
