/** What a node is. A barrel is a file with role 'barrel'. */
export type CodeNodeKind = 'file' | 'symbol' | 'package' | 'directory'

/** One node of the code graph. `id` is opaque and is what every onNodePress returns. */
export interface CodeNodeRef {
  /** Opaque node id; every onNodePress returns it. */
  id: string
  /** Repo-relative path of the file (for a symbol, the file that holds it). This is what a row shows. */
  path: string
  /** Defaults to 'file'. */
  kind?: CodeNodeKind
  /** Display name when it is not the path's basename: a symbol name, a package name. */
  name?: string
  /** Open string from the index, for example 'barrel'. */
  role?: string
}

/** A baseline snapshot. `null` at a prop means no baseline was given. */
export interface CodeBaselineRef {
  /** The baseline's ref, for example a branch or commit name. */
  ref: string
  /** Index snapshot id of the baseline, when known. */
  snapshotId?: number
}

/** A policy threshold the app passes in. At or above `value` is over the cutoff. */
export interface CodeCutoff {
  /** The score at or above which a node is over the cutoff. */
  value: number
  /** The app's word for it, for example 'Scary'. Shown in legends and read in summaries. */
  label: string
}

/** One metric value against its budget. No budget means never a risk. */
export interface CodeMetricReading {
  /** Stable key, for example 'cognitive_max'. */
  key: string
  /** The metric's display name. */
  label: string
  /** The measured value; `null` when it was not measured. */
  value: number | null
  /** The limit the value is read against; absent means unbudgeted. */
  budget?: number
  /** Unit shown after the value, for example 'ms'. */
  unit?: string
}

/** How a node changed against the baseline. The app classifies; no component holds a cutoff. */
export type CodeChangeKind =
  | 'crossed-cutoff'
  | 'entered'
  | 'new-file'
  | 'worsened'
  | 'improved'
  | 'resolved'

/** The five finding statuses of a findings list read against a baseline. */
export type CodeFindingStatus = 'new' | 'carryover' | 'resolved' | 'worsened' | 'improved'

/** Co-change pair class. */
export type CodeCouplingClass = 'hidden' | 'expected' | 'unverifiable'

/** Where a score sits against the app's thresholds. */
export type CodeScoreBand = 'over' | 'elevated' | 'watch'

/** Where a metric sits against its budget. */
export type CodeBudgetBand = 'over' | 'near' | 'within' | 'unbudgeted'

/** How serious a finding is. */
export type CodeSeverity = 'error' | 'warning'

/** One lint or policy finding, with its status against the baseline. */
export interface CodeFinding {
  /** Stable finding id. */
  id: string
  /** The rule that raised it. */
  rule: string
  /** How serious it is. */
  severity: CodeSeverity
  /** The finding's message. */
  detail: string
  /** Its status against the baseline. */
  status: CodeFindingStatus
}

/** Two files that change together. */
export interface CodeCouplingPair {
  /** One file of the pair. */
  a: CodeNodeRef
  /** The other file of the pair. */
  b: CodeNodeRef
  /** How many commits touched both. */
  coEdits: number
  /** Whether the coupling is hidden, expected or unverifiable. */
  couplingClass: CodeCouplingClass
}
