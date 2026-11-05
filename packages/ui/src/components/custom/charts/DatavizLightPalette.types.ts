/** Shapes of the VW-371 light dataviz decision record (`DatavizLightPalette.candidates.ts`). */

export type DatavizPalette = 'diverging' | 'sequential' | 'categorical'

export type DatavizKey = `dataviz-${DatavizPalette}-${number}`

export type CandidateSetId = 'B' | "B'" | 'C' | "C'" | 'D' | 'H1' | 'H2' | 'H3' | 'H4' | 'S1' | 'S4'

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
