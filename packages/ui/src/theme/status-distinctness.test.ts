/**
 * Status tokens that mean different things must LOOK different.
 *
 * `status-error-vivid` existed to separate "drop everything" from "serious",
 * and it pointed at `ramp.red[600]` — the exact value of `status-error`. The two
 * had been rendering as one colour for as long as the token had existed, in both
 * themes. Three other places in the system already disagreed with it and said
 * vivid was `#FF4757`: `--color-status-error-vivid-rgb`, the `-subtle` rgba, and
 * the `glow` shadow in `Indicator`. Only the value anyone actually rendered was
 * wrong.
 *
 * Nothing caught it because every existing token test asks whether a value is
 * PRESENT and parity-matched across config.ts and global.css — a collapsed token
 * is present and matches perfectly. Distinctness is a different question, so it
 * gets its own gate.
 *
 * Found 2026-08-31 by measuring a rendered Storybook story, not by reading the
 * tokens: `SeverityLabel`'s Critical and High dots came back the same RGB.
 */
import { describe, it, expect } from 'vitest'
import { semanticColorsDark, semanticColorsLight } from './tokens/semantic'

type SemanticMap = Record<string, string>

const THEMES: [string, SemanticMap][] = [
  ['dark', semanticColorsDark as SemanticMap],
  ['light', semanticColorsLight as SemanticMap],
]

/**
 * Token pairs a viewer is expected to tell apart at a glance. Each pair carries
 * the reason, so a future retune can weigh it rather than just delete the row.
 */
const MUST_DIFFER: [string, string, string][] = [
  [
    'status-error',
    'status-error-vivid',
    'severity Critical vs High, and DeviceRow/DeviceIndicator "lost" vs a plain error',
  ],
  ['status-error', 'status-warning', 'error vs warning is the most common status pairing'],
  ['status-warning', 'status-info', 'warning vs informational'],
  ['status-success', 'status-info', 'succeeded vs merely reporting'],
]

describe('semantically distinct status tokens render distinct values', () => {
  for (const [theme, colors] of THEMES) {
    for (const [a, b, why] of MUST_DIFFER) {
      it(`${theme}: ${a} !== ${b} — ${why}`, () => {
        // Both must exist, or the assertion passes vacuously on a typo.
        expect(colors[a], `${a} missing from ${theme}`).toBeTruthy()
        expect(colors[b], `${b} missing from ${theme}`).toBeTruthy()
        expect(colors[a]!.toLowerCase()).not.toBe(colors[b]!.toLowerCase())
      })
    }
  }
})

describe('status-error-vivid is the vivid red the rest of the system already assumes', () => {
  for (const [theme, colors] of THEMES) {
    it(`${theme}: matches the #FF4757 that -rgb, -subtle and Indicator's glow encode`, () => {
      expect(colors['status-error-vivid']!.toLowerCase()).toBe('#ff4757')
    })
  }
})
