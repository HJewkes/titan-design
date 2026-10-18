// The audit:stories ratchet (TD-954): a ratcheted kind's finding fails the run unless its
// (story id, selector) is in the committed, shrink-only ratchet-baseline.json. The key has no
// theme or width: a story's keys are the union over the widths the baseline was generated at.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RATCHETED_KINDS } from './probe-suite.mjs'

export { RATCHETED_KINDS }
export const BASELINE_SCHEMA = 1
export const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'ratchet-baseline.json')

/** The committed baseline. A missing or unreadable file throws: it is a repo file, not input. */
export function loadBaseline(file = BASELINE_PATH) {
  const baseline = JSON.parse(readFileSync(file, 'utf8'))
  if (baseline.schema !== BASELINE_SCHEMA) {
    throw new Error(`${file}: schema ${baseline.schema}, expected ${BASELINE_SCHEMA}`)
  }
  return baseline
}

const findingsOf = (entry, kind) =>
  [...entry.blockers, ...entry.warnings].filter((f) => f.kind === kind)

/** `{ story id: Set(selector) }` of `kind`, from rendered frames at one of `widths`. */
export function keysOf(entries, kind, widths) {
  const keys = new Map()
  for (const e of entries) {
    if (!e.rendered || !widths.includes(e.width)) continue
    if (!keys.has(e.id)) keys.set(e.id, new Set())
    for (const f of findingsOf(e, kind)) keys.get(e.id).add(f.selector)
  }
  return keys
}

/** Stories with a rendered frame at every one of `widths`: only their keys are known in full. */
export function fullyAudited(entries, widths) {
  const seen = new Map()
  for (const e of entries) {
    if (!e.rendered || !widths.includes(e.width)) continue
    if (!seen.has(e.id)) seen.set(e.id, new Set())
    seen.get(e.id).add(e.width)
  }
  return new Set([...seen].filter(([, at]) => at.size === widths.length).map(([id]) => id))
}

function staleKeys(entries, kind, widths, known) {
  const observed = keysOf(entries, kind, widths)
  return [...fullyAudited(entries, widths)].flatMap((id) =>
    (known[id] ?? []).filter((selector) => !observed.get(id).has(selector)).map((s) => `${id} ${s}`)
  )
}

function judgeFrame(entry, kind, widths, known, tally) {
  if (!widths.includes(entry.width)) {
    const tag = (f) => (f.kind === kind ? { ...f, ratchet: 'unbaselined-width' } : f)
    if (findingsOf(entry, kind).length > 0) tally.unbaselinedFrames++
    return { ...entry, warnings: entry.warnings.map(tag) }
  }
  const moved = []
  const warnings = []
  for (const f of entry.warnings) {
    if (f.kind !== kind) warnings.push(f)
    else if ((known[entry.id] ?? []).includes(f.selector)) {
      warnings.push({ ...f, ratchet: 'baselined' })
      tally.baselined.add(`${entry.id} ${f.selector}`)
    } else {
      moved.push({ ...f, ratchet: 'new' })
      tally.added.add(`${entry.id} ${f.selector}`)
    }
  }
  return { ...entry, warnings, blockers: [...entry.blockers, ...moved] }
}

function ratchetKind(entries, kind, baseline) {
  const widths = baseline.generated.widths
  const known = baseline.kinds[kind] ?? {}
  const tally = { added: new Set(), baselined: new Set(), unbaselinedFrames: 0 }
  const judged = entries.map((e) => (e.rendered ? judgeFrame(e, kind, widths, known, tally) : e))
  const report = {
    kind,
    added: [...tally.added].sort(),
    baselined: tally.baselined.size,
    stale: staleKeys(entries, kind, widths, known),
    unbaselinedFrames: tally.unbaselinedFrames,
  }
  return { entries: judged, report }
}

/**
 * Moves each ratcheted finding outside the baseline from `warnings` to `blockers` with
 * `ratchet: 'new'`; baselined ones stay warnings (`ratchet: 'baselined'`). Frames at a width the
 * baseline was not generated at keep theirs as warnings (`ratchet: 'unbaselined-width'`). Pure.
 */
export function applyRatchet(entries, baseline) {
  const reports = []
  let judged = entries
  for (const kind of RATCHETED_KINDS) {
    const out = ratchetKind(judged, kind, baseline)
    judged = out.entries
    reports.push(out.report)
  }
  return { entries: judged, report: reports }
}

/** One summary line per ratcheted kind. */
export function ratchetLines(report) {
  return report.map((r) => {
    const line =
      `ratchet ${r.kind}: ${r.added.length} new (fail), ${r.baselined} baselined (warn), ` +
      `${r.stale.length} stale, ${r.unbaselinedFrames} frames at unbaselined widths`
    return r.stale.length > 0 ? `${line}; run pnpm audit:stories:baseline <dom.json>` : line
  })
}
