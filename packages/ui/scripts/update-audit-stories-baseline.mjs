/**
 * Regenerate `scripts/audit-stories/ratchet-baseline.json` from an audit:stories dom.json.
 *
 *   pnpm audit:stories:baseline <dom.json> [--kind text-floor] [--allow-increase]
 *   pnpm audit:stories:baseline <dom.json> --seed <story count>
 *
 * Every story the dom.json rendered at all of the baseline's widths has its keys replaced by the
 * ones observed; every other story keeps its keys, so a scoped run is enough to shrink the file.
 * A key that is not already listed is refused unless you pass --allow-increase. The ceiling is
 * always set to the new key count. It never starts Storybook.
 *
 * --seed writes the file when none exists, from an `--all` dom.json whose story count matches
 * the count the run printed (`<n> stories in ...`). `--baseline <path>` and `--sha <sha>` point it
 * at another file and provenance (the test uses temp files).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isEntryPoint } from './lib/entry.mjs'
import {
  BASELINE_PATH,
  BASELINE_SCHEMA,
  RATCHETED_KINDS,
  fullyAudited,
  keysOf,
  loadBaseline,
} from './audit-stories/ratchet.mjs'

const keyList = (stories) =>
  Object.entries(stories).flatMap(([id, selectors]) => selectors.map((s) => `${id} ${s}`))

/**
 * `previous` with each `audited` story's selectors replaced by `observed`'s, and a story with
 * none left dropped. `added` and `dropped` are `<story id> <selector>` strings. Pure.
 */
export function mergeKeys(previous, observed, audited) {
  const next = { ...previous }
  for (const id of audited) {
    const selectors = [...(observed.get(id) ?? [])].sort()
    if (selectors.length > 0) next[id] = selectors
    else delete next[id]
  }
  const before = new Set(keyList(previous))
  const after = new Set(keyList(next))
  return {
    next,
    added: [...after].filter((k) => !before.has(k)).sort(),
    dropped: [...before].filter((k) => !after.has(k)).sort(),
  }
}

const sortedObject = (object, value = (v) => v) =>
  Object.fromEntries(
    Object.keys(object)
      .sort()
      .map((k) => [k, value(object[k])])
  )

/** The file text: stories, selectors, kinds and ceilings sorted, two-space indented. */
export function serialise(baseline) {
  const sorted = {
    schema: baseline.schema,
    generated: baseline.generated,
    ceiling: sortedObject(baseline.ceiling),
    kinds: sortedObject(baseline.kinds, (stories) => sortedObject(stories, (s) => [...s].sort())),
  }
  return `${JSON.stringify(sorted, null, 2)}\n`
}

const withKind = (baseline, kind, stories) => ({
  ...baseline,
  ceiling: { ...baseline.ceiling, [kind]: keyList(stories).length },
  kinds: { ...baseline.kinds, [kind]: stories },
})

/** A fresh baseline of every key in `entries`, at the widths the entries were captured at. */
export function seedBaseline(entries, { kind, sha, storyCount }) {
  const ids = new Set(entries.map((e) => e.id))
  if (ids.size !== storyCount) {
    throw new Error(`--seed expects ${storyCount} stories, dom.json has ${ids.size}`)
  }
  const widths = [...new Set(entries.map((e) => e.width))].sort((a, b) => a - b)
  const observed = keysOf(entries, kind, widths)
  const { next } = mergeKeys({}, observed, observed.keys())
  const empty = { schema: BASELINE_SCHEMA, generated: { sha, widths }, ceiling: {}, kinds: {} }
  return withKind(empty, kind, next)
}

/** `baseline` with `kind` merged from `entries`; `added` lists keys the caller must allow. */
export function updateBaseline(baseline, entries, kind) {
  const { widths } = baseline.generated
  const observed = keysOf(entries, kind, widths)
  const merged = mergeKeys(baseline.kinds[kind] ?? {}, observed, fullyAudited(entries, widths))
  return { ...merged, baseline: withKind(baseline, kind, merged.next) }
}

function parseArgs(argv) {
  const value = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
  const kind = value('--kind') ?? RATCHETED_KINDS[0]
  if (!RATCHETED_KINDS.includes(kind)) throw new Error(`--kind takes ${RATCHETED_KINDS.join(', ')}`)
  const seed = value('--seed')
  const valueIndexes = ['--kind', '--seed', '--baseline', '--sha']
    .filter((f) => argv.includes(f))
    .map((f) => argv.indexOf(f) + 1)
  const domFile = argv.find((a, i) => !a.startsWith('--') && !valueIndexes.includes(i))
  if (!domFile) throw new Error('usage: update-audit-stories-baseline.mjs <dom.json> [flags]')
  return {
    domFile: resolve(domFile),
    kind,
    allowIncrease: argv.includes('--allow-increase'),
    storyCount: seed === undefined ? undefined : Number(seed),
    baselinePath: resolve(value('--baseline') ?? BASELINE_PATH),
    sha: value('--sha'),
  }
}

const headSha = () => execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' })

function seed(opts, entries) {
  if (existsSync(opts.baselinePath))
    throw new Error(`${opts.baselinePath} exists; --seed is for none`)
  const sha = opts.sha ?? headSha().trim()
  const baseline = seedBaseline(entries, { ...opts, sha })
  writeFileSync(opts.baselinePath, serialise(baseline))
  console.log(`seeded ${opts.kind}: ${baseline.ceiling[opts.kind]} keys at ${sha}`)
  return 0
}

function update(opts, entries) {
  const out = updateBaseline(loadBaseline(opts.baselinePath), entries, opts.kind)
  if (out.added.length > 0 && !opts.allowIncrease) {
    console.error(
      'Refusing to add keys to the ratchet baseline (fix them, or pass --allow-increase):'
    )
    for (const key of out.added) console.error(`  new key: ${opts.kind} ${key}`)
    return 1
  }
  writeFileSync(opts.baselinePath, serialise(out.baseline))
  console.log(
    `${opts.kind}: ${out.baseline.ceiling[opts.kind]} keys ` +
      `(${out.dropped.length} dropped, ${out.added.length} added)`
  )
  return 0
}

export function main(argv) {
  const opts = parseArgs(argv)
  const { stories: entries } = JSON.parse(readFileSync(opts.domFile, 'utf8'))
  return opts.storyCount === undefined ? update(opts, entries) : seed(opts, entries)
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  try {
    process.exitCode = main(process.argv.slice(2))
  } catch (err) {
    console.error(`audit-stories baseline: ${err.message}`)
    process.exitCode = 1
  }
}
