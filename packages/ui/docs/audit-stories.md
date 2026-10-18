# `pnpm audit:stories`

Renders the stories a diff touches in a real browser and checks each rendered frame's layout.
jsdom has no layout, so none of this can be a Vitest test. The command lives in
`scripts/audit-stories.mjs` and `scripts/audit-stories/`, and is not published.

```bash
pnpm audit:stories [--base <ref>] [--stories <id,...>] [--all] [--dependents]
                   [--widths 360,768,1280] [--themes dark,light] [--touch]
                   [--out <dir>] [--url <loopback url>]
```

## What it checks

Every target story is rendered at each width in each theme. Each frame gets the checks below.
A **blocker** fails the run (exit 1). A **warning** is reported and never fails it.

### Blockers

| Kind             | Meaning                                                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overflow`       | A box leaves the viewport (or its fixed-width story frame), the page scrolls sideways, or content is cut by an `overflow: hidden` box. Content inside a horizontal scroller is exempt.        |
| `clipped-text`   | Text needs more room than its box or a clipping ancestor gives it.                                                                                                                            |
| `truncated-text` | Text is ellipsised or line-clamped and the full text does not fit.                                                                                                                            |
| `text-overlap`   | Two text boxes overlap.                                                                                                                                                                       |
| `hit-target`     | An interactive element is under 24x24px and closer than 24px to another target (WCAG 2.5.8). With `--touch` the minimum is 44x44px and spacing no longer excuses it. Inline links are exempt. |
| `contrast`       | An axe `color-contrast` failure where at least one colour is not a titan token.                                                                                                               |
| `render-error`   | The story threw, logged a console error, rendered an empty root, or failed to load (after one retry). It comes from the capture step, not the page checks, and makes the exit code 2.         |

### Warnings

| Kind                   | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `story-frame-overflow` | A story's own fixed-width frame (inline `style.width`) is wider than the viewport. The content inside is then audited against the frame, not the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `small-text`           | Text under 11px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `off-scale-spacing`    | Padding, margin or gap that is not on the spacing scale read from `tailwind.config.js`. 1px hairlines are on scale.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `theme-geometry-shift` | An element's box differs by more than 1px between dark and light. Only the outermost shifted box is reported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `stacked-inset`        | Padding on a box that paints nothing widens the visible gap between two siblings by 4px or more (`visible gap = layout gap + paddingBottom 12px on <selector> + paddingTop …`, every hidden padding named). Exempt: interactive boxes (the padding is a hit target; see _The interactive-box exemption_ below), painted boxes (the padding shows), a stack where every gap carries the same hidden padding (rhythm), table cells, and a gap whose content does not sit against the padding (4px or more of free space inside the box, as with a narrow label in a wide cell). Everything is measured on layout boxes, never glyph ink, so a large heading's line box does not hide its padding.                                                                                                                                                                                                                              |
| `edge-clearance`       | Text or a replaced element (`img`, `svg`, `canvas`, `video`) sits closer to the inside edge of its painted surface than the surface's declared padding by 1px or more, or text sits under 4px from an edge declared with no padding. Text is clamped to its own box, so a clipped or ellipsised label is not read as overflow. Glyph ink is measured, so a pill with `line-height: 1` and a 2px inset is fine. The surface is the nearest ancestor that paints a background or border, never an `svg`.                                                                                                                                                                                                                                                                                                                                                                            |
| `inset-asymmetry`      | A painted surface with equal, declared (1px or more) padding on two opposite sides whose content fills 80% of that axis sits more than 2px nearer one side (a row whose last cell stops short). Content is measured on layout boxes, not glyph ink, so a ragged paragraph never triggers it. A short label never triggers it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `alignment-near-miss`  | Two neighbouring children of a flex row almost share a line. The lines are the top, centre and bottom of ink and the first baseline (when both carry text on their first line), rounded to 0.25px. A pair is flagged when no line aligns within 1px and the smallest delta lies in 1px < d ≤ min(6px, half the smaller font size); a larger offset reads as a deliberate stagger. When `align-items` (or `align-self`) asks for `baseline`, any baseline delta over 1px is flagged whatever the band; the two baselines are the ones the browser aligns by: that of a child's first in-flow item, descending to the first text, and for an item with no baseline of its own (an icon, an image, an empty box) the bottom edge of its box, so a child that opens with an icon is read at the icon's bottom, not at the label beside it. Two siblings that both paint are also flagged when their heights differ by 1px < d ≤ 16px (cards meant to match). A wrapped row is split into visual lines (a child joins a line its box overlaps by half the smaller height) and only neighbours on one line are compared. Detail: `<selector> vs <other>: baseline Δ2.5, top Δ4, centre Δ2.75, bottom Δ1.5 (band ≤ 6px)`. |
| `gap-outlier`          | In a stack (flex column, flex row or block flow) with three or more inked children, an ink gap `g` is at least twice the smallest gap `m` and `g − m` is 8px or more. Exempt: a gap whose declared spacing (facing margins plus flex gap) equals a `--space-section-*` value, since the author declared the break. A divider (a painted child at most 2px thick) splits the stack, and gaps are compared only within each run. A literal px margin that equals a section value is exempt too, because computed style cannot tell it from the token. A stack that spreads its children is exempt as well: `justify-content: space-between`, `space-around` or `space-evenly` on the container, or an auto margin on the main axis of any child in the run, because free space, not the author, sets those gaps. A run needs three children in plain flow (absolutely positioned children are not counted). Grids and wrapping flex rows are skipped. Detail: `gap 24px between <a> and <b> is 3× the 8px gaps beside it`.                                                                                                                                                                                                                |
| `proximity-inversion`  | A child that is itself a stack of two or more inked children whose largest internal ink gap is at least 1.5 times the smaller gap between it and its neighbours in the parent stack (items inside the group sit clearly farther apart than the group sits from what is outside; a near tie is ambiguous and not flagged). Exempt: a painted group (its own background, border or shadow shows its extent), and a control row (two or more interactive items, at least half of the group, a button nested in a wrapper counts) whose items are at least 1.5 times as far apart as it sits from its neighbour, since a controls row is coupled to what it controls on purpose. A control row that is only as near as its items are apart (inner at least the outer gap, but under 1.5 times it) is still flagged, because the coupling did not happen. Dividers split the parent and the group as for `gap-outlier`; a single-child wrapper is not a group; grids are skipped. Detail: `<group>: items 18px apart inside, 12px from <neighbour> outside`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `font-size-near-miss`  | Two text elements on one visual line (same nearest flex-row ancestor, overlapping vertically by half the smaller height) whose computed font sizes differ by more than 0 and at most 2px. A larger step, such as a hero number and its unit, reads as deliberate contrast and is not flagged. Detail: `<a> 14px vs <b> 13px on one line: Δ1 (limit 2px)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `font-size-drift`      | The same element (child-index path and own text) has a different computed font size at two widths of one story, compared on the first theme. Only the outermost drifting element is reported, once per story, on the frame of the first width that differs. Text whose path changes between widths is not compared. Detail: `"Total" is 14px at 360, 16px at 1280`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Colour, elevation and glyph warnings (TD-935)

