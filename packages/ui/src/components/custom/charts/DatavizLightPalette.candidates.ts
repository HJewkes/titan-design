import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'

/**
 * PROPOSALS ONLY (VW-371 phase 2). Tuned light-mode values for the three
 * `dataviz-*` palettes, rendered by `DatavizLightPalette.stories.tsx` for
 * approval. Nothing reads these outside the story; the token mirrors still
 * carry the phase-1 values until a human signs these off.
 *
 * Every value is a `primitiveRamps` step, picked by exhaustive search over the
 * ramps against the dataviz skill's validator (Machado-2009 CVD, OKLab ΔE×100).
 */

export type DatavizPalette = 'diverging' | 'sequential' | 'categorical'

export type DatavizKey = `dataviz-${DatavizPalette}-${number}`

export interface LightCandidate {
  key: DatavizKey
  /** The ramp step the proposal points at, as it would be written in semantic.ts. */
  step: string
  value: string
  rationale: string
}

/**
 * Diverging, light. The arms move three to four ramp steps darker so every
 * non-centre stop clears 3:1 on all three light planes; the centre stays the
 * lightest step. Direction still reads blue↔red, magnitude reads in lightness.
 */
export const DIVERGING_LIGHT: LightCandidate[] = [
  {
    key: 'dataviz-diverging-0',
    step: 'blue[800]',
    value: ramp.blue[800],
    rationale: 'Dark cool pole; L 0.38 matches the red pole, 8.5:1 on surface-raised.',
  },
  {
    key: 'dataviz-diverging-1',
    step: 'cyan[600]',
    value: ramp.cyan[600],
    rationale: 'Mid cool arm; L 0.55 mirrors amber[600], 3.9:1 on surface-raised.',
  },
  {
    key: 'dataviz-diverging-2',
    step: 'green[400]',
    value: ramp.green[400],
    rationale: 'Lightest stop (L 0.71). Only 2.0:1 on raised; relies on outline/label.',
  },
  {
    key: 'dataviz-diverging-3',
    step: 'amber[600]',
    value: ramp.amber[600],
    rationale: 'Mid warm arm; L 0.55 mirrors cyan[600], 4.2:1 on surface-raised.',
  },
  {
    key: 'dataviz-diverging-4',
    step: 'red[800]',
    value: ramp.red[800],
    rationale: 'Dark warm pole; L 0.38 matches the blue pole, 8.9:1 on surface-raised.',
  },
]

/**
 * Sequential effort, light. Keeps the green→amber→orange→red walk but makes it
 * strictly darker per step (ΔL 0.08), so magnitude reads in lightness on a
 * light plane. This is the only monotone combination the ramps allow.
 */
export const SEQUENTIAL_LIGHT: LightCandidate[] = [
  {
    key: 'dataviz-sequential-0',
    step: 'green[400]',
    value: ramp.green[400],
    rationale: 'Lightest step (L 0.71); 2.4:1 on white clears the 2:1 ordinal floor.',
  },
  {
    key: 'dataviz-sequential-1',
    step: 'amber[500]',
    value: ramp.amber[500],
    rationale: 'Replaces amber[200], which was LIGHTER than step 0 and broke monotony.',
  },
  {
    key: 'dataviz-sequential-2',
    step: 'amber[600]',
    value: ramp.amber[600],
    rationale: 'One ramp step darker than step 1; ΔL 0.08.',
  },
  {
    key: 'dataviz-sequential-3',
    step: 'orange[700]',
    value: ramp.orange[700],
    rationale: 'orange[400] (L 0.72) sat above steps 1-2; 700 keeps the descent.',
  },
  {
    key: 'dataviz-sequential-4',
    step: 'red[800]',
    value: ramp.red[800],
    rationale: 'Two steps darker than dark mode so step 5 has room below it.',
  },
  {
    key: 'dataviz-sequential-5',
    step: 'red[900]',
    value: ramp.red[900],
    rationale: 'Darkest step (L 0.30). Reads near-brown; the least certain value here.',
  },
]

/**
 * Categorical, light. Same hue order; the three light-surface failures (cyan out
 * of band, green and orange under 3:1) move down the ramp, and magenta moves to
 * its pin so red/orange/magenta stay apart for full-colour readers.
 */
export const CATEGORICAL_LIGHT: LightCandidate[] = [
  {
    key: 'dataviz-categorical-0',
    step: 'blue[500]',
    value: ramp.blue[500],
    rationale: 'Unchanged. Already 3.1:1 on white and inside the light L band.',
  },
  {
    key: 'dataviz-categorical-1',
    step: 'magenta[700]',
    value: ramp.magenta[700],
    rationale: 'The magenta pin. First-three all-pairs CVD ΔE 11.7 to 20.5; clears red.',
  },
  {
    key: 'dataviz-categorical-2',
    step: 'red[500]',
    value: ramp.red[500],
    rationale: 'Unchanged. 3.8:1 on white.',
  },
  {
    key: 'dataviz-categorical-3',
    step: 'orange[700]',
    value: ramp.orange[700],
    rationale: 'orange[400] was 2.6:1 and only ΔE 12.7 from red (normal vision, floor 15).',
  },
  {
    key: 'dataviz-categorical-4',
    step: 'green[500]',
    value: ramp.green[500],
    rationale: 'green[300] was 1.9:1 on white; 500 is 3.3:1.',
  },
  {
    key: 'dataviz-categorical-5',
    step: 'cyan[500]',
    value: ramp.cyan[500],
    rationale: 'cyan[300] sat above the light L band (0.80); 500 is 3.4:1, chroma 0.11.',
  },
  {
    key: 'dataviz-categorical-6',
    step: 'amber[600]',
    value: ramp.amber[600],
    rationale: 'Unchanged extended slot. 5.0:1 on white.',
  },
]

export const LIGHT_CANDIDATES: Record<DatavizPalette, LightCandidate[]> = {
  diverging: DIVERGING_LIGHT,
  sequential: SEQUENTIAL_LIGHT,
  categorical: CATEGORICAL_LIGHT,
}
