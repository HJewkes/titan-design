/**
 * The component anatomy detector behind `src/arch/component-anatomy.test.ts`.
 *
 * A ui unit is any directory under `ui/`, at any depth (`ui/charts/<name>`), that
 * directly holds a component `.tsx` (not a story or test). A grouping dir such as
 * `ui/charts`, or a dir of only `.ts`/`.md` fixtures, is not a unit. Under
 * `custom/**` and `shell/**` a unit is one PascalCase `.tsx` stem that its directory
 * `index.ts` exports; an unexported stem is an internal part. `icons/` is excluded.
 * An exported stem whose name extends another exported stem of its directory and that has no
 * story or test of its own is a part of that component (`TableCell` of `Table`), not a unit.
 *
 * Every function here except `readComponentTree` is pure over a tree: an object
 * mapping a path relative to `src/components` to that file's source. The test
 * feeds synthetic trees; the regen script and the ratchet feed the real one.
 *
 *   story   a `<Stem>.stories.tsx` or `<Stem>.<variant>.stories.tsx` (ui: any story in the dir)
 *   test    a `<Stem>.test.ts(x)` or `<Stem>.<variant>.test.ts(x)` (ui: any test in the dir)
 *   a11y    one of those tests runs `await axe(` and asserts `.toHaveNoViolations()`
 *   doc     MATURITY.md clause 2b: a README in the dir, `Composes` in a story, or a
 *           `ui/README.md` row whose first cell is the backticked dir name
 *   status  every story file in the unit, except those tagged `!dev`, has a meta `tags` that
 *           holds `status:stable` or `status:candidate` together with `!status:review`
 *           (MATURITY.md is per story file); the inherited default and an explicit
 *           `status:review` fail, and so does a unit whose stories are all `!dev`
 */
import fs from 'node:fs'
import path from 'node:path'

export const CHECKS = ['story', 'test', 'a11y', 'doc', 'status']

export const REGEN_COMMAND = 'node packages/ui/scripts/update-component-anatomy-baseline.mjs'

const FAMILY_ROOTS = ['custom/', 'shell/']
const PASCAL_STEM = /^[A-Z][A-Za-z0-9]*$/
const READ_EXTENSIONS = ['.ts', '.tsx', '.md']

/** Every `.ts`, `.tsx` and `.md` file under `<pkgRoot>/src/components`, keyed by relative path. */
export function readComponentTree(pkgRoot) {
  const root = path.join(pkgRoot, 'src/components')
  const tree = {}
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      const rel = path.relative(root, abs).split(path.sep).join('/')
      if (entry.isDirectory()) {
        if (rel !== 'icons') walk(abs)
      } else if (READ_EXTENSIONS.includes(path.extname(entry.name))) {
        tree[rel] = fs.readFileSync(abs, 'utf8')
      }
    }
  }
  walk(root)
  return tree
}

const dirOf = (file) => file.slice(0, Math.max(0, file.lastIndexOf('/')))
const baseOf = (file) => file.slice(file.lastIndexOf('/') + 1)

function filesIn(tree, dir) {
  return Object.keys(tree).filter((file) => dirOf(file) === dir)
}

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

/** The public names a barrel exports, plus every module it re-exports from (`./Foo` gives `Foo`). */
export function barrelExports(source) {
  const code = stripComments(source)
  const names = new Set()
  for (const m of code.matchAll(/\bexport\b[^'"]*?\bfrom\s*['"]\.\/([^'"]+)['"]/g)) names.add(m[1])
  for (const m of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const specifier of m[1].split(',')) {
      const name = specifier.trim().split(/\s+/).pop()
      if (name) names.add(name)
    }
  }
  return names
}

const isComponentFile = (file) => file.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(file)

function uiUnits(tree) {
  const dirs = new Set()
  for (const file of Object.keys(tree)) {
    if (file.startsWith('ui/') && isComponentFile(file)) dirs.add(dirOf(file))
  }
  dirs.delete('ui')
  return [...dirs].map((dir) => ({ path: dir, dir, stem: null }))
}

function hasOwnStoryOrTest(tree, dir, stem) {
  return filesIn(tree, dir).some((file) => {
    const name = baseOf(file)
    return name.split('.')[0] === stem && /\.(stories|test)\.tsx?$/.test(name)
  })
}

function isPartOfExportedParent(tree, dir, stem, exported) {
  const hasParent = [...exported].some((other) => other !== stem && stem.startsWith(other))
  return hasParent && !hasOwnStoryOrTest(tree, dir, stem)
}

function familyUnits(tree) {
  const units = []
  for (const barrel of Object.keys(tree)) {
    const dir = dirOf(barrel)
    if (baseOf(barrel) !== 'index.ts' || !FAMILY_ROOTS.some((r) => barrel.startsWith(r))) continue
    const exported = barrelExports(tree[barrel])
    for (const file of filesIn(tree, dir)) {
      const stem = baseOf(file).replace(/\.tsx$/, '')
      if (!file.endsWith('.tsx') || !PASCAL_STEM.test(stem) || !exported.has(stem)) continue
      if (!isPartOfExportedParent(tree, dir, stem, exported))
        units.push({ path: `${dir}/${stem}`, dir, stem })
    }
  }
  return units
}

/** Every unit in the tree, sorted by path. */
export function findUnits(tree) {
  return [...uiUnits(tree), ...familyUnits(tree)].sort((a, b) => a.path.localeCompare(b.path))
}

function unitFiles(tree, unit, suffix) {
  return filesIn(tree, unit.dir).filter((file) => {
    const name = baseOf(file)
    if (!suffix.test(name)) return false
    return unit.stem === null || name.split('.')[0] === unit.stem
  })
}

/** The story meta's tags: the first `tags: [...]` in the file, which is the meta's by convention. */
export function metaTags(source) {
  const match = /\btags\s*:\s*\[([^\]]*)\]/.exec(source)
  if (!match) return []
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function hasExplicitStatus(source) {
  const tags = metaTags(source)
  const settled = tags.includes('status:stable') || tags.includes('status:candidate')
  return settled && tags.includes('!status:review')
}

const SKIP_CALL = /\b(?:it|test|describe)\.skip\s*\(/g

/** `source` without the argument list of every `it.skip(`, `test.skip(` and `describe.skip(` call. */
function stripSkipped(source) {
  let out = ''
  let from = 0
  for (const match of source.matchAll(SKIP_CALL)) {
    if (match.index < from) continue
    out += source.slice(from, match.index)
    let depth = 1
    let i = match.index + match[0].length
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === '(') depth++
      else if (source[i] === ')') depth--
    }
    from = i
  }
  return out + source.slice(from)
}