Kinds from `scripts/audit-stories/colour-probes.mjs` and `elevation-probes.mjs`. Each is a warning.

| Kind                  | Rule     | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full-chroma`         | DR-CO-08 | A status, result or data colour (the opaque value of a `--color-status-*`, `--color-result-*` or `--color-data-*` token, not `-subtle`) shows at under 0.95 strength: the element's effective opacity (its own times every ancestor's) or the colour's own alpha is below 0.95. The paints read are own text, an `svg` mark's stroke or fill, and the background of a mark 24px or smaller on both sides. Exempt: a disabled node or one inside a disabled ancestor (DR-IX-06 owns disabled opacity). The 0.95 floor is the registry row's. Detail: `text #22c55e (--color-status-success) at opacity 0.6 (floor 0.95)`.                                                                                                                                                 |
| `grey-on-colour`      | DR-CO-09 | Text sits on a chromatic backdrop (the composited opaque colour behind it has OKLCh C > 0.06 and 0.35 ≤ L ≤ 0.85) and its colour is not the value of any `--color-on-*` token. The detail names the text's token or `raw` and prefixes `neutral` when the text has C < 0.02. Text over a background image or gradient is skipped. The thresholds are the registry row's. Detail: `neutral text #9ca3af (raw) on #2563eb (L 0.55, C 0.22) is not an on-* token value (…)`.                                                                                                                                                                                                                                                                                                |
| `concept-token-drift` | DR-CO-11 | Two instances of one concept are painted more than ΔE 2 apart (OKLab × 100, the registry row's limit). Instances are the elements with one `data-concept` value plus those a story declares in `parameters.audit.concepts` (`{ live: ['[data-testid="a"]'] }`). An instance's paint is its own text colour, else its background, else its `svg` mark, else the first of those inside it. One finding per concept, on its first instance, listing each colour with its tokens. Different concepts are never compared. Detail: `concept "live": #22c55e (--color-status-success) ×2, #16a34a (raw) ×1; max ΔE 9.8 (limit 2)`.                                                                                                                                              |
| `nested-lift`         | DR-CO-14 | A lifted content box sits inside another lifted content box (the registry row's lifted depth ≤ 1). A box is lifted when its `box-shadow` has a lift layer: not inset, y > 0, blur > 0, a neutral colour (OKLCh C < 0.02), as `theme/lift-shadow.ts` `ambientLayers` draws it. It is floating, and never counted, with three or more lift layers (LIFT_AMBIENT steps 4 and 5, `FLOATING_LIFT_MIN`), `position: fixed`, or role `dialog`, `menu`, `listbox` or `tooltip`; a floating ancestor starts a new stack. Exempt: a box 24px or smaller on a side (a switch or slider thumb). Reported on the inner box, citing the nearest lifted ancestor. Detail: `lifted 160×80 box inside lifted [data-testid="a"] (lifted depth 2, limit 1)`.                                |
| `glow-scope`          | DR-CO-15 | A glow sits where the registry row says it may not. A glow layer is not inset, has x = y = 0, blur > 0 and a chromatic colour (C > 0.06), as `theme/elevation-planes.ts` `glowShadow` draws it; a focus ring (blur 0) is not one. It fires on a glow box over 24px on either side, on a glow node with its own text, on one inside an `svg`, and on the second and later glow in one instance (`instanceRoots`, so each cell of an `--all-colors`-style variant grid is its own instance). One finding per node. Detail: `glow on a 40×40 box (limit 24px)`, `glow 2 of 2 in one instance (limit 1)`.                                                                                                                                                                    |
| `glyph-drift`         | DR-RB-04 | Two copies of one icon in one instance differ by more than 1px in width or height, or paint different colours on the same backdrop (the registry row's ">1px or any colour"). An icon is an `svg` 48px or smaller on both sides; copies share the collector's `glyph` (a geometry hash, or `data-icon`). The backdrop is the composited opaque fill behind the icon, so an icon in a filled button may take the on-\* colour. Copies whose controls differ in state (selected, current, pressed, checked, disabled), or that the story gives different roles in `parameters.audit.glyphRoles`, are not compared. One finding per glyph per instance, on the first copy that differs. Detail: `glyph 1x2y3z: size 18×18 vs 16×16 at [data-testid="a"] > svg (limit 1px)`. |

### Spacing-relation warnings (TD-937)

Kinds from `scripts/audit-stories/relation-probes.mjs`. Each is a warning.

| Kind | Rule | Meaning |
| ---- | ---- | ------- |

### Typography warnings (TD-938)

Kinds from `scripts/audit-stories/type-probes.mjs`. Each is a warning.

| Kind | Rule | Meaning |
| ---- | ---- | ------- |

### Retunes from the catch report (TD-740)

The 1.5 ratio comes from the numbers of a catch report over historic review rounds: the
proximity inversions the reviewer raised read 3.5 to 4.25 times (a 14 to 17px block 4px from its
neighbour), while the noise sat at or near 1 (11.5px against 9px inside painted tiles, 14px against
12px). The ratio is a threshold chosen from that spread, not a derived constant; raise it if a
real round shows a near tie that matters. Painted groups, control rows and spread rows were the
dominant false positives, and none of the retunes changes a kind's severity: every kind stays a
warning, and none is promoted.

**The interactive-box exemption in `stacked-inset` (unchanged, waiting on the owner).** The probe
stops walking down a box that is interactive, so padding on a button or link is never reported.
The reason: that padding is the hit target (a 44px box around a 20px glyph), so it is not
invisible and not a stray inset. The cost is a known miss: a control whose box is much larger than
its ink, sitting under a card, is reported by nothing in `stacked-inset` (proximity-inversion
catches the same gap instead). The catch report suggests narrowing the exemption to controls whose
box is within 4px of their ink and flagging the larger target. That changes what counts as a
defect for every interactive element, so it is an owner decision; the behaviour is deliberately
left as it is until the owner decides.

`edge-clearance` and `inset-asymmetry` only judge content that the surface's padding positions: the
content and every box between it and the surface are in flow (an absolutely positioned accent bar
or tick label is placed on purpose), the surface declares padding of 1px or more on that axis, and
the surface is not a data fill (`progressbar`, `meter`, `slider`). `stacked-inset` skips data fills
and out-of-flow siblings the same way.

`font-size-drift` stays a warning by owner decision (2026-10-05): one Typography role keeps one
size at every width, and a breakpoint-driven size is an exception the story states. A story that
means it can ignore the warning; nothing opts out in the DOM.

`contrast-token` is a separate finding list, `contrast_token`, not a blocker: a contrast failure
where both colours are titan tokens is a token-pair question, not a story defect. It is counted in
the summary line but never fails the run.

At most 25 findings per kind are kept per frame.

## Reading `dom.json`

`dom.json` sits in the output directory next to one PNG per frame (`<story id>/<width>-<theme>.png`).
The summary prints at most 30 lines and groups repeated blockers, so read the file, not only the
printed lines. The PNGs show what geometry cannot measure; look at them too.

`{ "stories": [...] }` holds one entry per story, width and theme:

- `id`, `title`, `width`, `theme`, `touch` (`on`, `minTarget`): which frame this is.
- `rendered`: `false` means the story did not render; `error` says why.
- `blockers`, `warnings`, `contrast_token`: arrays of `{ kind, selector, detail }`. `selector` is a
  short path from `#storybook-root` (a `data-testid` when one exists); `detail` carries the measured
  numbers, such as the box that left the viewport and by how far. A finding whose kind enforces a
  design rule also carries `rule`, its id in [design-rules.md](./design-rules.md) (`DR-LA-04` for
  `stacked-inset`); the map is `scripts/audit-stories/rules.mjs`.
- `metrics`, `axe.violations`: raw page metrics and the axe contrast result.
- `shot`: the PNG, relative to the output directory.

The summary prints no per-kind counts. This prints, per warning kind, the findings over all frames,
the distinct findings (story, selector and detail) and the stories that have one. The cap of 25 per
kind per frame makes each a lower bound.

```bash
node -e 'const d=require(process.argv[1]);const n={},u={},s={};for(const e of d.stories)for(const w of e.warnings||[]){n[w.kind]=(n[w.kind]||0)+1;(u[w.kind]??=new Set).add([e.id,w.selector,w.detail].join("|"));(s[w.kind]??=new Set).add(e.id)}for(const k of Object.keys(n).sort())console.log(k.padEnd(24),"frames-findings",n[k],"distinct",u[k].size,"stories",s[k].size)' "$OUT/dom.json"
```

### Probe data (not in `dom.json`)

The layout probes judge what `scripts/audit-stories/layout-collect.mjs` measures in the page. That
data feeds the judges and is not written to `dom.json`. Each collected node carries, besides its
box, padding, border, margin, flex layout, text metrics and ink:

- `style`: computed `color` and `backgroundColor` (`rgb[a]()` strings), `hasBackgroundImage`,
  `opacity`, `effectiveOpacity` (the product of `opacity` over the node and every ancestor out to
  `<html>`), the raw computed `boxShadow`, `direction` and `textAlign`.
- `text` (nodes with their own text): `textTransform`, `letterSpacing` in px (`normal` reads 0),
  numeric `fontWeight`, `family` (the first family, unquoted), `color`, `ownText` (the first 40
  characters), and `backdrop`: the opaque `#rrggbb` behind the text, compositing the node's and each
  ancestor's background colour in sRGB until one is opaque (white behind `<html>`). A background
  image stops the walk: `backdrop` is then `null` and `backdropImage` is `true`.
- `glyph` and `paint` (`svg` nodes): a djb2 hash of the shapes' geometry attributes, or the
  `data-icon` attribute when present, so two copies of one icon match; and the computed stroke,
  else fill, of the first painted shape.
- `concept`: the `data-concept` attribute. `state`: `selected` (`aria-selected`), `current`,
  `pressed`, `checked` (the ARIA value, `null` when absent or `false`) and `disabled` (the node or
  an ancestor has `disabled` or `aria-disabled="true"`). `heading`: the level of a
  `role="heading"` node (`aria-level`, default 2) or of an `h1`-`h6`.

The layout also carries `audit`, read from the story's `parameters.audit`: `concepts` maps a concept
name to selectors and `glyphRoles` maps a selector to a role. Each selector is resolved to the ids
of collected nodes (`{ concepts: { name: [id] }, glyphRoles: { id: role } }`). The parameters are
read from Storybook's preview object, which is internal API; outside Storybook both maps are empty.

## Fixing findings

- Fix at the cause. Find the element that is too wide or too tight and change it.
- Never hide an overflow with `overflow-hidden`. It turns `overflow` into `clipped-text`, and the
  content is still lost.
- Truncating a primary title is always a defect, even when the check cannot tell.
- Do not delete a story to clear a finding.
- Fix `off-scale-spacing` unless it is chart geometry, and fix `theme-geometry-shift`.

### Two-loop limit

Audit, then fix (loop 1). Audit again, then fix what remains (loop 2). A third audit may record
the final state, but start no third fix loop. Report each remaining blocker with its story, width,
theme and the reason it remains.

## Targeting

Without `--stories` or `--all`, the targets come from the diff against `--base` (default
`origin/main`): committed changes, working tree changes and untracked files.

- A changed `*.stories.tsx` targets itself. Any other changed file under `src/` targets every story
  in its own directory.
- `--dependents` adds the stories of components whose `dependsOn` in `src/arch/arch-graph.json`
  names a changed component, one level only.
- A change under `src/theme/`, `tailwind.config.js` or `.storybook/` touches every story, so the
  command refuses and asks for `--stories` or `--all`.
- More than 40 targets refuses without `--all`.
- No target at all (a `src/hooks/` change, say) exits 1 and lists the changed files, so a silent
  no-op cannot pass as clean. Name the stories with `--stories`.

| Flag                 | Default        | Effect                                                             |
| -------------------- | -------------- | ------------------------------------------------------------------ |
| `--stories <id,...>` | from the diff  | Audit exactly these story ids.                                     |
| `--all`              | off            | Audit the whole catalogue and lift the 40-story cap.               |
| `--widths <list>`    | `360,768,1280` | Integers from 200 to 4000.                                         |
| `--themes <list>`    | `dark,light`   | Any of `dark`, `light`.                                            |
| `--touch`            | off            | Adds a 320 width and holds hit targets to 44px.                    |
| `--out <dir>`        | under `TMPDIR` | Output directory; must be outside the repo.                        |
| `--url <loopback>`   | start our own  | Reuse a Storybook you already run. The command then stops nothing. |

## Exit codes

| Code | Meaning                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 0    | Clean. Warnings are allowed.                                                                           |
| 1    | Blockers remain, or the diff touches no story.                                                         |
| 2    | A story failed to render. Fix this first; it wins over exit 1.                                         |
| 64   | Usage error, targeting refusal (theme or config change, over 40 stories) or Storybook failed to start. |
| 70   | Unexpected error.                                                                                      |
| 130  | Interrupted by SIGINT, SIGTERM or SIGHUP, after the Storybook it started was stopped.                  |

## Load and port rules

- **It starts its own isolated Storybook.** It runs `scripts/storybook-launch.mjs --isolated`,
  which takes a port from 6100 to 6199 and passes `--exact-port`. Port 6006 is never used or
  touched, so another session's Storybook is safe. Do not start a Storybook for it.
- **It stops only what it started.** Stopping signals the launcher's process group by PID
  (SIGTERM, then SIGKILL after 5s), on success, on error and on interrupt. Nothing is killed by
  name. The run also checks that the process listening on the port belongs to its own group, so it
  cannot audit another tree's server.
- **`--url` stops nothing.** It must be an `http` loopback URL. Use it to point at a server you
  already run.
- **Output stays out of the repo.** It goes to `$TMPDIR/titan-audit-stories/<short sha>/run-<n>/`,
  or `--out`. With `TMPDIR` unset and no `--out` it refuses.
- **Load is bounded.** One Chromium, at most three pages at once, one retry per failed render.
  Budget about 20s to start Storybook and about 6s per story. Narrow with `--stories` rather than
  reaching for `--all`.

`pnpm storybook:ports` lists the servers running; the run leaves none rooted in its tree.
