// Every pure judge over one frame's collectLayout output: the TD-650 layout judges plus the probe
// modules. Each module exports
//   KINDS  the warning kinds it emits,
//   RULES  { kind: 'DR-*' } for every kind in KINDS,
//   judge(layout, ctx)  pure, returns [{ kind, selector, detail }] with the measured numbers and the
//                       threshold in `detail`, and never throws on a node missing an optional field.
// ctx is { tokens: { '#rrggbb': [token names] }, story: { id, title }, fonts: { mono },
// declared: { cssVar: px } }. Shared thresholds are imported from layout-probes.mjs, not copied.
import * as colourProbes from './colour-probes.mjs'
import * as elevationProbes from './elevation-probes.mjs'
import { MAX_FINDINGS_PER_KIND, capPerKind, judgeLayout } from './layout-probes.mjs'
import * as relationProbes from './relation-probes.mjs'
import * as typeProbes from './type-probes.mjs'

export const PROBE_MODULES = Object.freeze([
  colourProbes,
  elevationProbes,
  relationProbes,
  typeProbes,
])

export const PROBE_KINDS = Object.freeze(PROBE_MODULES.flatMap((m) => m.KINDS))
export const PROBE_RULES = Object.freeze(Object.assign({}, ...PROBE_MODULES.map((m) => m.RULES)))
/** Kinds gated by ratchet.mjs's baseline, exempt from the per-frame cap so their keys are exact. */
export const RATCHETED_KINDS = Object.freeze([typeProbes.TEXT_FLOOR])

// A capped ratcheted kind would report a different 25 once one is fixed, so it stays uncapped.
export function judgeAll(layout, ctx, modules = PROBE_MODULES) {
  const all = [
    ...judgeLayout(layout, { limit: Infinity }),
    ...modules.flatMap((m) => m.judge(layout, ctx)),
  ]
  const ratcheted = all.filter((f) => RATCHETED_KINDS.includes(f.kind))
  const capped = all.filter((f) => !RATCHETED_KINDS.includes(f.kind))
  return [...capPerKind(capped, MAX_FINDINGS_PER_KIND), ...ratcheted]
}
