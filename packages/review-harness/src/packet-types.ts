// What a CI packet is built from: the target PR head, the run it is bound to, and each visual
// layer's baselines with their bytes. `packet from-ci` gathers these; packet.ts writes them.
import type { ShownChange } from './packet-classify.ts'

export const LAYERS = ['component', 'story'] as const
export type Layer = (typeof LAYERS)[number]

export interface CiTarget {
  repo: string
  pr: number
  head: string
  run: string
  clone: string
}

export interface Binding {
  url: string
  conclusion: string
  visualJob: string | null
  headTree: string
  mainSha: string
  mergeBase: string
}

/** A CI diff, kept only when its stem names one pair in the artifact. */
export interface CiDiff {
  diff: Buffer
  expected: Buffer
}

/** One baseline to show: where its bytes came from, and the bytes on each side. */
export interface Gathered {
  layer: Layer
  path: string
  change: ShownChange
  source: 'artifact' | 'git'
  before?: Buffer
  after?: Buffer
  ciDiff?: CiDiff
}

export interface LayerSources {
  layer: Layer
  regenerated: boolean
  diagnostics: boolean
  unchanged: number
  shown: Gathered[]
}
