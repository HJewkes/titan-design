// The audit:stories ratchet (TD-954): a ratcheted kind's finding fails the run unless its
// (story id, selector) is in the committed, shrink-only ratchet-baseline.json.
import { TEXT_FLOOR } from './type-probes.mjs'

/** Kinds gated by the baseline. They are exempt from the per-frame cap so their keys are exact. */
export const RATCHETED_KINDS = Object.freeze([TEXT_FLOOR])
