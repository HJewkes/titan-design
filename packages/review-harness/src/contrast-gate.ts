import { REQUIRED_RATIO, floorRatio, type CheckKind } from './contrast.ts'
import type { Check, FrameResult, Indeterminate } from './contrast-check.ts'
import {
  THEME_MODES,
  isImageVariant,
  type ContrastDeclarations,
  type KnownDefect,
  type Manifest,
  type ThemeMode,
} from './schema.ts'

export const CONTRAST_SCHEMA_ID = 'titan-review/contrast@1'

/** What the DOM measurement covers, written into every report so nobody assumes more. */
export const COVERAGE = {
  measures: [
    'text: every element with its own text node or an input value, at 4.5:1, or 3:1 when large (24px, or 18.66px bold)',
    'control boundaries: buttons, inputs and ARIA controls; the border or the fill, whichever contrasts more, against the parent plane',
    'separators: hr, role=separator, one-side or two-opposite-side borders, fills 2px thick or less',
    'tracks: fills 8px thick or less and at least four times as long',
    'marks: elements 24px or smaller with a border or fill; every SVG shape fill and stroke',
    'portals: content rendered outside #storybook-root into <body> (popovers, tooltips, modals) that is open as the frame renders',
  ],
  excludes: [
    'large non-control fills and full borders (cards, panels, surfaces): planes, not marks (TD-486 covers token pairs)',
    'planes painted by a non-ancestor (absolutely positioned overlays) or by another SVG shape',
    'background images, gradients and pattern paints: reported as indeterminate, never blocking',
    'focus rings, hover and pressed states: the frame is measured as it first renders',
    'inactive controls (disabled): counted as exempt, as WCAG allows',
  ],
}

export interface MeasuredFrame {
  variant: string
  width: number
  mode: ThemeMode
  result: FrameResult
}

type Where = { variant: string; mode: ThemeMode; width?: number }

export type Finding = Where & Omit<Check, 'fg' | 'bg' | 'pass'> & { fg?: string; bg?: string }
export type KnownFinding = Finding & { route: string; reason: string }
export type DeclaredDefect = KnownDefect & { where: string }

export interface FrameSummary extends Where {
  checks: number
  failures: number
  knownDefects: number
  exempt: number
  indeterminate: number
}

export interface ContrastReport {
  schema: typeof CONTRAST_SCHEMA_ID
  unit: string
  round: number
  manifestSha256: string
  measuredAt: string
  passed: boolean
  thresholds: Record<CheckKind, number>
  coverage: typeof COVERAGE
  frames: FrameSummary[]
  failures: Finding[]
  knownDefects: KnownFinding[]
  unmeasured: ContrastDeclarations['unmeasured']
  indeterminate: (Where & Indeterminate)[]
  /** Declared defects that matched nothing this round: stale, and able to hide a future miss. */
  unmatchedDefects: DeclaredDefect[]
  /** Reasons the round cannot be judged at all, such as an image variant with no measurement. */
  problems: string[]
}

const EMPTY: ContrastDeclarations = { knownDefects: [], measured: [], unmeasured: [] }

type Scoped = { decl: ContrastDeclarations; where: string; keys: Set<string> | null }

/** The round's declarations hold for every frame; a section's hold for its own frames. */
function scopes(manifest: Manifest): Scoped[] {
  return [
    { decl: manifest.contrast ?? EMPTY, where: 'contrast', keys: null },
    ...(manifest.sections ?? []).map((s) => ({
      decl: s.contrast ?? EMPTY,
      where: `section ${s.id} contrast`,
      keys: new Set(s.variantKeys),
    })),
  ]
}

export interface Declared {
  defects: DeclaredDefect[]
  /** The defects that may excuse a miss on this frame. */
  defectsFor: (variantKey: string) => DeclaredDefect[]
  measured: ContrastDeclarations['measured']
  unmeasured: ContrastDeclarations['unmeasured']
}

export function declarations(manifest: Manifest): Declared {
  const all = scopes(manifest)
  const scoped = all.flatMap(({ decl, where, keys }) =>
    decl.knownDefects.map((d) => ({ defect: { ...d, where }, keys }))
  )
  return {
    defects: scoped.map((s) => s.defect),
    defectsFor: (key) => scoped.filter((s) => !s.keys || s.keys.has(key)).map((s) => s.defect),
    measured: all.flatMap((s) => s.decl.measured),
    unmeasured: all.flatMap((s) => s.decl.unmeasured),
  }
}

/** Exact on every axis: one declaration excuses one element's miss, never a family of them. */
export function matchesDefect(defect: KnownDefect, finding: Finding): boolean {
  if (defect.variant !== undefined && defect.variant !== finding.variant) return false
  if (defect.mode !== finding.mode || defect.kind !== finding.kind) return false
  if (defect.maxRatio !== undefined && finding.ratio > defect.maxRatio) return false
  return finding.testId === defect.element || finding.selector === defect.element
}

function findingOf(where: Where, check: Check): Finding {
  const { pass: _pass, ...rest } = check
  return { ...where, ...rest }
}

interface Tally {
  failures: Finding[]
  knownDefects: KnownFinding[]
  matched: Set<DeclaredDefect>
}

/** Splits misses into undeclared failures and declared defects, remembering which matched. */
function route(misses: Finding[], defects: DeclaredDefect[], tally: Tally): void {
  for (const miss of misses) {
    const defect = defects.find((d) => matchesDefect(d, miss))
    if (!defect) {
      tally.failures.push(miss)
      continue
    }
    tally.matched.add(defect)
    tally.knownDefects.push({ ...miss, route: defect.route, reason: defect.reason })
  }
}

