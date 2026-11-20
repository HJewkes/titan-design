// `audit:stories --text-spacing` (DR-RB-03): re-audits each frame under the WCAG 1.4.12
// text-spacing overrides and reports every blocker the overrides introduce as a warning.
export const TEXT_SPACING_LOSS = 'text-spacing-loss'
export const TEXT_SPACING_WIDTHS = Object.freeze([360, 1280])

// The WCAG 1.4.12 minimums, forced over author styles the way a user stylesheet would.
export const TEXT_SPACING_CSS = `* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p {
  margin-bottom: 2em !important;
}`

const keyOf = (blocker) => `${blocker.kind}\u0000${blocker.selector}`

/**
 * The blockers in `spaced` that `base` does not have, keyed by kind and selector so a blocker
 * that only grew (overflow by 4px, then by 9px) is not new. Each becomes a warning.
 */
export function textSpacingLosses(base, spaced) {
  const before = new Set(base.map(keyOf))
  return spaced
    .filter((b) => !before.has(keyOf(b)))
    .map((b) => ({
      kind: TEXT_SPACING_LOSS,
      selector: b.selector,
      lost: b.kind,
      detail: `${b.kind} under text spacing: ${b.detail}`,
    }))
}

/**
 * Injects the overrides into the open story, lets it settle, and audits it again. The stylesheet
 * stays until the next navigation, so run this after the frame's own audit and screenshot.
 */
export async function textSpacingPass(page, { audit, baseBlockers, settle }) {
  await page.addStyleTag({ content: TEXT_SPACING_CSS })
  await settle()
  const spaced = await audit()
  return textSpacingLosses(baseBlockers, spaced.blockers)
}
