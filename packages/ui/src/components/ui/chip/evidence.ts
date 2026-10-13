import type { PillTone } from '../pill'

/** How far a viewer can trust an on-screen fact, from checked at a pin to invented. */
export const EVIDENCE_KINDS = [
  'verified',
  'measured',
  'computed',
  'docs-claim',
  'estimated',
  'target',
  'our-framing',
  'reconstructed',
  'illustrative',
] as const

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

// Grouped by trust, not one hue per kind: success = we checked it, info = stated
// but not checked by us, warning = the thing on screen is not the real artefact.
// Editorial framing sits on a third of all chips, so it stays neutral rather than
// diluting the warning that reconstructed and illustrative need.
export const EVIDENCE_TONE: Record<EvidenceKind, PillTone> = {
  verified: 'success',
  measured: 'success',
  computed: 'success',
  'docs-claim': 'info',
  estimated: 'info',
  target: 'info',
  'our-framing': 'neutral',
  reconstructed: 'warning',
  illustrative: 'warning',
}

/** Lowercase on purpose: `titan/no-raw-caps` bans `uppercase` on a label. */
export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  verified: 'verified',
  measured: 'measured',
  computed: 'computed',
  'docs-claim': 'docs claim',
  estimated: 'estimated',
  target: 'target',
  'our-framing': 'our framing',
  reconstructed: 'reconstructed',
  illustrative: 'illustrative',
}
