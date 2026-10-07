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
| `stacked-inset`        | Padding on a box that paints nothing widens the visible gap between two siblings by 4px or more (`visible gap = layout gap + paddingBottom 12px on <selector> + paddingTop …`, every hidden padding named). Exempt: interactive boxes (the padding is a hit target), painted boxes (the padding shows), a stack where every gap carries the same hidden padding (rhythm), table cells, and a gap whose content does not sit against the padding (4px or more of free space inside the box, as with a narrow label in a wide cell). Everything is measured on layout boxes, never glyph ink, so a large heading's line box does not hide its padding.                                                                                                                                                                                                                              |
| `edge-clearance`       | Text or a replaced element (`img`, `svg`, `canvas`, `video`) sits closer to the inside edge of its painted surface than the surface's declared padding by 1px or more, or text sits under 4px from an edge declared with no padding. Text is clamped to its own box, so a clipped or ellipsised label is not read as overflow. Glyph ink is measured, so a pill with `line-height: 1` and a 2px inset is fine. The surface is the nearest ancestor that paints a background or border, never an `svg`.                                                                                                                                                                                                                                                                                                                                                                            |
| `inset-asymmetry`      | A painted surface with equal, declared (1px or more) padding on two opposite sides whose content fills 80% of that axis sits more than 2px nearer one side (a row whose last cell stops short). Content is measured on layout boxes, not glyph ink, so a ragged paragraph never triggers it. A short label never triggers it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `alignment-near-miss`  | Two neighbouring children of a flex row almost share a line. The lines are the top, centre and bottom of ink and the first baseline (when both carry text on their first line), rounded to 0.25px. A pair is flagged when no line aligns within 1px and the smallest delta lies in 1px < d ≤ min(6px, half the smaller font size); a larger offset reads as a deliberate stagger. When `align-items` (or `align-self`) asks for `baseline`, any baseline delta over 1px is flagged whatever the band. Two siblings that both paint are also flagged when their heights differ by 1px < d ≤ 16px (cards meant to match). A wrapped row is split into visual lines (a child joins a line its box overlaps by half the smaller height) and only neighbours on one line are compared. Detail: `<selector> vs <other>: baseline Δ2.5, top Δ4, centre Δ2.75, bottom Δ1.5 (band ≤ 6px)`. |
| `gap-outlier`          | In a stack (flex column, flex row or block flow) with three or more inked children, an ink gap `g` is at least twice the smallest gap `m` and `g − m` is 8px or more. Exempt: a gap whose declared spacing (facing margins plus flex gap) equals a `--space-section-*` value, since the author declared the break. A divider (a painted child at most 2px thick) splits the stack, and gaps are compared only within each run. A literal px margin that equals a section value is exempt too, because computed style cannot tell it from the token. Grids and wrapping flex rows are skipped. Detail: `gap 24px between <a> and <b> is 3× the 8px gaps beside it`.                                                                                                                                                                                                                |
| `proximity-inversion`  | A child that is itself a stack of two or more inked children whose largest internal ink gap is at least as big as the smaller gap between it and its neighbours in the parent stack (items inside the group sit as far apart as the group sits from what is outside). Dividers split the parent and the group as for `gap-outlier`; a single-child wrapper is not a group; grids are skipped. Detail: `<group>: items 12px apart inside, 12px from <neighbour> outside`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `font-size-near-miss`  | Two text elements on one visual line (same nearest flex-row ancestor, overlapping vertically by half the smaller height) whose computed font sizes differ by more than 0 and at most 2px. A larger step, such as a hero number and its unit, reads as deliberate contrast and is not flagged. Detail: `<a> 14px vs <b> 13px on one line: Δ1 (limit 2px)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `font-size-drift`      | The same element (child-index path and own text) has a different computed font size at two widths of one story, compared on the first theme. Only the outermost drifting element is reported, once per story, on the frame of the first width that differs. Text whose path changes between widths is not compared. Detail: `"Total" is 14px at 360, 16px at 1280`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

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
  numbers, such as the box that left the viewport and by how far.
- `metrics`, `axe.violations`: raw page metrics and the axe contrast result.
- `shot`: the PNG, relative to the output directory.

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
