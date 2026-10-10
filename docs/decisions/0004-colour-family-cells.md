# 0004. Colour family cells

## Status

accepted

## Need

Pill, Badge, Chip, Alert, the tool badges and the Session tints want a hue that is not a status: a
tool family, a tag, a zone, a deload week. The system had six tone roles, each carrying a meaning
(brand, success, warning, error, info), and nothing for a hue chosen for identity. Six sites drew
one by hand with an alpha wash (live, deload, vivid, the result pairs), and each of them fails AA in
one mode.

The subtle emphasis also had two encodings. Light `*-subtle` was a ramp step (hue 100 under hue
700); dark `*-subtle` was a 12% wash of the base tone over whatever plane the pill sat on, so the
same token composited to a different colour on each plane, and two labels were held off the family
rung to read on it (brand on orange 400, error on red 400 over an 8% wash). Decision 0003 named the
subtle encoding and the colour family as the two records that follow it.

Scope: one new colour root, `tint`, with four cells for each of seven hues and neutral (32 tokens,
both modes), every value an existing `primitiveRamps` or `greyRamp` step. No primitive, no hue, no
alpha. The six tone roles alias their hue's cells for `-solid`, `on-*`, `-subtle` and
`on-*-subtle`; `-muted`, `-strong`, `-light`, `-dark`, `status-live*`, `status-deload`,
`status-error-vivid*` and the `-rgb` triplets are untouched. One consumer changes: the WorkoutPill
deload paint, which had no role to alias.

## Why existing tokens or primitives cannot serve it

1. The base tone tokens (`brand-primary`, `status-warning`, ...): 3:1 marks, tuned for borders,
   dots and chart ink. A hue used as a fill needs its own label step, and a mark step carries none.
2. The `*-subtle` and `on-*-subtle` roles: the right shape, but a wash in dark and a step in light,
   so a label measured on a card did not hold on the page, and the family needed two named
   exceptions to read at all.
3. The status names themselves: `status-info-subtle` on a tool badge or a chart tag says the tag is
   informational. A tool family, a tag or a zone has no state to report, and a reader of the
   className should not have to know that the meaning is borrowed.

## Options

Family scope (fd5-family):

1. **Seven hues and neutral, four cells each, and the six tone roles alias their hue's cells.**
   The hues are the seven OKLCH ramps; neutral is the grey ramp. Red, orange, amber, green, cyan
   and blue are the roles' hues; magenta is the deload and categorical hue.
2. Five status hues only (orange, cyan, green, amber, red, blue as today's roles, no magenta, no
   neutral): the smallest set that de-duplicates the roles. Leaves deload and the neutral face
   hand-drawn.
3. No family: keep the six roles and add a seventh for each hue a component asks for. Today's
   drift, one role at a time.

Subtle encoding (fd4-subtle), with the label the cell carries:

1. Package 1 in both modes: hue 900 under hue 300 in dark, hue 100 under hue 700 in light,
   opaque steps. Light already has this; dark gets it.
2. Package 2 in both modes: hue 100 under hue 700 in light, and in dark a hue 800 fill under a
   hue 200 label. One rule, but the dark fill reads as a mid tone next to the planes.
3. **Mixed: package 1 for dark, package 2 for light.** Light keeps every value it has; dark
   becomes an opaque hue 900 cell, and the two label exceptions level with the family.
4. Alpha in both modes: today's dark wash mirrored into light. Keeps the plane-dependent label
   problem and the two exceptions.

Values, per member and mode (every value a ramp step):

| Member  | Light solid + on     | Light subtle + on       | Dark solid + on        | Dark subtle + on        |
| ------- | -------------------- | ----------------------- | ---------------------- | ----------------------- |
| red     | red 600 + white      | red 100 + red 700       | red 500 + grey 950     | red 900 + red 300       |
| orange  | orange 500 + white   | orange 100 + orange 700 | orange 400 + grey 950  | orange 900 + orange 300 |
| amber   | amber 500 + white    | amber 100 + amber 700   | amber 300 + grey 950   | amber 900 + amber 300   |
| green   | green 600 + white    | green 100 + green 700   | green 300 + grey 950   | green 900 + green 300   |
| cyan    | cyan 600 + white     | cyan 100 + cyan 700     | cyan 500 + grey 950    | cyan 900 + cyan 300     |
| blue    | blue 600 + white     | blue 100 + blue 700     | blue 500 + grey 950    | blue 900 + blue 300     |
| magenta | magenta 600 + white  | magenta 100 + magenta 700 | magenta 400 + grey 950 | magenta 900 + magenta 300 |
| neutral | grey 700 + white     | grey 200 + grey 800     | grey 200 + grey 950    | grey 800 + grey 200     |

