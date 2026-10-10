# 0003. Tone recipe and light solid ladder

## Status

accepted

## Need

Every coloured surface in titan (Badge, Pill, Chip, Alert, Button, Toast, IconBox, tool pills) picks
its fill, label and border from its own map. An audit found the solid fill drawn from three
different sources, the solid label from two, the subtle label from four and tone-used-as-text from
three. Button froze its labels to the dark palette in both modes, so a light solid carried the dark
label, and ghost labels in light read the base tone at 1.73:1 (brand) to 3.30:1 (warning).

Two things were missing: one rule that maps a tone and an emphasis to a fixed fill, label and
border, and one rule for which ramp step a light solid sits on and what label it takes. This record
fixes both so that the token PRs that follow (FacetBar, the neutral solid, the info solid, the
subtle encoding and the colour family) measure against a settled target.

Scope: roles only. No new primitive, hue or token category is added. Light `brand-primary-solid`
moves one ramp step; `brand-primary-hover` and `brand-primary-active` follow it.

## Why existing tokens or primitives cannot serve it

1. The base tone tokens (`brand-primary`, `status-warning`, ...): tuned as marks (borders, dots,
   chart ink) at the 3:1 floor, so they cannot double as 4.5:1 text or as a solid fill under one
   label. Using them as text is the ghost-label failure above.
2. The `on-*` and `*-solid` pairs: the right tokens for a solid, but with no rule for which step the
   light fill takes, brand sat on orange 400 under white (2.63:1) while success and warning had
   already moved to their light-tuning steps.
3. The `text-{tone}` tokens: already at the step that clears 4.5:1 on every plane in each mode, and
   already the outline label in Pill. What was missing is the rule that every text emphasis reads
   them.

## Options

Recipe (FD2):

1. **One table, tone × emphasis.** A tone (neutral, brand, brand-secondary, success, warning,
   error, info) crossed with an emphasis (solid, subtle, outline, text) gives one fixed triple of
   fill, label and border. Solid: `{tone}-solid` fill, `on-{tone}` label. Subtle: `{tone}-subtle`
   fill, `on-{tone}-subtle` label. Outline: base tone border, `text-{tone}` label. Text: no fill,
   `text-{tone}` label. The base tone is a mark only. States are modifiers on the triple.
2. The same table, but text emphasis keeps the base tone and the base tones are re-tuned to
   4.5:1. Costs a second light value per hue and loses the 3:1 mark step.
3. Keep per-component maps and gate only the tokens. This is today.

Light solid ladder (FD3):

1. **Step 600 under white, with two named exceptions.** Light solid = step 600 of the hue, label
   white, hover one step down, active one below that; mark and border on the same 600; text at
   step 700 or deeper. Brand stays on orange 500 and warning on amber 500, both under white, as
   the owner picked. Dark keeps the shipped steps (orange 400, cyan 500, green 300, red 500, amber
   300, blue 500) under grey 950. Neutral is grey 700 under white in light and grey 200 under grey
   950 in dark.
2. No exceptions: brand and warning to 600 (5.19 and 5.02 under white). A clean rule, but browner
   and it overturns two owner picks.
3. The exceptions keep a dark label (grey 950 on orange 400 reads 6.66). A per-slot label mix
   inside one set.

## Rendered evidence

- `components-atoms-pill--solid-tones`, `components-atoms-badge--all-colors` and
  `components-molecules-button--all-colors`, both themes, show the solid cells of the table.
- `components-molecules-button--outline`, `--ghost` and `--link` show the text emphasis on
  `text-{tone}`.

Weighed in Gate 2 batch 10, questions r1-rule (one rule for every coloured surface), r2-brand
(brand 500 under white), r3-warning (warning white everywhere), r5-dark (dark steps as built) and
r7-neutral; TD-487 round 4 q2 (amber 500 under white); decisions round 3 q3 (solid fill from
`-solid`, label from `on-*`, Button on the per-mode token); decisions item 140(2) and 140(4). The
hover and active rungs under the orange 500 solid were not a question; this PR's Gate 2 frame
confirms them.

## Checks

Contrast, light, WCAG 2.1, white label on each candidate solid fill:

| Hue     | step 600 | step 500 |
| ------- | -------- | -------- |
| orange  | 5.19     | 3.74     |
| amber   | 5.02     | 3.63     |
| blue    | 4.89     | 3.12     |
| cyan    | 4.74     | 3.39     |
| green   | 4.56     | 3.25     |
| red     | 4.57     | 3.82     |
| magenta | 5.46     | 3.91     |

Non-text edge of the fill against the light `background-base` plane, grey 200 (decision 0002's
-1 plane, the worst light plane):

| Fill       | on grey 200 |
| ---------- | ----------- |
| orange 500 | 2.46        |
| amber 500  | 2.38        |
| orange 600 | 3.42        |
| amber 600  | 3.30        |

Both exceptions measure under the 3:1 non-text edge on grey 200, as measured from `primitives.ts`
at this head. On the grey 100 page they read 3.12 and 3.03. The edge matters only where a solid
capsule on the inset plane must be identified by its outline rather than its label, which no
current component asks of it; the labels read at large-text AA (3:1) and the two pairs stay
declared in `contrast-baseline.json`.

Hover and active under the brand solid: white on orange 600 reads 5.19, on orange 700 reads 7.24.

CVD and near-duplicate: not applicable. No hue or colour value is added; every fill is an existing
ramp step.

## Decision

Recipe option 1 and ladder option 1.

A tone and an emphasis give one fill, label and border, and a tone used as text always reads
`text-{tone}`; the base tone is a mark. Button reads its label through the same token in both the
className and the inline style, resolved for the mode of the nearest Surface, so light and dark
labels no longer share one hex.

Light solids sit on step 600 under white, with brand orange 500 and warning amber 500 as the two
named exceptions, both under white and both declared misses at 4.5:1. Hover is one step down,
active one more. The owner picked both exceptions twice on rendered frames; the new -1 edge number
is recorded here rather than re-asked, because no component identifies a solid capsule by its edge.

## Rejected alternatives

- Recipe option 2 (re-tune the base tones to 4.5:1 and keep them as text): a second light value per
  hue, and the 3:1 mark step is lost for borders, dots and chart ink.
- Recipe option 3 (per-component maps): the drift this record exists to end.
- Ladder option 2 (brand and warning to 600): overturns two owner picks for a browner brand.
- Ladder option 3 (dark label on the exceptions): a label mix inside one set, sent back by
  decisions item 140(2).

## Consequences

Land together in this PR: `semantic.ts` light `brand-primary-solid` (orange 500),
`brand-primary-hover` (orange 600) and `brand-primary-active` (orange 700); the matching `.light`
lines in `global.css`; the light fixture in `semantic-hex-guard.test.ts`; `Button.tsx` on the
per-mode token path with hover and active on the two stepped tokens; the light solid-label test;
the story contrast baseline re-keyed for white on orange 500.

Follow on the record: FacetBar's selected face on the same brand cell; the neutral solid (grey 700
under white in light, grey 200 under grey 950 in dark) in Alert and Button; the light info solid to
blue 600; a shared `toneRecipe(tone, emphasis)` helper with a parity test across Badge, Alert,
Button, IconBox and Toast; the subtle encoding and the colour family, which are their own records.