function summarize(frame: MeasuredFrame, misses: Finding[], declared: Declared): FrameSummary {
  const defects = declared.defectsFor(frame.variant)
  const known = misses.filter((m) => defects.some((d) => matchesDefect(d, m))).length
  return {
    variant: frame.variant,
    width: frame.width,
    mode: frame.mode,
    checks: frame.result.checks.length,
    failures: misses.length - known,
    knownDefects: known,
    exempt: frame.result.checks.filter((c) => c.exempt).length,
    indeterminate: frame.result.indeterminate.length,
  }
}

/** A builder-supplied image measurement, judged at the same thresholds as a DOM one. */
function imageMisses(declared: Declared): Finding[] {
  return declared.measured
    .filter((m) => m.ratio < REQUIRED_RATIO[m.kind])
    .map((m) => ({
      variant: m.variant,
      mode: m.mode,
      kind: m.kind,
      role: m.kind === 'non-text' ? 'mark' : 'text',
      selector: m.element,
      text: `measured by ${m.source}`,
      ratio: floorRatio(m.ratio),
      required: REQUIRED_RATIO[m.kind],
    }))
}

/** An image frame has no DOM: each mode needs a measurement or an explicit "unmeasured" reason. */
function imageProblems(manifest: Manifest, declared: Declared): string[] {
  const covered = new Set(
    [...declared.measured, ...declared.unmeasured].map((m) => `${m.variant}|${m.mode}`)
  )
  return manifest.variants
    .filter(isImageVariant)
    .flatMap((v) =>
      THEME_MODES.filter((mode) => !covered.has(`${v.key}|${mode}`)).map(
        (mode) =>
          `image variant ${v.key} has no ${mode} contrast measurement; add contrast.measured, or contrast.unmeasured with a reason, for ${mode}`
      )
    )
}

export interface ReportInput {
  manifest: Manifest
  manifestSha256: string
  frames: MeasuredFrame[]
  measuredAt?: Date
}

export function contrastReport({ manifest, manifestSha256, frames, measuredAt }: ReportInput) {
  const declared = declarations(manifest)
  const tally: Tally = { failures: [], knownDefects: [], matched: new Set() }
  const summaries = frames.map((frame) => {
    const where = { variant: frame.variant, width: frame.width, mode: frame.mode }
    const misses = frame.result.checks.filter((c) => !c.pass).map((c) => findingOf(where, c))
    route(misses, declared.defectsFor(frame.variant), tally)
    return summarize(frame, misses, declared)
  })
  for (const miss of imageMisses(declared)) route([miss], declared.defectsFor(miss.variant), tally)
  const problems = imageProblems(manifest, declared)
  const report: ContrastReport = {
    schema: CONTRAST_SCHEMA_ID,
    unit: manifest.unit,
    round: manifest.round,
    manifestSha256,
    measuredAt: (measuredAt ?? new Date()).toISOString(),
    passed: tally.failures.length === 0 && problems.length === 0,
    thresholds: REQUIRED_RATIO,
    coverage: COVERAGE,
    frames: summaries,
    failures: tally.failures,
    knownDefects: tally.knownDefects,
    unmeasured: declared.unmeasured,
    indeterminate: frames.flatMap((f) =>
      f.result.indeterminate.map((i) => ({
        variant: f.variant,
        width: f.width,
        mode: f.mode,
        ...i,
      }))
    ),
    unmatchedDefects: declared.defects.filter((d) => !tally.matched.has(d)),
    problems,
  }
  return report
}

type Row = Finding & { widths: number[] }

/** The same miss at several widths prints once, with its widths. */
function byElement<T extends Finding>(findings: T[]): (T & Row)[] {
  const rows = new Map<string, T & Row>()
  for (const f of findings) {
    const key = [f.variant, f.mode, f.kind, f.selector, f.ratio].join('|')
    const row = rows.get(key) ?? { ...f, widths: [] }
    if (f.width !== undefined) row.widths.push(f.width)
    rows.set(key, row)
  }
  return [...rows.values()]
}

function describe(f: Row): string {
  const at = f.widths.length ? ` @${f.widths.join(',')}` : ''
  const colors = f.fg && f.bg ? ` ${f.fg} on ${f.bg}` : ''
  const label = f.text ? ` "${f.text}"` : ''
  return `${f.variant} ${f.mode}${at} ${f.kind} (${f.role}) ${f.ratio}:1 < ${f.required}${colors}${label} [${f.selector}]`
}

/** Every failure, known defect and unmeasured frame, one line each: nothing is hidden. */
export function formatContrastReport(report: ContrastReport): string[] {
  const checks = report.frames.reduce((n, f) => n + f.checks, 0)
  return [
    `contrast: ${report.frames.length} frames, ${checks} checks, ${report.failures.length} undeclared failures, ` +
      `${report.knownDefects.length} known defects, ${report.unmeasured.length} unmeasured, ` +
      `${report.indeterminate.length} indeterminate`,
    ...byElement(report.failures).map((f) => `  FAIL ${describe(f)}`),
    ...byElement(report.knownDefects).map((f) => `  KNOWN ${f.route} ${describe(f)}: ${f.reason}`),
    ...report.unmeasured.map((u) => `  UNMEASURED ${u.variant} ${u.mode}: ${u.reason}`),
    ...report.unmatchedDefects.map(
      (d) =>
        `  UNMATCHED ${d.where} ${d.route}: matched nothing this round; remove it (${d.reason})`
    ),
    ...report.problems.map((p) => `  REFUSED ${p}`),
  ]
}
