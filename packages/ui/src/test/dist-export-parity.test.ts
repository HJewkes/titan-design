import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Root barrel dist/runtime export parity (VW-388).
 *
 * The bug: `export type { MuscleGroup } from './muscleTaxonomy'` restricts the
 * COMPILED JS to a type-only re-export (dist/index.mjs has no `MuscleGroup`
 * binding), but `MuscleGroup` is a TS `enum` — a value-bearing declaration —
 * so tsup's dts bundler still lists it bare (no `type` keyword) in the final
 * `export { ... }` of dist/index.d.ts. `import { MuscleGroup } from
 * '@titan-design/react-ui'` then typechecks and crashes at runtime.
 *
 * This walks the actual built dist/index.d.ts export list and asserts every
 * bare (non-`type`) name is a real dist/index.mjs export, unless it's on the
 * explicit allowlist below — names whose only declaration anywhere in `src`
 * is an `interface`/`type` alias, so the bare listing is a cosmetic bundler
 * quirk (rollup-plugin-dts loses the `type` keyword through multi-hop
 * re-exports) rather than a bug: TypeScript never lets you import a pure type
 * as a value regardless of how the .d.ts phrases it.
 *
 * Dist-level (not source-level): the bug is invisible from source, since the
 * mismatch only exists between two separately-built artifacts. Requires
 * `pnpm build` to have run first — real CI always builds before testing
 * (.github/workflows/ci.yml), so this skips with a clear message rather than
 * failing when dist/ is absent (e.g. `pnpm test` run standalone locally).
 */

const testDir = path.dirname(fileURLToPath(import.meta.url))
const uiRoot = path.resolve(testDir, '..', '..')
const DTS_PATH = path.join(uiRoot, 'dist', 'index.d.ts')
const MJS_PATH = path.join(uiRoot, 'dist', 'index.mjs')

// Confirmed via `grep -rn "export (enum|class|function|const|let|var) <Name>"
// src` returning nothing for any of these: every declaration site is an
// `interface` or `type` alias, so none can ever be imported as a value.
const KNOWN_TYPE_ONLY_BARE_NAMES = new Set([
  'ElevationLevel', // theme/elevation.ts: type alias
  'ExerciseIndicatorKind', // components/custom/Workout/ExerciseIndicator.tsx: type alias
  'GlowIntensity', // theme/elevation.ts: type alias
  // The goal family, which VW-385 gave another re-export hop (the summary and the
  // tile now both re-export the milestone types): every one is an interface or a
  // type alias in `GoalTrajectoryChartGeometry.ts` / `goalMilestone.ts`.
  'GoalActualPoint',
  'GoalDirection',
  'GoalExpectedPoint',
  'GoalMilestoneReading',
  'GoalMilestoneState',
  'GoalMilestoneTarget',
  'GoalNextTarget',
  'GoalReach',
  'GoalTrajectoryStatus',
  'GoalTrajectoryWeek',
  'GoalWeekCell',
  'GoalWeekEntry',
  'GoalWeekOutcome',
  'LiftOptions', // theme/lift.ts: interface
  'SetRowProps', // components/custom/Workout/SetRow.tsx: type alias
  'SetStripSet', // components/custom/Workout/SetBar.tsx: type alias
  'SurfaceLevel', // theme/surface-planes.ts: type alias
  'ThemeMode', // theme/tokens/semantic.ts: type alias
  'VolumeLandmarks', // components/custom/Workout/muscleTaxonomy.ts: interface
  'VolumeStatus', // components/custom/Workout/muscleTaxonomy.ts: type alias
])

interface ExportEntry {
  alias: string
  typeOnly: boolean
}

/** Parses the final `export { ... };` statement of a bundled dist file. */
function parseFinalExportStatement(source: string): ExportEntry[] {
  const start = source.lastIndexOf('export {')
  const end = source.indexOf('};', start)
  const inner = source.slice(start + 'export {'.length, end)
  return inner
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const typeOnly = part.startsWith('type ')
      const body = typeOnly ? part.slice('type '.length).trim() : part
      const asMatch = body.match(/^.+?\sas\s(.+)$/)
      const alias = asMatch ? asMatch[1].trim() : body
      return { alias, typeOnly }
    })
}

const distBuilt = fs.existsSync(DTS_PATH) && fs.existsSync(MJS_PATH)

describe.skipIf(!distBuilt)('root barrel dist/runtime export parity (VW-388)', () => {
  it('has a runtime export for every non-type-only name dist/index.d.ts declares', () => {
    const dtsExports = parseFinalExportStatement(fs.readFileSync(DTS_PATH, 'utf8'))
    const mjsNames = new Set(
      parseFinalExportStatement(fs.readFileSync(MJS_PATH, 'utf8')).map((e) => e.alias)
    )

    const missing = dtsExports
      .filter((e) => !e.typeOnly && !KNOWN_TYPE_ONLY_BARE_NAMES.has(e.alias))
      .filter((e) => !mjsNames.has(e.alias))
      .map((e) => e.alias)

    expect(missing).toEqual([])
  })

  // Positive control: MuscleGroup is the exact case VW-388 found, and stays a
  // real value export post-fix (not just absent from the `missing` list above).
  it('exports MuscleGroup as a runtime value, matching the type dist/index.d.ts declares', () => {
    const mjsNames = new Set(
      parseFinalExportStatement(fs.readFileSync(MJS_PATH, 'utf8')).map((e) => e.alias)
    )
    expect(mjsNames.has('MuscleGroup')).toBe(true)
  })
})