Light solids are decision 0003's ladder, with its two named exceptions kept. Dark solids are the
steps the roles ship. Neutral light subtle is grey 200 under grey 800 rather than the literal
package-2 step, because grey 100 is the page itself.

## Rendered evidence

- `foundations-color-family--default`: the eight members by four cells, both modes side by side,
  each label painted live from its mode's map with the label ratio and the fill-on-page ratio
  printed under the cell.
- `foundations-color-palettes--family-colors`: the swatch matrix of the 16 fills per mode.
- `components-atoms-pill--on-both-planes`, `components-atoms-badge--all-colors`,
  `components-molecules-alert--all-statuses` and `custom-workout-workoutpill--all-statuses`, both
  themes: the six roles through the aliases, and the deload pill on the magenta subtle cell.

Weighed in Gate 2 batch 15 round 2, questions fd4-subtle (dark package 1, light package 2, no
washes, flag the misses) and fd5-family (all seven hues and neutral, the status tones alias);
batch 12 session-tint; decisions items 140(2), 140(3), 149(5) and 182.

## Checks

Contrast, WCAG 2.1, light. Label on fill (text, floor 4.5) and the fill's edge on grey 200, the
-1 plane (non-text, floor 3). Subtle fill against the grey 100 page is the flagged number.

| Member  | solid: white on fill | solid edge on grey 200 | subtle: hue 700 on hue 100 | subtle fill vs grey 100 page |
| ------- | -------------------- | ---------------------- | -------------------------- | ---------------------------- |
| red     | 4.57                 | 3.01                   | 6.15                       | 1.01 flag                    |
| orange  | **3.74 miss**        | **2.46 flag**          | 6.04                       | 1.00 flag                    |
| amber   | **3.63 miss**        | **2.38 flag**          | 5.85                       | 1.00 flag                    |
| green   | 4.56                 | 3.00                   | 5.63                       | 1.04 flag                    |
| cyan    | 4.74                 | 3.12                   | 5.75                       | 1.02 flag                    |
| blue    | 4.89                 | 3.22                   | 5.81                       | 1.01 flag                    |
| magenta | 5.46                 | 3.59                   | 6.32                       | 1.01 flag                    |
| neutral | 6.99                 | 4.60                   | 6.70                       | 1.27; 1.00 on the -1 plane   |

Contrast, dark. Label on fill and the fill's edge on the worst plane (grey 850 for a solid; grey
900 and grey 875 for a subtle).

| Member  | solid: grey 950 on fill | solid edge, worst plane | subtle: hue 300 on hue 900 | subtle fill vs grey 900 / 875 |
| ------- | ----------------------- | ----------------------- | -------------------------- | ----------------------------- |
| red     | 4.59                    | 3.16                    | 7.03                       | 1.00 / 1.08 flag              |
| orange  | 6.66                    | 4.59                    | 7.00                       | 1.02 / 1.07 flag              |
| amber   | 9.64                    | 6.64                    | 7.65                       | 1.03 / 1.05 flag              |
| green   | 9.07                    | 6.25                    | 6.95                       | 1.07 / 1.02 flag              |
| cyan    | 5.16                    | 3.56                    | 7.50                       | 1.06 / 1.03 flag              |
| blue    | 5.60                    | 3.86                    | 7.15                       | 1.04 / 1.04 flag              |
| magenta | 6.17                    | 4.25                    | 6.91                       | 1.00 / 1.09 flag              |
| neutral | 11.51                   | 7.93                    | 6.70                       | 1.40 / 1.29                   |

