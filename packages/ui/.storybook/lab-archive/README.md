# Design Archive — historical record, not current design

Frozen captures of the Voltras design-exploration phase (roughly 2026-06 to
2026-07-11), preserved because the originals lived outside version control and
have since been deleted from disk. **Nothing here depicts shipped design.**

These files predate the titan token system. They use their own inline CSS
variables (`--bg-base: #101010`, `--surface-elevated: #191919`,
`--brand-primary: #FF7900`) — not titan tokens, and not the v0.10.0 surface
ramp. Do not read any colour, spacing, or component detail here as current.
The shipped system lives in `src/theme/tokens/`.

## What is still worth reading

The _reasoning_ — each direction's brief, the tradeoffs, and why the R2
synthesis converged the way it did. The R2 synthesis is the direct ancestor of
`src/lab/north-star/LivePage.tsx`.

## What is actively out of date

**Foundations.** All three specimens are titled "final" and all three were
superseded. The shipped categorical palette is 7 ordered hues in two variants
(`default`, `dark`), order blue → magenta → red → orange → green → cyan →
amber, with `CATEGORICAL_CVD_SAFE_MAX = 6`. None of the three archived
specimens match it — they show 9 hues, a main/light/dark variant split, and a
different hue order with a CVD floor of 8. Source of truth:
`src/theme/tokens/primitives.ts`.

See also `packages/ui/REJECTED.md` for directions deliberately not adopted.

## How this is wired

The HTML is served verbatim by a Storybook `staticDirs` entry (`.storybook/main.ts`)
under `/lab-archive/…`, and iframed by the stories in `src/lab/archive/`. Both the
stories and this directory are gated behind the same `publishOnly`
(`STORYBOOK_PUBLIC=1`) flag that drops every `Lab/*` story, so neither the stories
nor the raw HTML ship in a published build. None of it reaches the npm package
either — `.storybook/` is outside `files`, and `!src/lab` drops the stories.