export function assertsAxe(source) {
  const live = stripSkipped(stripComments(source))
  return /await\s+axe\(/.test(live) && live.includes('.toHaveNoViolations()')
}

const isDevOnly = (source) => metaTags(source).includes('!dev')

function hasUiReadmeRow(tree, unit) {
  const readme = tree['ui/README.md']
  if (unit.stem !== null || !readme) return false
  const name = baseOf(unit.dir).replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
  return new RegExp(`^\\|\\s*\`${name}\``, 'm').test(readme)
}

function hasDoc(tree, unit, stories) {
  if (tree[`${unit.dir}/README.md`] !== undefined) return true
  if (stories.some((file) => tree[file].includes('Composes'))) return true
  return hasUiReadmeRow(tree, unit)
}

function statusPasses(tree, stories) {
  const shown = stories.filter((file) => !isDevOnly(tree[file]))
  return shown.length > 0 && shown.every((file) => hasExplicitStatus(tree[file]))
}

/** The checks one unit fails, in `CHECKS` order. */
export function unitGaps(tree, unit) {
  const stories = unitFiles(tree, unit, /\.stories\.tsx$/)
  const tests = unitFiles(tree, unit, /\.test\.tsx?$/)
  const passes = {
    story: stories.length > 0,
    test: tests.length > 0,
    a11y: tests.some((file) => assertsAxe(tree[file])),
    doc: hasDoc(tree, unit, stories),
    status: statusPasses(tree, stories),
  }
  return CHECKS.filter((check) => !passes[check])
}

/** Unit path to its sorted missing checks, for every unit with at least one gap. */
export function detectGaps(tree) {
  const gaps = {}
  for (const unit of findUnits(tree)) {
    const missing = unitGaps(tree, unit)
    if (missing.length > 0) gaps[unit.path] = missing
  }
  return gaps
}

/** `unit#check` for every gap in a unit-to-checks map. */
export function gapKeys(gaps) {
  return new Set(
    Object.entries(gaps).flatMap(([unit, checks]) => checks.map((c) => `${unit}#${c}`))
  )
}

/** New gaps (live, not in the baseline) and stale entries (in the baseline, no longer live). */
export function compareToBaseline(live, baseline) {
  const liveKeys = gapKeys(live)
  const baseKeys = gapKeys(baseline)
  return {
    added: [...liveKeys].filter((key) => !baseKeys.has(key)).sort(),
    stale: [...baseKeys].filter((key) => !liveKeys.has(key)).sort(),
  }
}

/** The baseline rewritten from the live gaps; `ok` is false when that adds a gap without `allowIncrease`. */
export function mergeBaseline(previous, live, { allowIncrease = false } = {}) {
  const { added } = compareToBaseline(live, previous)
  if (added.length > 0 && !allowIncrease) return { ok: false, added, baseline: previous }
  const sorted = Object.keys(live)
    .sort()
    .map((unit) => [unit, [...live[unit]].sort()])
  return { ok: true, added, baseline: Object.fromEntries(sorted) }
}

const FIXES = {
  story: (unit) => `add ${fileFor(unit, 'stories.tsx')}`,
  test: (unit) => `add ${fileFor(unit, 'test.tsx')} with an axe assertion`,
  a11y: () => 'assert `expect(await axe(container)).toHaveNoViolations()` in its test',
  doc: () =>
    'add a README.md in its directory, a `Composes` line in its story, or a `ui/README.md` row',
  status: () =>
    "set the story meta tags to ['status:candidate', '!status:review'] (or status:stable per MATURITY.md)",
}

function fileFor(unit, suffix) {
  return unit.startsWith('ui/')
    ? `a <Component>.${suffix} in src/components/${unit}/`
    : `src/components/${unit}.${suffix}`
}

function splitKey(key) {
  const at = key.lastIndexOf('#')
  return [key.slice(0, at), key.slice(at + 1)]
}

/** One failure line naming the unit, the check and the fix. */
export function describeGap(key, kind) {
  const [unit, check] = splitKey(key)
  if (kind === 'stale') {
    return (
      `${unit} now passes "${check}" (or no longer exists) but the baseline still lists it: ` +
      `delete "${check}" from its entry in src/arch/component-anatomy-baseline.json, or run \`${REGEN_COMMAND}\``
    )
  }
  return (
    `${unit} is missing "${check}": ${FIXES[check](unit)}. ` +
    `If the gap is deliberate, run \`${REGEN_COMMAND} --allow-increase\``
  )
}