Two misses, both named exceptions decision 0003 recorded: the light orange 500 and amber 500 solids
under white read at large-text AA and are declared in `contrast-baseline.json` for the roles and
for the cells. The flag is the subtle fill against its plane: a hue 100 tint on the grey 100 page,
and a hue 900 tint on the elevated and raised planes, separate by hue alone (1.00 to 1.09). A
subtle capsule is identified by its label, so this is not a 1.4.11 miss, but it is why a compact
cue keeps an outline and why the Family story prints the number. Every dark subtle label now reads
between 6.91 and 7.65 on its fill, on every plane, where the washes read 4.0 to 4.5 on a card.

CVD: not applicable. No hue is added; every value is an existing ramp step, and the categorical
gate is unchanged.

Near-duplicate: by construction, the light `tint-*-subtle` cells equal the existing `*-subtle`
values (exact aliases, allowed). The gate reports nine pairs within ΔE 3 that are not exact: the
three warm hue 100 steps against one another and against the roles that already share them
(`tint-orange-subtle`, `tint-red-subtle`, `tint-magenta-subtle`, `brand-primary-subtle`,
`status-error-subtle`), `tint-green-solid` against `result-improve-dark`, `tint-red-solid` against
`result-degrade`, and the neutral cells against the `on-control-idle` pin. All are declared in
`near-dupe-baseline.json`: the family cells are ramp steps, and it is the result palette and the
pin that sit off the ramp.

## Decision

Family option 1 and subtle option 3.

Seven hues and neutral, four cells each, under one colour root `tint`, every value a ramp step.
Light keeps every value the roles have; the light info solid moves to blue 600, the ladder step.
Dark subtle becomes the opaque hue 900 cell under hue 300, and the two labels AW-133 held off the
family rung level with it: brand orange 400 to 300, error red 400 to 300. On a deep opaque fill the
fill carries the hue, so the red that read pink on an 8% wash reads red on red 900.

The six tone roles alias their hue's cells and keep their names, so every component that reads a
role moves with no change. A component that wants a hue with no status meaning reads `tint-*`
directly, as the WorkoutPill deload now does. The two named exceptions and the fill-vs-plane
numbers are recorded here rather than re-asked.

## Rejected alternatives

- Family option 2 (five status hues only): leaves deload and the neutral face hand-drawn, which is
  the drift this record ends.
- Family option 3 (a role per request): the six roles were already three encodings; a seventh
  would be a fourth.
- Subtle option 1 (package 1 in both modes): moves every light subtle value that was accepted at
  the light tuning for no gain.
- Subtle option 2 (package 2 in both modes): the dark hue 800 fill under hue 200 reads as a mid
  tone beside the planes and loses the weight the hue 900 cell has.
- Subtle option 4 (alpha in both modes): the plane-dependent label is the defect; mirroring it into
  light doubles it.
- A new root name other than `tint` (`hue-*`): reads closer to the frames but churns the registry
  that already records `tint`.
- `status-neutral-*` as an alias of the neutral cells: a neutral face has no state to report;
  components read `tint-neutral-*`.

## Consequences

Land together: `semantic.ts` (the family cell constants, the 32 tokens in both maps, the six roles
aliased), `global.css` (both blocks), `theme/config.ts` (both maps), `tailwind.config.js` (`tint`
and `on-tint` roots), the `semantic-hex-guard` fixture, `contrast-pairs.ts` (a pair per cell) and
`contrast-baseline.json` (four dark subtle entries and the light info solid removed; the two light
exception cells added), `near-dupe-baseline.json`, the dark subtle lines of `ramp-allowlist.json`,
`family-alias.test.ts`, the dark subtle label test, `wash-ladder.test.ts`, `solid-label.test.ts`,
`WorkoutPill.tsx` and its test, the Palettes swatches, the `Foundations/Color/Family` story,
`TOKENS.md` §1, the story contrast baseline, the API reports, and the changelog fragments.

Follow on the record: the Pill, Badge and FacetBar neutral faces on `tint-neutral-*`; the Session
tints and tool badges on `tint-*`; the `-muted` and `-strong` washes, which were not asked.
