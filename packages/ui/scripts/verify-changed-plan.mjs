/**
 * Which local checks a change set needs (TD-646). Pure functions, so the selection is tested
 * without running git or any tool; `verify-changed.mjs` supplies the file list and runs the plan.
 */
export const UI_PREFIX = 'packages/ui/'

const SOURCE = /\.(ts|tsx|mts|mjs|js)$/
const TYPED = /\.(ts|tsx)$/
const STYLED = /\.(ts|tsx|css)$/
const TEST_FILE = /\.test\.(ts|tsx|mjs)$/

const vitest = (...args) => ['exec', 'vitest', 'run', ...args]
const under = (file, ...dirs) => dirs.some((dir) => file.startsWith(dir))

/** Unique, non-empty lines of git's `--name-only` style output. */
export const parseNameList = (text) => [
  ...new Set(
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  ),
]

/** The paths inside packages/ui, relative to it, and the count of changed paths elsewhere. */
export function splitByPackage(files) {
  const inUi = files.filter((f) => f.startsWith(UI_PREFIX)).map((f) => f.slice(UI_PREFIX.length))
  return { inUi, outside: files.length - inUi.length }
}

const sourceFiles = (files) => files.filter((f) => under(f, 'src/') && TYPED.test(f))

const needsCatalog = (f) =>
  (under(f, 'src/components/') && TYPED.test(f)) ||
  under(
    f,
    'src/arch/arch-graph.json',
    'src/arch/component-catalog',
    'scripts/catalog',
    'docs/component-catalog.md'
  ) ||
  f === 'MATURITY.md' ||
  f.startsWith('.storybook/preview')

const needsDecomposition = (f) =>
  (under(f, 'src/components/') && TYPED.test(f)) ||
  under(f, 'src/arch/decomposition', 'scripts/decomposition', 'scripts/update-decomposition')

const needsTypes = (f) => (under(f, 'src/') && TYPED.test(f)) || /^tsconfig.*\.json$/.test(f)

/** Test files to run: changed tests plus every source file, so vitest follows imports to dependents. */
const relatedInputs = (files) =>
  files.filter(
    (f) => (under(f, 'src/') && TYPED.test(f)) || (under(f, 'scripts/') && TEST_FILE.test(f))
  )

/**
 * Ordered steps for `files` (relative to packages/ui). Each is `{ name, args }` to run through
 * `pnpm`, or `{ name, skip }` with the reason its inputs did not change.
 */
export function planSteps(files) {
  const styled = files.filter((f) => under(f, 'src/') && STYLED.test(f))
  const linted = files.filter((f) => under(f, 'src/', 'scripts/') && SOURCE.test(f))
  const related = relatedInputs(files)
  const step = (name, matches, args, why) =>
    matches ? { name, args } : { name, skip: `no ${why} changed` }
  return [
    step(
      'prettier',
      styled.length,
      ['exec', 'prettier', '--check', ...styled],
      'src ts/tsx/css file'
    ),
    step(
      'eslint',
      linted.length,
      ['exec', 'eslint', '--max-warnings', '0', '--no-warn-ignored', ...linted],
      'src or scripts source file'
    ),
    step('type-check', files.some(needsTypes), ['exec', 'tsc', '--noEmit'], 'src ts/tsx file'),
    step(
      'type-check:examples',
      files.some(needsTypes),
      ['run', 'type-check:examples'],
      'src ts/tsx file'
    ),
    step(
      'catalog freshness',
      files.some(needsCatalog),
      vitest(
        '--project',
        'threads',
        'src/arch/component-catalog.freshness.test.ts',
        'src/arch/component-catalog.digest.test.ts'
      ),
      'component, story or catalog input'
    ),
    step(
      'decomposition ratchet',
      files.some(needsDecomposition),
      vitest('--project', 'threads', 'src/arch/decomposition.test.ts'),
      'component source'
    ),
    step(
      'arch:check',
      sourceFiles(files).length || files.some((f) => under(f, 'src/arch/arch-graph')),
      vitest('--project', 'threads', 'src/arch/arch-graph.freshness.test.ts'),
      'src ts/tsx file'
    ),
    step(
      'related tests',
      related.length,
      ['exec', 'vitest', 'related', '--run', '--project', 'threads', ...related],
      'src file or script test'
    ),
  ]
}
