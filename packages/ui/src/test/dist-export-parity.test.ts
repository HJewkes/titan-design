import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Dist/runtime export parity for the root, /workout and /motion entries (VW-388).
 *
 * The bug: `export type { MuscleGroup } from './muscleTaxonomy'` restricts the
 * COMPILED JS to a type-only re-export (dist/index.mjs has no `MuscleGroup`
 * binding), but `MuscleGroup` is a TS `enum` — a value-bearing declaration —
 * so tsup's dts bundler still lists it bare (no `type` keyword) in the final
 * `export { ... }` of dist/index.d.ts. `import { MuscleGroup } from
 * '@titan-design/react-ui'` then typechecks and crashes at runtime.
 *
 * This walks each entry's built dist/<entry>.d.ts export list and asserts every
 * bare (non-`type`) name is a real dist/<entry>.mjs export, unless it's on the
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
const distPath = (file: string) => path.join(uiRoot, 'dist', file)
// The root entry plus the subpaths decision 323 split off it, which inherit its names.
const ENTRIES = ['index', 'workout', 'motion']

// Confirmed via `grep -rn "export (enum|class|function|const|let|var) <Name>"
// src` returning nothing for any of these: every declaration site is an
// `interface` or `type` alias, so none can ever be imported as a value.
const KNOWN_TYPE_ONLY_BARE_NAMES = new Set([
  'BrandKey', // components/shell/brands.tsx: type alias
  'BrandPreset', // components/shell/brands.tsx: interface
  'ElevationLevel', // theme/elevation.ts: type alias
  'ExerciseIndicatorKind', // components/custom/Workout/ExerciseIndicator.tsx: type alias
  'GlowIntensity', // theme/elevation.ts: type alias
  // The /dependency-graph entry (TD-1023) shares these with the root, so the dts bundler moves
  // them to a shared chunk and re-exports them bare: interfaces in network-graph/types.ts.
  'GraphGroup',
  'GraphLayout',
  'GraphPoint',
  'NetworkGraphProps',
  // The goal family, which VW-385 gave another re-export hop (the summary and the
  // tile now both re-export the milestone types): every one is an interface or a
  // type alias in `GoalTrajectoryChartGeometry.ts` / `goalMilestone.ts`.
  'GoalActualPoint',
  'GoalCardChart',
  'GoalCardMilestone',
  'GoalCardProps',
  'GoalDirection',
  'GoalExpectedPoint',
  // VW-455's WholeBodyCard and GoalPriorityIndex add a hop to these two: a type alias in
  // `GoalCard.tsx` and one in `GoalPriorityIcon.tsx`.
  'GoalLiftStatus',
  'GoalMilestoneReading',
  'GoalMilestoneSummaryProps',
  'GoalMilestoneState',
  'GoalMilestoneTarget',
  'GoalNextTarget',
  'GoalPriority',
  'GoalReach',
  'GoalTrajectoryStatus',
  'GoalTrajectoryWeek',
  'GoalWeekCell',
  'GoalWeekEntry',
  'GoalWeekOutcome',
  'IndicatorColor', // components/ui/indicator/Indicator.tsx: type alias
  'IndicatorPulse', // components/ui/indicator/Indicator.tsx: type alias
  'LiftOptions', // theme/lift.ts: interface
  'PillSize', // components/ui/pill/Pill.tsx: type alias
  'PillSizeLevel', // components/ui/pill/Pill.tsx: type alias
  'PillTone', // components/ui/pill/Pill.tsx: type alias
  'SetRowProps', // components/custom/Workout/SetRow.tsx: type alias
  'SetStripSet', // components/custom/Workout/SetBar.tsx: type alias
  'SurfaceLevel', // theme/surface-planes.ts: type alias
  'ThemeMode', // theme/tokens/semantic.ts: type alias
  'VelocityLossThresholds', // components/custom/Workout/velocity-scale.ts: type alias
  'VelocityZoneBandProp', // components/custom/Workout/velocity-scale.ts: interface
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

function exportedNames(file: string): Set<string> {
  return new Set(
    parseFinalExportStatement(fs.readFileSync(distPath(file), 'utf8')).map((e) => e.alias)
  )
}

const distBuilt = ENTRIES.every(
  (entry) => fs.existsSync(distPath(`${entry}.d.ts`)) && fs.existsSync(distPath(`${entry}.mjs`))
)

describe.skipIf(!distBuilt)('dist/runtime export parity (VW-388)', () => {
  it.each(ENTRIES)(
    'has a runtime export for every non-type-only name dist/%s.d.ts declares',
    (entry) => {
      const dtsExports = parseFinalExportStatement(
        fs.readFileSync(distPath(`${entry}.d.ts`), 'utf8')
      )
      const mjsNames = exportedNames(`${entry}.mjs`)

      const missing = dtsExports
        .filter((e) => !e.typeOnly && !KNOWN_TYPE_ONLY_BARE_NAMES.has(e.alias))
        .filter((e) => !mjsNames.has(e.alias))
        .map((e) => e.alias)

      expect(missing).toEqual([])
    }
  )

  // Positive control: MuscleGroup is the exact case VW-388 found, and stays a
  // real value export post-fix (not just absent from the `missing` list above).
  // It moved with the Workout family to the `/workout` entry.
  it('exports MuscleGroup as a runtime value from dist/workout.mjs', () => {
    expect(exportedNames('workout.mjs').has('MuscleGroup')).toBe(true)
  })
})
