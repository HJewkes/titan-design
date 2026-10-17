/** The six components the proof renders, in stage order; each cell's test ID is `proof-<name>`. */
export const PROOF_COMPONENTS = [
  'ChapterCard',
  'AnimatedNumber',
  'StatCard',
  'ProgressSteps',
  'Timeline',
  'EvidenceChip',
] as const

export type ProofComponent = (typeof PROOF_COMPONENTS)[number]

export const PROOF_DURATION_S = 3
